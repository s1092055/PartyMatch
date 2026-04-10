import { Link } from "react-router-dom";
import { DashboardShell } from "../../../shared/components/layout/DashboardShell.jsx";
import { SectionPanel } from "../../../shared/components/layout/SectionPanel.jsx";
import { Badge } from "../../../shared/components/ui/Badge.jsx";
import { Button } from "../../../shared/components/ui/Button.jsx";
import { ServiceIcon } from "../../../shared/components/ui/ServiceIcon.jsx";
import { useToast } from "../../../shared/hooks/useToast.js";
import { useAuth } from "../../../shared/modules/auth/hooks/useAuth.js";
import {
  selectMyPendingGroups,
  useGroupsStore,
} from "../../../shared/modules/groups/state/index.js";
import { useGroupsActions } from "../../../shared/modules/groups/state/groupsHooks.js";
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

const STATUS_CONFIG = {
  approved: { label: "已通過", tone: "green" },
  rejected: { label: "已拒絕", tone: "red" },
};

function ApplicationRow({ group, app, actions }) {
  const service = getServiceById(group.serviceId ?? group.platform);
  const plan = getPlanById(group.serviceId, group.planId);
  const statusCfg = STATUS_CONFIG[app.status];

  return (
    <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
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
            {plan?.name ?? group.plan} · 團主：{group.hostName ?? "匿名"}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {app.status === "pending" ? (
              <Badge tone="yellow">審核中</Badge>
            ) : statusCfg ? (
              <Badge tone={statusCfg.tone}>{statusCfg.label}</Badge>
            ) : null}
            <span className="text-xs text-black/45">
              申請時間：{formatTimeAgo(app.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">{actions}</div>
    </div>
  );
}

export function PendingApplicationsView() {
  const { state } = useGroupsStore();
  const { cancelApplication } = useGroupsActions();
  const { addToast } = useToast();
  const { user } = useAuth();
  const pendingGroups = selectMyPendingGroups(state);

  const myApps = (state.applications ?? []).filter(
    (app) => app.userId === user?.id,
  );
  const pendingApps = myApps.filter((app) => app.status === "pending");
  const resolvedApps = myApps.filter(
    (app) => app.status === "approved" || app.status === "rejected",
  );

  return (
    <DashboardShell title="我的申請">
      <div className="space-y-6">
        <SectionPanel
          title="申請中的群組"
          description="你目前正在等待團主審核的群組申請。"
          action={
            <Link
              to="/explore"
              className="inline-flex rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black transition hover:bg-black/5"
            >
              前往探索群組
            </Link>
          }
        >
          {!pendingGroups.length ? (
            <div className="rounded-2xl border border-dashed border-black/10 px-6 py-10 text-center">
              <div className="text-lg font-bold text-black">目前沒有申請中的群組</div>
              <p className="mt-2 text-sm leading-6 text-black/55">
                前往探索群組頁，找到感興趣的群組後點選「申請加入」。
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-black/8">
              <div className="divide-y divide-black/8">
              {pendingGroups.map((group) => {
                const app = pendingApps.find((a) => a.groupId === group.id);
                if (!app) return null;

                return (
                  <ApplicationRow
                    key={group.id}
                    group={group}
                    app={app}
                    actions={
                      <>
                        <Link
                          to={`/groups/${group.id}`}
                          className="inline-flex items-center justify-center rounded-full border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-black/5"
                        >
                          查看詳情
                        </Link>
                        <Button
                          variant="outline"
                          className="px-4 py-2 text-sm"
                          onClick={async () => {
                            try {
                              await cancelApplication(group.id, user.uid);
                              addToast("已取消申請");
                            } catch (error) {
                              addToast(error.message || "取消申請失敗");
                            }
                          }}
                        >
                          取消申請
                        </Button>
                      </>
                    }
                  />
                );
              })}
              </div>
            </div>
          )}
        </SectionPanel>

        {resolvedApps.length > 0 ? (
          <SectionPanel
            title="申請結果"
            description="你的歷史申請紀錄與審核結果。"
          >
            <div className="overflow-hidden rounded-[24px] border border-black/8">
              <div className="divide-y divide-black/8">
                {resolvedApps.map((app) => {
                  const group = state.groups.find((g) => g.id === app.groupId);
                  if (!group) return null;

                  return (
                    <ApplicationRow
                      key={app.id}
                      group={group}
                      app={app}
                      actions={
                        <Link
                          to={`/groups/${group.id}`}
                          className="inline-flex items-center justify-center rounded-full border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-black/5"
                        >
                          查看詳情
                        </Link>
                      }
                    />
                  );
                })}
              </div>
            </div>
          </SectionPanel>
        ) : null}
      </div>
    </DashboardShell>
  );
}
