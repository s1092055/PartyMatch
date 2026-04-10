import {
  CREATE_GROUP_CONTACT_OPTIONS,
  CREATE_GROUP_JOIN_POLICY_OPTIONS,
  CREATE_GROUP_REMINDER_OPTIONS,
  getCreateGroupOptionLabel,
} from "../utils/createGroupDefaults.js";
import { resolveContactMethodTemplate } from "../../../shared/modules/groups/utils/contactMethodTemplate.js";
import { getCategoryLabel, getHeroTheme } from "../../../shared/utils/serviceTheme.js";
import { GroupDetailHero } from "../../group-detail/components/GroupDetailHero.jsx";
import { GroupDetailSection } from "../../group-detail/components/GroupDetailSection.jsx";


export function CreateGroupStep4Review({
  service,
  plan,
  form,
  derived,
}) {
  const serviceLabel = service?.name ?? "尚未選擇服務";
  const planLabel = plan?.name ?? "尚未選擇方案";
  const categoryLabel = getCategoryLabel(service);
  const availableSeatsLabel =
    derived.availableSeats != null ? `${derived.availableSeats}` : "--";
  const totalSeatsLabel =
    derived.totalSeats != null ? `共 ${derived.totalSeats} 位` : "";
  const joinPolicyLabel = getCreateGroupOptionLabel(
    CREATE_GROUP_JOIN_POLICY_OPTIONS,
    form.joinPolicy,
    "--",
  );
  const reminderLabel = getCreateGroupOptionLabel(
    CREATE_GROUP_REMINDER_OPTIONS,
    form.paymentReminder,
    "--",
  );
  const contactTemplate = resolveContactMethodTemplate(
    form.contactMethodTemplate,
    form.contactMethod,
  );
  const contactLabel = getCreateGroupOptionLabel(
    CREATE_GROUP_CONTACT_OPTIONS,
    contactTemplate.type,
    "--",
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
              <div className="rounded-[24px] border border-black/10 bg-black/[0.02] px-5 py-6">
                <div className="text-sm text-black/60">服務</div>
                <div className="mt-5 text-2xl font-semibold tracking-tight text-black">
                  {serviceLabel}
                </div>
              </div>

              <div className="rounded-[24px] border border-black/10 bg-black/[0.02] px-5 py-6">
                <div className="text-sm text-black/60">方案</div>
                <div className="mt-5 text-2xl font-semibold tracking-tight text-black">
                  {planLabel}
                </div>
              </div>

              <div className="flex flex-col items-center rounded-[24px] border border-black/10 bg-black/[0.02] px-5 py-6 text-center">
                <div className="text-sm text-black/60">開放名額</div>
                <div className="mt-5 text-2xl font-semibold tracking-tight text-black">
                  {availableSeatsLabel} 位
                </div>
                {totalSeatsLabel ? (
                  <div className="mt-1 text-sm text-black/44">{totalSeatsLabel}</div>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[20px] border border-black/10 bg-black/[0.02] px-5 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-black/40">加入條件</div>
                <div className="mt-2 text-sm font-semibold text-black">{joinPolicyLabel}</div>
              </div>
              <div className="rounded-[20px] border border-black/10 bg-black/[0.02] px-5 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-black/40">付款提醒</div>
                <div className="mt-2 text-sm font-semibold text-black">{reminderLabel}</div>
              </div>
              <div className="rounded-[20px] border border-black/10 bg-black/[0.02] px-5 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-black/40">聯絡方式</div>
                <div className="mt-2 text-sm font-semibold text-black">{contactLabel}</div>
              </div>
            </div>

            <GroupDetailSection eyebrow="群組簡介" title="這個群組在做什麼？">
              <p className="text-base leading-8 text-black/62">
                {form.groupDescription}
              </p>
            </GroupDetailSection>

            <GroupDetailSection
              eyebrow="申請須知"
              title="群組備註說明"
            >
              <p className="text-sm leading-8 text-black/64">
                {form.memberRule}
              </p>
            </GroupDetailSection>

          </div>
        </div>
      </div>
    </div>
  );
}
