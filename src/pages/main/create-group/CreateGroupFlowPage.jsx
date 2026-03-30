import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../shared/modules/auth/hooks/useAuth.js";
import { useGroupsActions } from "../../../shared/modules/groups/state/index.js";
import {
  calculatePricePerSeat,
  getPlanById,
  getServiceById,
} from "../../../data/services.config.js";
import { CreateGroupDraftPrompt } from "./components/CreateGroupDraftPrompt.jsx";
import { CreateGroupExitConfirmModal } from "./components/CreateGroupExitConfirmModal.jsx";
import { CreateGroupFlowFooter } from "./components/CreateGroupFlowFooter.jsx";
import { CreateGroupFlowHeader } from "./components/CreateGroupFlowHeader.jsx";
import { CreateGroupIntroScreen } from "./components/CreateGroupIntroScreen.jsx";
import { CreateGroupStep1Service } from "./components/CreateGroupStep1Service.jsx";
import { CreateGroupStep2Plan } from "./components/CreateGroupStep2Plan.jsx";
import { CreateGroupStep3Settings } from "./components/CreateGroupStep3Settings.jsx";
import { CreateGroupStep4Review } from "./components/CreateGroupStep4Review.jsx";
import {
  clearCreateGroupDraft,
  loadCreateGroupDraft,
  saveCreateGroupDraft,
} from "./utils/createGroupDraft.js";
import { CREATE_GROUP_EMPTY_FORM } from "./utils/createGroupDefaults.js";
import { mapCreateGroupFormToGroupPayload } from "./utils/createGroupMapper.js";
import { buildCreateGroupSummaryData } from "./utils/createGroupSummary.js";
import { validateCreateGroupStep } from "./utils/createGroupValidation.js";
import { createGroup } from "../../../shared/modules/groups/services/groupService.js";

const TOTAL_STEPS = 4;
const MotionStage = motion.section;

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

export function CreateGroupFlowPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { createGroup: addCreatedGroup } = useGroupsActions();
  const userId = user?.uid ?? null;
  const initialDraft = useMemo(() => loadCreateGroupDraft(userId), [userId]);
  const shouldResumeDraft = Boolean(location.state?.resumeDraft && initialDraft);
  const shouldStartFresh = Boolean(location.state?.startFresh);
  const [step, setStep] = useState(() => (shouldResumeDraft ? initialDraft.step : 0));
  const [form, setForm] = useState(() =>
    shouldResumeDraft ? initialDraft.form : CREATE_GROUP_EMPTY_FORM,
  );
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepDirection, setStepDirection] = useState(1);
  const [draftPrompt, setDraftPrompt] = useState(() =>
    shouldResumeDraft || shouldStartFresh ? null : buildDraftPreview(initialDraft),
  );
  const [showIntroScreen, setShowIntroScreen] = useState(
    () => shouldStartFresh || (!initialDraft && !shouldResumeDraft),
  );
  const [lastSavedAt, setLastSavedAt] = useState(() => initialDraft?.savedAt ?? "");
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);

  useEffect(() => {
    if (location.state?.resumeDraft || location.state?.startFresh) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

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

  const summaryData = useMemo(
    () =>
      buildCreateGroupSummaryData({
        service,
        plan,
        derived,
        step,
        form,
      }),
    [derived, form, plan, service, step],
  );

  function resetFlow() {
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
    setForm(draftPrompt.form);
    setStep(draftPrompt.step);
    setStepDirection(1);
    setErrors({});
    setDraftPrompt(null);
    setShowIntroScreen(false);
    setLastSavedAt(draftPrompt.savedAt ?? "");
  }

  function handleStartFresh() {
    clearCreateGroupDraft();
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

  function handleSaveDraft(exitAfterSave = false) {
    const hasDraftableContent =
      Boolean(userId) &&
      !showIntroScreen &&
      (Boolean(form.serviceId) ||
        Boolean(form.planId) ||
        Boolean(form.availableSeats) ||
        Boolean(form.groupDescription.trim()) ||
        Boolean(form.memberRule.trim()));

    if (!hasDraftableContent) {
      if (exitAfterSave) navigate("/create-group");
      return;
    }

    const savedDraft = saveCreateGroupDraft({
      step,
      form,
      userId,
    });

    if (savedDraft?.savedAt) {
      setLastSavedAt(savedDraft.savedAt);
    }

    if (exitAfterSave) {
      navigate("/create-group");
    }
  }

  function handleConfirmExit() {
    if (!userId) {
      setIsExitConfirmOpen(false);
      navigate("/create-group");
      return;
    }

    setIsExitConfirmOpen(false);
    handleSaveDraft(true);
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
      const nextGroup = await createGroup(payload, user);
      addCreatedGroup(nextGroup);
      clearCreateGroupDraft();
      setLastSavedAt("");
      resetFlow();
      navigate(`/groups/${nextGroup.id}`);
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

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white text-black">
      <CreateGroupFlowHeader
        onExit={handleOpenExitConfirm}
        lastSavedAt={lastSavedAt}
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
                          form={form}
                          derived={derived}
                          summaryData={summaryData}
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
