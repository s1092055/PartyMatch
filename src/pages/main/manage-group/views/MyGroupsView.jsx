import { DashboardShell } from "../../../../shared/components/layout/DashboardShell.jsx";
import { GroupTable } from "../components/GroupTable.jsx";
import { useGroupsStore, selectMyGroups } from "../../../../shared/modules/groups/state/index.js";

export function MyGroupsView() {
  const { state } = useGroupsStore();
  const joinedRows = selectMyGroups(state).filter((group) => group.role === "member");

  return (
    <DashboardShell title="我加入的群組">
      <GroupTable
        rows={joinedRows}
        title="我加入的群組"
        description="用本地示範資料整理你目前參與中的共享群組，聚焦展示清單、狀態與基本操作流程。"
        emptyMessage="你目前沒有加入任何群組，可先前往探索群組尋找新的共享方案。"
      />
    </DashboardShell>
  );
}
