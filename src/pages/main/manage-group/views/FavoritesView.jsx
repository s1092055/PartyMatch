import { Link } from "react-router-dom";
import { DashboardShell } from "../../../../shared/components/layout/DashboardShell.jsx";
import { SectionPanel } from "../../../../shared/components/layout/SectionPanel.jsx";
import { GroupCard } from "../../../../shared/modules/groups/components/GroupCard.jsx";
import {
  selectFollowedGroups,
  useGroupsStore,
} from "../../../../shared/modules/groups/state/index.js";

export function FavoritesView() {
  const { state } = useGroupsStore();
  const followedGroups = selectFollowedGroups(state);

  return (
    <DashboardShell title="追蹤群組">
      <SectionPanel
        title="追蹤群組"
        description="集中展示你已追蹤的群組，讓收藏、再比較、再進入詳情這條前端互動路徑更好理解。"
        action={
          <Link
            to="/explore"
            className="inline-flex rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black transition hover:bg-black/5"
          >
            前往探索群組
          </Link>
        }
      >
        {!followedGroups.length ? (
          <div className="rounded-2xl border border-dashed border-black/10 px-6 py-10 text-center">
            <div className="text-lg font-bold text-black">目前沒有追蹤的群組</div>
            <p className="mt-2 text-sm leading-6 text-black/55">
              先到探索群組頁按下群組卡片的「加入追蹤」，之後就會顯示在這裡。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {followedGroups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        )}
      </SectionPanel>
    </DashboardShell>
  );
}
