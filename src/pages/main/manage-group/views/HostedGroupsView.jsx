import { DashboardShell } from "../../../../shared/components/layout/DashboardShell.jsx";
import { HostModeEmptyState } from "../components/HostModeEmptyState.jsx";
import { GroupTable } from "../components/GroupTable.jsx";
import { selectMyGroups, useGroupsStore } from "../../../../shared/modules/groups/state/index.js";

export function HostedGroupsView() {
  const { state } = useGroupsStore();
  const hostedRows = selectMyGroups(state).filter((group) => group.role === "host");

  return (
    <DashboardShell title="我建立的群組">
      {!hostedRows.length ? (
        <HostModeEmptyState />
      ) : (
        <GroupTable
          rows={hostedRows}
          title="我建立的群組"
          description="保留團主視角最適合展示的群組列表、招募狀態與基本管理操作，避免過深的後台設定。"
          emptyMessage="你還沒有建立任何群組，可從上方切到團主管理後直接建立第一個群組。"
        />
      )}
    </DashboardShell>
  );
}
