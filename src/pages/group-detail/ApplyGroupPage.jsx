import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageContainer } from "../../shared/components/layout/PageContainer.jsx";
import { ServiceIcon } from "../../shared/components/ui/ServiceIcon.jsx";
import { Button } from "../../shared/components/ui/Button.jsx";
import { useAuth } from "../../shared/modules/auth/hooks/useAuth.js";
import { useGroupsActions, useGroupsStore } from "../../shared/modules/groups/state/index.js";
import { useToast } from "../../shared/hooks/useToast.js";
import { getServiceById, getPlanById } from "../../data/services.config.js";
import { getPricePerSeatLabel } from "../../shared/modules/groups/utils/groupSummary.js";
import { resolveContactMethodTemplate } from "../../shared/modules/groups/utils/contactMethodTemplate.js";

const PAYMENT_OPTIONS = [
  { value: "bank_transfer", label: "銀行轉帳" },
  { value: "line_pay", label: "LINE Pay" },
  { value: "other", label: "其他（與團主另行確認）" },
];

export function ApplyGroupPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state } = useGroupsStore();
  const { applyGroup } = useGroupsActions();
  const { addToast } = useToast();

  const group = state.groups.find((g) => g.id === id);
  const service = group ? getServiceById(group.serviceId ?? group.platform) : null;
  const plan = group ? getPlanById(group.serviceId, group.planId) : null;
  const priceLabel = group ? getPricePerSeatLabel(group.serviceId, group.planId) : null;
  const remainingSeats = group
    ? Math.max(0, (group.totalSlots ?? 0) - (group.takenSlots ?? 0))
    : 0;
  const contactTemplate = resolveContactMethodTemplate(
    group?.contactMethodTemplate,
    group?.contactMethod,
  );
  const [introduction, setIntroduction] = useState("");
  const [contact, setContact] = useState(() => contactTemplate.prefix ?? "");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setContact(contactTemplate.prefix ?? "");
  }, [group?.id, contactTemplate.prefix]);

  if (!group) {
    return (
      <PageContainer>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <p className="text-black/55">找不到該群組。</p>
          <Link to="/explore" className="mt-4 inline-block text-sm font-medium text-black hover:underline">
            返回探索頁
          </Link>
        </div>
      </PageContainer>
    );
  }

  function validate() {
    const next = {};
    if (!introduction.trim()) next.introduction = "請填寫申請理由";
    if (!contact.trim()) next.contact = "請填寫聯絡方式";
    if (!paymentMethod) next.paymentMethod = "請選擇付款方式";
    if (!agreed) next.agreed = "請同意平台服務協定";
    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const next = validate();
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    try {
      await applyGroup(group.id, user.uid, user.displayName || user.email, {
        introduction: introduction.trim(),
        contact: contact.trim(),
        paymentMethod,
      });
      addToast("申請已送出，等待團主審核");
      navigate(`/groups/${group.id}`);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        form: error.message || "送出申請失敗，請稍後再試。",
      }));
    }
  }

  return (
    <PageContainer>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="text-3xl font-bold tracking-tight text-black">申請加入</h1>
        <p className="mt-2 text-sm text-black/55">填寫以下資訊送出申請，等待團主審核後即可加入。</p>

        <div className="mt-8 border-t border-black/8" />

        {/* Group summary */}
        <section className="py-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-black/40">確認方案資訊</h2>
          <div className="flex items-center gap-4 rounded-2xl bg-black/[0.02] px-5 py-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
              <ServiceIcon
                serviceId={group.serviceId}
                platform={group.platform}
                iconKey={group.iconKey}
                alt={service?.shortLabel ?? group.platform}
                className="h-8 w-8 object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold text-black">
                {service?.shortLabel ?? group.platform}
                {plan ? ` · ${plan.name}` : ""}
              </div>
              <div className="mt-0.5 text-sm text-black/55">
                團主：{group.hostName ?? "匿名"} · 剩餘名額：{remainingSeats}
              </div>
            </div>
            {priceLabel ? (
              <div className="shrink-0 text-right">
                <div className="text-base font-bold text-black">{priceLabel}</div>
                <div className="text-xs text-black/40">每人費用</div>
              </div>
            ) : null}
          </div>
        </section>

        <div className="border-t border-black/8" />

        <form onSubmit={handleSubmit} noValidate>
          {/* Introduction */}
          <section className="py-6">
            <label htmlFor="introduction" className="mb-1.5 block text-sm font-semibold text-black">
              自我介紹 / 申請理由 <span className="text-[#dc2626]">*</span>
            </label>
            <textarea
              id="introduction"
              rows={4}
              value={introduction}
              onChange={(e) => { setIntroduction(e.target.value); setErrors((prev) => ({ ...prev, introduction: undefined })); }}
              placeholder=""
              className={[
                "w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-black/20",
                errors.introduction ? "border-[#dc2626]" : "border-black/15 focus:border-black/40",
              ].join(" ")}
            />
            {errors.introduction ? <p className="mt-1.5 text-xs text-[#dc2626]">{errors.introduction}</p> : null}
          </section>

          <div className="border-t border-black/8" />

          {/* Contact */}
          <section className="py-6">
            <label htmlFor="contact" className="mb-1.5 block text-sm font-semibold text-black">
              {contactTemplate.fieldLabel || "聯絡方式"}<span className="text-[#dc2626]">*</span>
            </label>
            <p className="mb-3 text-xs text-black/45">
              {contactTemplate.hint || "方便團主在平台外與你確認細節。"}
            </p>
            <input
              id="contact"
              type="text"
              value={contact}
              onChange={(e) => { setContact(e.target.value); setErrors((prev) => ({ ...prev, contact: undefined })); }}
              placeholder={contactTemplate.placeholder || ""}
              className={[
                "w-full rounded-xl border bg-white px-4 py-3 text-sm text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-black/20",
                errors.contact ? "border-[#dc2626]" : "border-black/15 focus:border-black/40",
              ].join(" ")}
            />
            {errors.contact ? <p className="mt-1.5 text-xs text-[#dc2626]">{errors.contact}</p> : null}
          </section>

          <div className="border-t border-black/8" />

          {/* Payment method */}
          <section className="py-6">
            <p className="mb-1.5 block text-sm font-semibold text-black">
              偏好付款方式 <span className="text-[#dc2626]">*</span>
            </p>
            <p className="mb-3 text-xs text-black/45">選擇偏好的付款方式。</p>
            <div className="space-y-2.5">
              {PAYMENT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={[
                    "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition",
                    paymentMethod === opt.value
                      ? "border-black/30 bg-black/[0.05]"
                      : "border-black/10 bg-white hover:border-black/20 hover:bg-black/[0.015]",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={opt.value}
                    checked={paymentMethod === opt.value}
                    onChange={() => { setPaymentMethod(opt.value); setErrors((prev) => ({ ...prev, paymentMethod: undefined })); }}
                    className="h-4 w-4 accent-black"
                  />
                  <span className="text-sm font-medium text-black">{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.paymentMethod ? <p className="mt-1.5 text-xs text-[#dc2626]">{errors.paymentMethod}</p> : null}
          </section>

          <div className="border-t border-black/8" />

          {/* Terms */}
          <section className="py-6">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => { setAgreed(e.target.checked); setErrors((prev) => ({ ...prev, agreed: undefined })); }}
                className="mt-0.5 h-4 w-4 shrink-0 accent-black"
              />
              <span className="text-sm leading-6 text-black/70">
                我已閱讀並同意
                <span className="mx-1 font-medium text-black underline underline-offset-2">平台服務協定</span>
                與共享使用規範，並承諾依約付款及遵守相關規定。
              </span>
            </label>
            {errors.agreed ? <p className="mt-1.5 text-xs text-[#dc2626]">{errors.agreed}</p> : null}
          </section>

          <div className="border-t border-black/8" />

          {errors.form ? (
            <div className="rounded-2xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
              {errors.form}
            </div>
          ) : null}

          {/* Submit */}
          <div className="flex items-center justify-between pt-6">
            <Link
              to={`/groups/${group.id}`}
              className="text-sm font-medium text-black/50 transition hover:text-black"
            >
              取消
            </Link>
            <Button type="submit" variant="primary" className="min-w-[120px] py-3 text-sm">
              送出申請
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
