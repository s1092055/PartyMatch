import { Badge } from "../../../../shared/components/ui/Badge.jsx";
import { Button } from "../../../../shared/components/ui/Button.jsx";
import { ServiceIcon } from "../../../../shared/components/ui/ServiceIcon.jsx";
import { formatDate } from "../../../../utils/format.js";
import { useGroupsActions } from "../../../../shared/modules/groups/state/index.js";
import { getPlanById, getServiceById } from "../../../../data/services.config.js";
import { SectionPanel } from "../../../../shared/components/layout/SectionPanel.jsx";

function statusBadge(status) {
  const map = {
    active: { label: "使用中", tone: "green" },
    open: { label: "可加入", tone: "green" },
    pending_payment: { label: "待付款", tone: "yellow" },
    almost_full: { label: "快滿", tone: "yellow" },
    full: { label: "已滿", tone: "gray" },
    expired: { label: "已到期", tone: "gray" },
  };
  return map[status] || map.open;
}

function getRemainingSeats(group) {
  if (typeof group.availableSeats === "number") return group.availableSeats;
  return Math.max(0, (group.totalSlots ?? 0) - (group.takenSlots ?? 0));
}

export function GroupTable({ rows, title, description, emptyMessage }) {
  const { leaveGroup } = useGroupsActions();

  return (
    <SectionPanel
      title={title}
      description={description}
      className="border-black/10 shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
    >
      {!rows.length ? (
        <div className="rounded-2xl border border-dashed border-black/10 px-6 py-10 text-center">
          <div className="text-lg font-bold text-black">目前沒有資料</div>
          <p className="mt-2 text-sm leading-6 text-black/55">
            {emptyMessage ?? "目前尚未建立內容，可先到首頁加入或建立一個新群組。"}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-black/10">
          {rows.map((group) => {
            const badge = statusBadge(group.status);
            const isHost = group.role === "host";
            const service = getServiceById(group.serviceId ?? group.platform);
            const plan = getPlanById(group.serviceId, group.planId);
            const remainingSeats = getRemainingSeats(group);

            return (
              <div
                key={group.id}
                className="flex flex-col gap-5 py-5 first:pt-0 last:pb-0 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black/[0.03]">
                    <ServiceIcon
                      serviceId={group.serviceId}
                      platform={group.platform}
                      iconKey={group.iconKey}
                      alt={service?.shortLabel ?? group.platform}
                      className="h-9 w-9 object-contain"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="text-lg font-semibold tracking-tight text-black">
                      {service?.shortLabel ?? group.platform}
                    </div>
                    <div className="mt-1 text-sm text-black/60">
                      {plan?.name ?? group.plan}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-black/55">
                      <Badge tone={badge.tone}>{badge.label}</Badge>
                      <span>角色：{isHost ? "團主" : "成員"}</span>
                      <span>剩餘名額：{remainingSeats}</span>
                    </div>
                    <div className="mt-2 text-sm text-black/50">
                      下次付款：{formatDate(group.nextPaymentDate)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isHost ? (
                    <>
                      <Button variant="outline" className="px-4 py-2 text-sm">
                        管理群組
                      </Button>
                      <Button variant="soft" className="px-4 py-2 text-sm">
                        邀請成員
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      className="px-4 py-2 text-sm"
                      onClick={() => leaveGroup(group.id)}
                    >
                      離開群組
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionPanel>
  );
}
