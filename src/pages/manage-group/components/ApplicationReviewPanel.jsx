import { Badge } from "../../../shared/components/ui/Badge.jsx";
import { Button } from "../../../shared/components/ui/Button.jsx";
import { ServiceIcon } from "../../../shared/components/ui/ServiceIcon.jsx";
import { SectionPanel } from "../../../shared/components/layout/SectionPanel.jsx";
import { useGroupsActions, useGroupsStore } from "../../../shared/modules/groups/state/index.js";
import { useToast } from "../../../shared/hooks/useToast.js";
import { selectApplicationsByHost } from "../../../shared/modules/groups/state/groupsSelectors.js";
import { getServiceById, getPlanById } from "../../../data/services.config.js";

function formatTimeAgo(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "剛剛";
  if (minutes < 60) return `${minutes} 分鐘前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

export function ApplicationReviewPanel({ hostedGroupIds }) {
  const { state } = useGroupsStore();
  const { approveApplication, rejectApplication } = useGroupsActions();
  const { addToast } = useToast();
  const pendingApps = selectApplicationsByHost(state, hostedGroupIds);

  if (!pendingApps.length) return null;

  return (
    <SectionPanel
      title="待審核申請"
      description={`共 ${pendingApps.length} 筆申請等待你的審核。`}
      className="border-black/10 shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
    >
      <div className="divide-y divide-black/10">
        {pendingApps.map((app) => {
          const group = state.groups.find((g) => g.id === app.groupId);
          const service = group ? getServiceById(group.serviceId ?? group.platform) : null;
          const plan = group ? getPlanById(group.serviceId, group.planId) : null;

          return (
            <div
              key={app.id}
              className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-black/[0.03]">
                  {group ? (
                    <ServiceIcon
                      serviceId={group.serviceId}
                      platform={group.platform}
                      iconKey={group.iconKey}
                      alt={service?.shortLabel ?? group.platform}
                      className="h-7 w-7 object-contain"
                    />
                  ) : (
                    <span className="text-sm text-black/40">?</span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="text-sm font-semibold text-black">
                    {app.displayName}
                  </div>
                  <div className="mt-1 text-sm text-black/55">
                    申請加入{" "}
                    <span className="font-medium text-black/75">
                      {service?.shortLabel ?? "未知服務"} {plan?.name ?? ""}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge tone="yellow">待審核</Badge>
                    <span className="text-xs text-black/45">
                      {formatTimeAgo(app.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="primary"
                  className="px-4 py-2 text-sm"
                  onClick={async () => {
                    try {
                      await approveApplication(app.id);
                      addToast(`已通過 ${app.displayName} 的申請`);
                    } catch (error) {
                      addToast(error.message || "通過申請失敗");
                    }
                  }}
                >
                  通過
                </Button>
                <Button
                  variant="outline"
                  className="px-4 py-2 text-sm"
                  onClick={async () => {
                    try {
                      await rejectApplication(app.id);
                      addToast(`已拒絕 ${app.displayName} 的申請`);
                    } catch (error) {
                      addToast(error.message || "拒絕申請失敗");
                    }
                  }}
                >
                  拒絕
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </SectionPanel>
  );
}
