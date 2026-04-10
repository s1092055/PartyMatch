import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LoadingSpinner } from "../../shared/components/feedback/LoadingSpinner.jsx";
import { useAuth } from "../../shared/modules/auth/hooks/useAuth.js";
import { useDrafts } from "../../shared/modules/groups/hooks/useDrafts.js";
import { useGroupsActions } from "../../shared/modules/groups/state/index.js";
import {
  createGroup,
  deleteDraft,
  saveDraft,
} from "../../shared/modules/groups/api/groupApi.js";
import {
  calculatePricePerSeat,
  getPlanById,
  getServiceById,
} from "../../data/services.config.js";
import { CreateGroupDraftPrompt } from "./components/CreateGroupDraftPrompt.jsx";
import { CreateGroupExitConfirmModal } from "./components/CreateGroupExitConfirmModal.jsx";
import { CreateGroupFlowFooter } from "./components/CreateGroupFlowFooter.jsx";
import { CreateGroupFlowHeader } from "./components/CreateGroupFlowHeader.jsx";
import { CreateGroupIntroScreen } from "./components/CreateGroupIntroScreen.jsx";
import { CreateGroupStep1Service } from "./components/CreateGroupStep1Service.jsx";
import { CreateGroupStep2Plan } from "./components/CreateGroupStep2Plan.jsx";
import { CreateGroupStep3Settings } from "./components/CreateGroupStep3Settings.jsx";
import { CreateGroupStep4Review } from "./components/CreateGroupStep4Review.jsx";
import { CREATE_GROUP_EMPTY_FORM } from "./utils/createGroupDefaults.js";
import { mapCreateGroupFormToGroupPayload } from "./utils/createGroupMapper.js";
import { validateCreateGroupStep } from "./utils/createGroupValidation.js";
import {
  buildContactMethodTemplate,
  resolveContactMethodTemplate,
  resolveContactMethodValue,
} from "../../shared/modules/groups/utils/contactMethodTemplate.js";
import {
  DASHBOARD_MODES,
  getDashboardModeStorageKey,
} from "../manage-group/dashboardNavigation.config.js";

const TOTAL_STEPS = 4;
const MotionStage = motion.section;
const CREATE_GROUP_EXIT_PATH = "/";

const stageVariants = {
  enter: (direction) => ({
    opacity: 0,
    x: direction > 0 ? 60 : -60,
    y: 14,
    filter: "blur(12px)",
  }),
  center: {
    opacity: 1,
    x: 0,
    y: 0,
    filter: "blur(0px)",
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction > 0 ? -48 : 48,
    y: -10,
    filter: "blur(8px)",
  }),
};

function formatPriceLabel(value, currency) {
  if (value == null || Number.isNaN(Number(value))) return "--";
  const formatted = new Intl.NumberFormat("zh-TW").format(Number(value));
  return `${currency} ${formatted}`;
}

function normalizeDraftStep(step) {
  const numericStep = Number(step);
  if (!Number.isFinite(numericStep)) return 0;
  return Math.max(0, Math.min(TOTAL_STEPS - 1, Math.round(numericStep)));
}

function normalizeDraftForm(form) {
  const baseForm = {
    ...CREATE_GROUP_EMPTY_FORM,
    ...(form && typeof form === "object" ? form : {}),
  };

  const contactMethod = resolveContactMethodValue(
    baseForm.contactMethodTemplate ?? baseForm.contactMethod,
  );

  return {
    ...baseForm,
    contactMethod,
    contactMethodTemplate: resolveContactMethodTemplate(
      baseForm.contactMethodTemplate,
      contactMethod,
    ),
  };
}

function normalizeDraftData(draft) {
  if (!draft || typeof draft !== "object") return null;

  return {
    id: typeof draft.id === "string" ? draft.id : null,
    ownerId:
      typeof draft.ownerId === "string" && draft.ownerId
        ? draft.ownerId
        : typeof draft.userId === "string"
          ? draft.userId
          : "",
    step: normalizeDraftStep(draft.step),
    form: normalizeDraftForm(draft.form),
    savedAt: typeof draft.savedAt === "string" ? draft.savedAt : "",
  };
}

function buildDraftPreview(draft) {
  if (!draft) return null;

  const service = getServiceById(draft.form?.serviceId);
  const plan = getPlanById(draft.form?.serviceId, draft.form?.planId);

  return {
    ...draft,
    serviceLabel: service?.name ?? "尚未選擇服務",
    planLabel: plan?.name ?? "尚未選擇方案",
  };
}

export function CreateGroupFlowPage({ initialData = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { refreshGroups } = useGroupsActions();
  const { drafts, isLoading: isDraftsLoading } = useDrafts();
  const ownerId = user?.id ?? null;
  const [requestedResumeDraft] = useState(() => Boolean(location.state?.resumeDraft));
  const [requestedStartFresh] = useState(() => Boolean(location.state?.startFresh));
  const [requestedInitialDataFromRoute] = useState(() =>
    normalizeDraftData(location.state?.initialData ?? null),
  );
  const requestedInitialData = useMemo(
    () => requestedInitialDataFromRoute ?? normalizeDraftData(initialData),
    [initialData, requestedInitialDataFromRoute],
  );
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(CREATE_GROUP_EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepDirection, setStepDirection] = useState(1);
  const [draftId, setDraftId] = useState(null);
  const [draftPrompt, setDraftPrompt] = useState(null);
  const [showIntroScreen, setShowIntroScreen] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);

  useEffect(() => {
    if (requestedResumeDraft || requestedStartFresh || requestedInitialDataFromRoute) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [
    location.pathname,
    navigate,
    requestedInitialDataFromRoute,
    requestedResumeDraft,
    requestedStartFresh,
  ]);

  useEffect(() => {
    if (isDraftsLoading) return;

    const initialDraft = requestedInitialData ?? drafts[0] ?? null;
    const shouldResumeDraft = Boolean(
      (requestedResumeDraft || requestedInitialData) && initialDraft,
    );
    const shouldStartFresh = requestedStartFresh;

    setDraftId(initialDraft?.id ?? null);
    setStep(shouldResumeDraft ? initialDraft.step : 0);
    setForm(shouldResumeDraft ? initialDraft.form : normalizeDraftForm(null));
    setErrors({});
    setIsSubmitting(false);
    setStepDirection(1);
    setDraftPrompt(
      shouldResumeDraft || shouldStartFresh || requestedInitialData
        ? null
        : buildDraftPreview(initialDraft),
    );
    setShowIntroScreen(
      shouldResumeDraft ? false : shouldStartFresh || !initialDraft,
    );
    setLastSavedAt(initialDraft?.savedAt ?? "");
  }, [drafts, isDraftsLoading, requestedInitialData, requestedResumeDraft, requestedStartFresh]);

  const service = useMemo(() => getServiceById(form.serviceId), [form.serviceId]);
  const plan = useMemo(
    () => getPlanById(form.serviceId, form.planId),
    [form.planId, form.serviceId],
  );

  const derived = useMemo(() => {
    const totalSeats = plan?.totalSeats ?? null;
    const minSeats = plan?.minAvailableSeats ?? 1;
    const maxSeats = plan?.maxAvailableSeats ?? minSeats;
    const availableSeats =
      form.availableSeats === "" ? null : Number(form.availableSeats);
    const reservedSeats =
      totalSeats != null && availableSeats != null && !Number.isNaN(availableSeats)
        ? totalSeats - availableSeats
        : null;
    const pricePerSeat = calculatePricePerSeat(form.serviceId, form.planId);

    return {
      totalSeats,
      minSeats,
      maxSeats,
      availableSeats,
      reservedSeats,
      pricePerSeat,
      pricePerSeatLabel:
        pricePerSeat != null && plan
          ? `${formatPriceLabel(Math.round(pricePerSeat), plan.currency)} / 位 / ${
              plan.billingCycle === "yearly" ? "年" : "月"
            }`
          : "--",
      billingCycleLabel: plan
        ? plan.billingCycle === "yearly"
          ? "每年"
          : "每月"
        : "--",
    };
  }, [form.availableSeats, form.planId, form.serviceId, plan]);

  function resetFlow() {
    setDraftId(null);
    setStep(0);
    setStepDirection(1);
    setForm(CREATE_GROUP_EMPTY_FORM);
    setErrors({});
    setIsSubmitting(false);
  }

  function update(key, value) {
    if (key === "servicePlan") {
      setForm((prev) => ({
        ...prev,
        serviceId: value.serviceId,
        planId: value.planId,
        availableSeats: String(value.minAvailableSeats ?? 1),
      }));
      return;
    }

    if (key === "serviceId") {
      setForm((prev) => ({
        ...prev,
        serviceId: value,
        planId: "",
        availableSeats: "",
      }));
      return;
    }

    if (key === "planId") {
      const nextPlan = getPlanById(form.serviceId, value);
      const nextMinSeats = nextPlan?.minAvailableSeats ?? 1;
      setForm((prev) => ({
        ...prev,
        planId: value,
        availableSeats: String(nextMinSeats),
      }));
      return;
    }

    if (key === "contactMethod") {
      setForm((prev) => ({
        ...prev,
        contactMethod: value,
        contactMethodTemplate: buildContactMethodTemplate(value),
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateStep(index) {
    const nextErrors = validateCreateGroupStep({
      step: index,
      formData: form,
      derived,
    });

    setErrors((prev) => ({ ...prev, ...nextErrors, form: "" }));

    return Object.keys(nextErrors).length === 0;
  }

  function handleBack() {
    if (step === 0) {
      setShowIntroScreen(true);
      return;
    }

    setStepDirection(-1);
    setStep((current) => Math.max(current - 1, 0));
  }

  function handleNext() {
    if (!validateStep(step)) return;
    setStepDirection(1);
    setStep((current) => Math.min(current + 1, TOTAL_STEPS - 1));
  }

  function handleResumeDraft() {
    if (!draftPrompt) return;
    setDraftId(draftPrompt.id ?? null);
    setForm(draftPrompt.form);
    setStep(draftPrompt.step);
    setStepDirection(1);
    setErrors({});
    setDraftPrompt(null);
    setShowIntroScreen(false);
    setLastSavedAt(draftPrompt.savedAt ?? "");
  }

  async function handleStartFresh() {
    if (draftId && ownerId) {
      await deleteDraft(draftId, ownerId);
    }
    resetFlow();
    setDraftPrompt(null);
    setShowIntroScreen(true);
    setLastSavedAt("");
  }

  function handleStartFlow() {
    setShowIntroScreen(false);
  }

  function handleOpenExitConfirm() {
    setIsExitConfirmOpen(true);
  }

  function handleCloseExitConfirm() {
    setIsExitConfirmOpen(false);
  }

  function handleExitIntro() {
    navigate(CREATE_GROUP_EXIT_PATH, { replace: true });
  }

  async function handleSaveDraft(exitAfterSave = false) {
    const hasDraftableContent =
      Boolean(ownerId) &&
      !showIntroScreen &&
      (Boolean(form.serviceId) ||
        Boolean(form.planId) ||
        Boolean(form.availableSeats) ||
        Boolean(String(form.joinPolicy ?? "").trim()) ||
        Boolean(String(form.groupDescription ?? "").trim()) ||
        Boolean(String(form.memberRule ?? "").trim()) ||
        Boolean(String(form.paymentReminder ?? "").trim()) ||
        Boolean(
          resolveContactMethodValue(
            form.contactMethodTemplate ?? form.contactMethod,
          ),
        ));

    if (!hasDraftableContent) {
      if (exitAfterSave) {
        navigate(CREATE_GROUP_EXIT_PATH, { replace: true });
      }
      return;
    }

    const savedDraft = await saveDraft({
      id: draftId ?? undefined,
      step,
      form,
      ownerId,
    });

    if (savedDraft?.savedAt) {
      setDraftId(savedDraft.id ?? null);
      setLastSavedAt(savedDraft.savedAt);
    }

    if (exitAfterSave) {
      navigate(CREATE_GROUP_EXIT_PATH, { replace: true });
    }
  }

  async function handleConfirmExit() {
    if (!ownerId) {
      setIsExitConfirmOpen(false);
      navigate(CREATE_GROUP_EXIT_PATH, { replace: true });
      return;
    }

    setIsExitConfirmOpen(false);
    await handleSaveDraft(true);
  }

  async function handleSubmit() {
    const step0Valid = validateStep(0);
    const step1Valid = validateStep(1);
    const step2Valid = validateStep(2);

    if (!step0Valid || !step1Valid || !step2Valid || !service || !plan || derived.totalSeats == null) {
      return;
    }

    const payload = mapCreateGroupFormToGroupPayload(form, service, plan);

    setIsSubmitting(true);

    try {
      await createGroup(payload, user);
      if (draftId && ownerId) {
        await deleteDraft(draftId, ownerId);
      }
      await refreshGroups();
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          getDashboardModeStorageKey(ownerId),
          DASHBOARD_MODES.HOST,
        );
      }
      setLastSavedAt("");
      resetFlow();
      navigate("/manage-group", { replace: true });
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        form: error.message || "建立群組失敗，請稍後再試。",
      }));
    } finally {
      setIsSubmitting(false);
    }
  }

  const footerBackLabel = step === TOTAL_STEPS - 1 ? "返回編輯" : "上一步";
  const footerNextLabel = step === TOTAL_STEPS - 2 ? "查看預覽" : "下一步";
  const footerSubmitLabel = "確認建立";
  const stageMaxWidthClass =
    step === TOTAL_STEPS - 1 ? "max-w-[1080px]" : "max-w-[780px]";
  const currentStepErrors = useMemo(
    () =>
      step < TOTAL_STEPS - 1
        ? validateCreateGroupStep({
            step,
            formData: form,
            derived,
          })
        : {},
    [derived, form, step],
  );
  const isPrimaryActionDisabled =
    isSubmitting || Object.keys(currentStepErrors).length > 0;
  const sharedFooterProps = {
    step,
    totalSteps: TOTAL_STEPS,
    onBack: handleBack,
    onNext: handleNext,
    onSubmit: handleSubmit,
    isSubmitting,
    backDisabled: isSubmitting,
    primaryDisabled: isPrimaryActionDisabled,
    backLabel: footerBackLabel,
    nextLabel: footerNextLabel,
    submitLabel: footerSubmitLabel,
  };

  if (isDraftsLoading) {
    return <LoadingSpinner label="正在載入建立群組資料..." />;
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white text-black">
      <CreateGroupFlowHeader
        onExit={draftPrompt || showIntroScreen ? handleExitIntro : handleOpenExitConfirm}
        lastSavedAt={lastSavedAt}
        exitLabel={draftPrompt || showIntroScreen ? "退出" : ""}
      />

      <main className="flex-1 min-h-0 overflow-hidden">
        {draftPrompt ? (
          <div className="h-full overflow-y-auto bg-white px-4 py-5 sm:px-6 lg:px-10">
            <CreateGroupDraftPrompt
              draft={draftPrompt}
              onResume={handleResumeDraft}
              onStartFresh={handleStartFresh}
            />
          </div>
        ) : showIntroScreen ? (
          <CreateGroupIntroScreen onStart={handleStartFlow} />
        ) : (
          <div className="h-full bg-white px-4 py-5 sm:px-6 lg:px-10">
            <div className="mx-auto flex h-full min-h-0 w-full max-w-[1320px] justify-center overflow-hidden bg-white">
              <section className="flex min-w-0 min-h-0 w-full flex-col overflow-hidden bg-white">
                <div className="flex-1 min-h-0 overflow-hidden bg-white px-1 py-1 sm:px-2 sm:py-2 lg:px-3 lg:py-3">
                  <AnimatePresence mode="wait" initial={false} custom={stepDirection}>
                    <MotionStage
                      key={step}
                      className={[
                        "mx-auto h-full min-h-0 w-full",
                        stageMaxWidthClass,
                      ].join(" ")}
                      custom={stepDirection}
                      variants={stageVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {step === 0 ? (
                        <CreateGroupStep1Service
                          form={form}
                          onChange={update}
                          errors={errors}
                        />
                      ) : null}

                      {step === 1 ? (
                        <CreateGroupStep2Plan
                          form={form}
                          onChange={update}
                          errors={errors}
                          officialLink={plan?.officialLink || service?.officialUrl || ""}
                        />
                      ) : null}

                      {step === 2 ? (
                        <CreateGroupStep3Settings
                          form={form}
                          onChange={update}
                          errors={errors}
                          plan={plan}
                          derived={derived}
                        />
                      ) : null}

                      {step === 3 ? (
                        <CreateGroupStep4Review
                          service={service}
                          plan={plan}
                          form={form}
                          derived={derived}
                        />
                      ) : null}
                    </MotionStage>
                  </AnimatePresence>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      {!draftPrompt && !showIntroScreen ? (
        <CreateGroupFlowFooter {...sharedFooterProps} />
      ) : showIntroScreen ? (
        <footer className="shrink-0 border-t border-black/10 bg-white">
          <div className="mx-auto flex w-full max-w-[1480px] items-center justify-end px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4 sm:px-6 lg:px-10">
            <button
              type="button"
              onClick={handleStartFlow}
              className="inline-flex min-w-[152px] items-center justify-center rounded-full bg-black px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-black/85"
            >
              開始吧
            </button>
          </div>
        </footer>
      ) : null}

      <CreateGroupExitConfirmModal
        open={isExitConfirmOpen}
        onClose={handleCloseExitConfirm}
        onConfirm={handleConfirmExit}
      />
    </div>
  );
}
