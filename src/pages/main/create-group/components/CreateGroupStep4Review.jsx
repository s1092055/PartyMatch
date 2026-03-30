import {
  CREATE_GROUP_CONTACT_OPTIONS,
  CREATE_GROUP_REMINDER_OPTIONS,
  getCreateGroupOptionLabel,
} from "../utils/createGroupDefaults.js";
import {
  getCategoryLabel,
  getFeatureIcon,
  getHeroTheme,
} from "../../../../shared/utils/serviceTheme.js";
import { GroupDetailFaqSection } from "../../../detail/components/GroupDetailFaqSection.jsx";
import { GroupDetailFeatureStrip } from "../../../detail/components/GroupDetailFeatureStrip.jsx";
import { GroupDetailHero } from "../../../detail/components/GroupDetailHero.jsx";
import { GroupDetailSection } from "../../../detail/components/GroupDetailSection.jsx";

function buildPreviewFaqs(serviceLabel, planLabel) {
  return [
    {
      question: "加入後何時會收到共享資訊？",
      answer: `確認建立後，這個 ${serviceLabel} ${planLabel} 群組會依照你設定的申請條件與須知對外公開。`,
    },
    {
      question: "名額與價格會怎麼顯示？",
      answer: "預覽頁會直接以目前設定的開放名額與每位分攤價格呈現，讓你先確認公開後的樣子。",
    },
    {
      question: "建立後還能再調整嗎？",
      answer: "可以，建立完成後仍可回到管理頁編輯群組說明、名額與申請規則。",
    },
  ];
}

export function CreateGroupStep4Review({
  service,
  form,
  derived,
  summaryData,
}) {
  const serviceLabel = summaryData.serviceLabel;
  const planLabel = summaryData.planLabel;
  const categoryLabel = getCategoryLabel(service);
  const priceLabel = summaryData.pricePerSeatLabel;
  const featureWidgets = summaryData.fullFeatures.map((feature) => ({
    feature,
    Icon: getFeatureIcon(feature),
  }));
  const rules = form.memberRule ? [form.memberRule] : [];
  const faqItems = buildPreviewFaqs(serviceLabel, planLabel);
  const availableSeatsLabel =
    derived.availableSeats != null ? `${derived.availableSeats}` : "--";
  const totalSeatsLabel =
    derived.totalSeats != null ? `共 ${derived.totalSeats} 位` : "";
  const reminderLabel = getCreateGroupOptionLabel(
    CREATE_GROUP_REMINDER_OPTIONS,
    form.paymentReminder,
  );
  const contactLabel = getCreateGroupOptionLabel(
    CREATE_GROUP_CONTACT_OPTIONS,
    form.contactMethod,
  );

  return (
    <div className="h-full min-h-0 overflow-y-auto scrollbar-none pr-1">
      <div className="pb-10 xl:pb-16">
        <div className="mt-6 space-y-8">
          <GroupDetailHero
            heroTheme={getHeroTheme(service?.id)}
            serviceId={service?.id}
            platform={service?.name}
            iconKey={service?.id}
            serviceLabel={serviceLabel}
            categoryLabel={categoryLabel}
            planLabel={planLabel}
            elevated={false}
          />

          <div className="min-w-0 space-y-6">
            <div className="grid items-stretch gap-4 lg:grid-cols-3">
              <div className="flex flex-col items-center rounded-[24px] border border-black/10 bg-black/[0.02] px-5 py-6 text-center">
                <div className="text-sm text-black/60">開放名額</div>
                <div className="mt-5 text-2xl font-semibold tracking-tight text-black">
                  {availableSeatsLabel} 位
                </div>
                {totalSeatsLabel ? (
                  <div className="mt-1 text-sm text-black/44">{totalSeatsLabel}</div>
                ) : null}
              </div>

              <div className="flex flex-col items-center rounded-[24px] border border-black/10 bg-black/[0.02] px-5 py-6 text-center">
                <div className="text-sm text-black/60">方案價格</div>
                <div className="mt-5 text-2xl font-semibold tracking-tight text-black">
                  每位 {priceLabel}
                </div>
              </div>

              <div className="flex flex-col items-center rounded-[24px] border border-black/10 bg-black/[0.02] px-5 py-6 text-center">
                <div className="text-sm text-black/60">申請條件</div>
                <div className="mt-5 text-2xl font-semibold tracking-tight text-black">
                  {summaryData.joinPolicyLabel}
                </div>
              </div>
            </div>

            <GroupDetailSection eyebrow="群組簡介" title="這個群組在做什麼？">
              <p className="text-base leading-8 text-black/62">
                {form.groupDescription ||
                  "月初固定扣款，適合想長期穩定續訂的成員。"}
              </p>
            </GroupDetailSection>

            {featureWidgets.length ? (
              <GroupDetailFeatureStrip featureWidgets={featureWidgets} />
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[20px] border border-black/10 bg-black/[0.02] px-5 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-black/40">付款提醒</div>
                <div className="mt-2 text-sm font-semibold text-black">{reminderLabel}</div>
              </div>
              <div className="rounded-[20px] border border-black/10 bg-black/[0.02] px-5 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-black/40">聯絡方式</div>
                <div className="mt-2 text-sm font-semibold text-black">{contactLabel}</div>
              </div>
            </div>

            <GroupDetailSection
              eyebrow="申請須知"
              title="群組備註說明"
            >
              <div className="space-y-4">
                {rules.length ? (
                  rules.map((rule) => (
                    <p key={rule} className="text-sm leading-8 text-black/64">
                      {rule}
                    </p>
                  ))
                ) : (
                  <p className="text-sm leading-8 text-black/64">
                    目前沒有額外申請須知，建立後你仍然可以回到管理頁補上更完整的說明。
                  </p>
                )}
              </div>
            </GroupDetailSection>

            <GroupDetailFaqSection faqItems={faqItems} />
          </div>
        </div>
      </div>
    </div>
  );
}
