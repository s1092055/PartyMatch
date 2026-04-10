import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ListBulletIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { SectionPanel } from "../../../shared/components/layout/SectionPanel.jsx";
import { EmptyState } from "../../../shared/components/feedback/EmptyState.jsx";
import { GroupGridView } from "../../../shared/modules/groups/components/GroupGridView.jsx";
import { GroupListView } from "../../../shared/modules/groups/components/GroupListView.jsx";
import { GroupManageDialog } from "./GroupManageDialog.jsx";

const VIEW_OPTIONS = [
  { value: "list", label: "列表檢視", icon: ListBulletIcon },
  { value: "grid", label: "卡片檢視", icon: Squares2X2Icon },
];

export function HostedGroupsModalContent({ rows }) {
  const [viewMode, setViewMode] = useState("list");
  const [managingGroup, setManagingGroup] = useState(null);

  function handleOpenGroup(group) {
    if (!group?.id) return;
    setManagingGroup(group);
  }

  const actionButtons = (
    <div className="inline-flex items-center rounded-full border border-black/10 bg-black/[0.02] p-1">
      {VIEW_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isActive = option.value === viewMode;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setViewMode(option.value)}
            aria-pressed={isActive}
            className={[
              "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition",
              isActive
                ? "bg-white text-black shadow-[0_8px_18px_rgba(15,23,42,0.08)]"
                : "text-black/58 hover:text-black",
            ].join(" ")}
          >
            <Icon className="h-4 w-4" />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <SectionPanel
        title="已建立群組管理"
        description="管理你建立的群組。"
        action={actionButtons}
      >
        {!rows.length ? (
          <EmptyState
            title="你還沒有建立任何群組"
            description="建立第一個群組，邀請其他人一起分攤訂閱費用。"
            action={
              <Link
                to="/create-group"
                className="inline-flex rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black/80"
              >
                建立群組
              </Link>
            }
          />
        ) : (
          viewMode === "list" ? (
            <GroupListView
              groups={rows}
              onOpenGroup={handleOpenGroup}
            />
          ) : (
            <GroupGridView
              groups={rows}
              onOpenGroup={handleOpenGroup}
              gridClassName="grid gap-4 md:grid-cols-2"
            />
          )
        )}
      </SectionPanel>

      {managingGroup ? (
        <GroupManageDialog
          group={managingGroup}
          onClose={() => setManagingGroup(null)}
        />
      ) : null}
    </>
  );
}
