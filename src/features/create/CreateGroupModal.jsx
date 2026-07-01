import { createPortal } from 'react-dom'
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  Info,
  PlusCircle,
} from "lucide-react";
import CreateGroupStepper from "./components/CreateGroupStepper";
import LivePreviewPanel from "./components/LivePreviewPanel";
import Step1Service from "./components/steps/Step1Service";
import Step2Plan from "./components/steps/Step2Plan";
import Step3Settings from "./components/steps/Step3Settings";
import Step4Preview from "./components/steps/Step4Preview";
import Button from "../../shared/ui/Button";
import Modal from '../../shared/ui/Modal'
import LoginPromptModal from "../../shared/ui/LoginPromptModal";
import { useGroupStore } from "../../shared/stores/useGroupStore";
import { useNotificationStore } from "../../shared/stores/useNotificationStore";
import { getServiceById } from "../../shared/utils/serviceUtils";
import { useAuthStore } from "../../shared/stores/useAuthStore";

const STEP_COMPONENTS = [Step1Service, Step2Plan, Step3Settings, Step4Preview];
const STEP_LABELS = [
  { n: 1, label: "選擇服務" },
  { n: 2, label: "方案設定" },
  { n: 3, label: "群組設定" },
  { n: 4, label: "最後確認" },
];

const INITIAL_FORM = {
  serviceId: "",
  planName: "",
  pricePerSeat: 0,
  billingCycle: "monthly",
  totalSeats: 2,
  paymentMethod: "",
  requirements: "",
  rules: [""],
};

function mapFormToGroup(form) {
  const service = getServiceById(form.serviceId);
  const plan = service?.plans.find(p => p.name === form.planName);
  const totalSeats = form.totalSeats;
  const rules = form.rules.map((r) => r.trim()).filter(Boolean);
  const tags = [...new Set([...(plan?.tags ?? []), service?.category].filter(Boolean))];

  return {
    serviceId: form.serviceId,
    serviceName: service?.fullName ?? service?.name ?? form.serviceId,
    planName: form.planName,
    pricePerSeat: form.pricePerSeat || 0,
    billingCycle: form.billingCycle,
    totalSeats,
    usedSeats: 1,
    openSeats: totalSeats - 1,
    joinMode: "approval",
    paymentMethod: form.paymentMethod.trim(),
    requirements: form.requirements.trim(),
    rules,
    tags,
    status: "recruiting",
  };
}

function getStepErrors(step, form) {
  const errors = [];
  const rules = form.rules.map((rule) => rule.trim()).filter(Boolean);

  switch (step) {
    case 1:
      if (!form.serviceId) errors.push("請選擇一個訂閱服務");
      break;
    case 2:
      if (!form.planName) errors.push("請選擇方案");
      break;
    case 3: {
      const service = getServiceById(form.serviceId);
      const plan = service?.plans.find((p) => p.name === form.planName);
      const maxSeats = plan?.maxSeats ?? 10;
      if (
        !Number.isInteger(form.totalSeats) ||
        form.totalSeats < 2 ||
        form.totalSeats > maxSeats
      ) {
        errors.push(`開放名額需介於 1 至 ${maxSeats - 1} 位`);
      }
      if (!form.paymentMethod.trim()) errors.push("請填寫收款方式");
      if (rules.length > 5) errors.push("群組規則最多 5 條");
      if (rules.some((rule) => rule.length > 80))
        errors.push("每條群組規則最多 80 字");
      break;
    }
    default:
      break;
  }

  return errors;
}

function getFirstInvalidStep(form) {
  return [1, 2, 3].find((step) => getStepErrors(step, form).length > 0) ?? null;
}

export default function CreateGroupModal() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    function handler() {
      if (!useAuthStore.getState().loggedIn) { setShowLoginPrompt(true); return }
      setIsOpen(true);
      setStep(1);
      setForm(INITIAL_FORM);
      setSubmitted(false);
      setAgreedToTerms(false);
    }
    window.addEventListener("pm:open-create", handler);
    return () => window.removeEventListener("pm:open-create", handler);
  }, []);


  function handleClose() {
    setIsOpen(false);
  }

  function onChange(key, value) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "serviceId") {
        next.planName = "";
        next.pricePerSeat = 0;
        next.totalSeats = 2;
      }
      if (key === "planName") {
        const service = getServiceById(next.serviceId);
        const plan = service?.plans.find((p) => p.name === value);
        if (plan) {
          next.totalSeats = plan.maxSeats;
          next.pricePerSeat = calcPricePerSeat(plan, plan.maxSeats, next.billingCycle);
        }
      }
      if (key === "totalSeats") {
        const service = getServiceById(next.serviceId);
        const plan = service?.plans.find((p) => p.name === next.planName);
        if (plan) next.pricePerSeat = calcPricePerSeat(plan, value, next.billingCycle);
      }
      if (key === "billingCycle") {
        const service = getServiceById(next.serviceId);
        const plan = service?.plans.find((p) => p.name === next.planName);
        if (plan) next.pricePerSeat = calcPricePerSeat(plan, next.totalSeats, value);
      }
      return next;
    });
  }

  function calcPricePerSeat(plan, seats, billingCycle) {
    if (billingCycle === "yearly" && plan.yearlyPrice) {
      return Math.ceil(plan.yearlyPrice / seats / 12);
    }
    return Math.ceil(plan.monthlyPrice / seats);
  }

  const stepErrors = getStepErrors(step, form);
  function canNext() {
    return stepErrors.length === 0;
  }

  function handleNext() {
    if (canNext() && step < 4) { setStep((s) => s + 1); setShowPreview(false); }
  }

  function handleBack() {
    if (step > 1) { setStep((s) => s - 1); setShowPreview(false); }
    else handleClose();
  }

  function handleSubmit() {
    const firstInvalidStep = getFirstInvalidStep(form);
    if (firstInvalidStep) {
      setStep(firstInvalidStep);
      return;
    }

    const groupData = mapFormToGroup(form);
    const host = useAuthStore.getState().getProfile();
    const group = useGroupStore.getState().create(groupData, host);
    if (host) {
      useNotificationStore.getState().create({
        userId:  host.id,
        type:    'group_created',
        title:   '群組已成功建立',
        message: `「${group.serviceName}」群組已上架，開始招募成員中！`,
        meta:    { groupId: group.id },
      });
    }
    window.dispatchEvent(new CustomEvent('pm:group-created', { detail: { groupId: group.id } }));
    setSubmitted(true);
  }

  if (showLoginPrompt) return <LoginPromptModal onClose={() => setShowLoginPrompt(false)} />
  if (!isOpen) return null;

  if (submitted) return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-sm animate-fade-in-up rounded-2xl bg-white p-6 shadow-2xl text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 size={28} className="text-emerald-500" />
          </div>
        </div>
        <h3 className="text-lg font-extrabold text-ink mb-1">群組已成功上架！</h3>
        <p className="text-sm text-ink-3 leading-relaxed">你的群組現在已開放招募成員</p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setIsOpen(false)}
            className="flex-1 rounded-xl border border-line py-2.5 text-sm font-bold text-ink transition-colors hover:bg-raised"
          >
            關閉
          </button>
          <button
            onClick={() => { setIsOpen(false); navigate('/manage-groups'); }}
            className="flex-1 rounded-xl bg-brand py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
          >
            前往群組管理
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )

  const StepComponent = STEP_COMPONENTS[step - 1];

  const headerEnd = step < 4 && !showPreview && (
    <button
      onClick={() => setShowPreview(true)}
      className="lg:hidden flex items-center gap-1.5 rounded-full border border-line px-3 h-8 text-xs font-bold text-ink-2 transition-colors hover:bg-raised hover:text-ink mr-2"
      aria-label="顯示預覽"
    >
      <Eye size={14} />
      顯示預覽
    </button>
  );

  const footer = (
    <>
      <Button variant="secondary" size="md" className="flex-1" onClick={handleBack}>
        <ChevronLeft size={15} />
        {step === 1 ? "取消" : "上一步"}
      </Button>
      {step < 4 ? (
        <Button variant="primary" size="md" className="flex-1" disabled={!canNext()} onClick={handleNext}>
          下一步
          <ChevronRight size={15} />
        </Button>
      ) : (
        <Button variant="success" size="md" className="flex-1" disabled={!agreedToTerms} onClick={handleSubmit}>
          確認建立
        </Button>
      )}
    </>
  );

  return (
    <Modal
      onClose={handleClose}
      icon={<PlusCircle size={20} className="text-brand" />}
      title="建立群組"
      height="min(85vh, 720px)"
      outerPadding="p-4 md:p-8"
      headerEnd={headerEnd}
      footer={footer}
    >
      <div className="shrink-0 px-6 pt-5">
        <CreateGroupStepper steps={STEP_LABELS} current={step} />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {(() => {
            const service = getServiceById(form.serviceId)
            const desc = step === 1
              ? service?.description
              : step === 2
                ? service?.plans.find(p => p.name === form.planName)?.description
                : null
            const showErrors = stepErrors.length > 0 && step < 4
            const infoBox = desc && (
              <div className="flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">{desc}</p>
              </div>
            )
            const errorBox = showErrors && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
                <AlertCircle size={13} className="shrink-0" />
                <span>{stepErrors[0]}</span>
              </div>
            )
            return (
              <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:mr-6">
                <div className="min-w-0 flex-1 flex flex-col">
                  <div className="flex-1 pt-2 pb-3 lg:pt-3 lg:pb-6">
                    <StepComponent form={form} onChange={onChange} agreedToTerms={agreedToTerms} onAgreeChange={setAgreedToTerms} />
                  </div>
                  <div className="mt-4 space-y-2 pb-2">
                    {infoBox}
                    {errorBox}
                  </div>
                </div>
                {step < 4 && (
                  <div className="hidden shrink-0 lg:flex lg:flex-col lg:w-64 lg:pt-3 lg:pb-2">
                    <LivePreviewPanel form={form} />
                  </div>
                )}
              </div>
            )
          })()}
      </div>

      {showPreview && step < 4 && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 lg:hidden"
          onClick={() => setShowPreview(false)}
        >
          <div className="mx-6 w-full max-w-xs" onClick={e => e.stopPropagation()}>
            <LivePreviewPanel form={form} />
          </div>
        </div>
      )}
    </Modal>
  );
}
