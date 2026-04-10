import { useMemo } from "react";
import { DashboardShell } from "../../../shared/components/layout/DashboardShell.jsx";
import { LoadingSpinner } from "../../../shared/components/feedback/LoadingSpinner.jsx";
import { useAuth } from "../../../shared/modules/auth/hooks/useAuth.js";
import { useOwnedGroups } from "../../../shared/modules/groups/hooks/useOwnedGroups.js";
import { HostModeEmptyState } from "./HostModeEmptyState.jsx";
import { GroupTable } from "./GroupTable.jsx";
import { ApplicationReviewPanel } from "./ApplicationReviewPanel.jsx";

export function HostedGroupsView() {
  const { user } = useAuth();
  const ownerId = user?.id ?? null;
  const { ownedGroups: hostedRows, isLoading } = useOwnedGroups(ownerId);
  const hostedGroupIds = useMemo(() => hostedRows.map((g) => g.id), [hostedRows]);

  if (isLoading) {
    return (
      <DashboardShell title="已建立群組管理">
        <LoadingSpinner label="正在載入你建立的群組..." />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="已建立群組管理">
      {!hostedRows.length ? (
        <HostModeEmptyState />
      ) : (
        <div className="space-y-6">
          <ApplicationReviewPanel hostedGroupIds={hostedGroupIds} />
          <GroupTable
            rows={hostedRows}
            title="已建立群組管理"
            description="管理你建立的群組與目前招募狀態。"
            emptyMessage="你還沒有建立任何群組，可從上方切到團主管理後直接建立第一個群組。"
          />
        </div>
      )}
    </DashboardShell>
  );
}
