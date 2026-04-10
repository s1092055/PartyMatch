import { Link } from "react-router-dom";
import { DashboardShell } from "../../../shared/components/layout/DashboardShell.jsx";
import { GroupTable } from "./GroupTable.jsx";
import { useGroupsStore, selectMyGroups } from "../../../shared/modules/groups/state/index.js";

export function MyGroupsView() {
  const { state } = useGroupsStore();
  const joinedRows = selectMyGroups(state).filter((group) => group.role === "member");

  return (
    <DashboardShell title="我加入的群組">
      <GroupTable
        rows={joinedRows}
        title="我加入的群組"
        description="你目前加入的共享群組。"
        emptyTitle="你還沒有加入任何群組"
        emptyMessage="找到感興趣的群組後申請加入，加入後就會顯示在這裡。"
        emptyAction={
          <Link
            to="/explore"
            className="inline-flex rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black transition hover:bg-black/5"
          >
            前往探索群組
          </Link>
        }
      />
    </DashboardShell>
  );
}
