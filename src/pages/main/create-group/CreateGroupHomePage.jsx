import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SmartContainer } from "../../../shared/components/layout/SmartContainer.jsx";
import { useAuth } from "../../../shared/modules/auth/hooks/useAuth.js";
import { useRequireAuthAction } from "../../../shared/modules/auth/hooks/useRequireAuthAction.js";
import {
  useGroupsActions,
  useGroupsStore,
} from "../../../shared/modules/groups/state/index.js";
import { updateStoredGroup } from "../../../shared/modules/groups/services/groupService.js";
import { CreateGroupConfirmModal } from "./components/CreateGroupConfirmModal.jsx";
import { CreateGroupDraftModal } from "./components/CreateGroupDraftModal.jsx";
import { CreateGroupEmptyState } from "./components/CreateGroupEmptyState.jsx";
import { CreateGroupGridView } from "./components/CreateGroupGridView.jsx";
import { CreateGroupListView } from "./components/CreateGroupListView.jsx";
import { CreateGroupPagination } from "./components/CreateGroupPagination.jsx";
import { CreateGroupToolbar } from "./components/CreateGroupToolbar.jsx";
import { clearCreateGroupDraft, loadCreateGroupDraft } from "./utils/createGroupDraft.js";
import { buildCreateGroupDraftListEntry } from "./utils/createGroupHomeView.js";

const ITEMS_PER_PAGE = {
  list: 6,
  grid: 6,
};

function byCreatedAtDesc(left, right) {
  return (right.createdAt ? new Date(right.createdAt).getTime() : 0) -
         (left.createdAt ? new Date(left.createdAt).getTime() : 0);
}

export function CreateGroupHomePage() {
  const navigate = useNavigate();
  const requireAuthAction = useRequireAuthAction();
  const { user } = useAuth();
  const { state } = useGroupsStore();
  const { updateGroup } = useGroupsActions();
  const [viewMode, setViewMode] = useState("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [currentDraft, setCurrentDraft] = useState(null);
  const [hiddenGroupIds, setHiddenGroupIds] = useState([]);
  const [pendingAction, setPendingAction] = useState(null);
  const userId = user?.uid ?? null;

  useEffect(() => {
    setCurrentDraft(loadCreateGroupDraft(userId));
  }, [userId]);

  const ownedGroups = useMemo(() => {
    if (!userId) return [];

    return [...state.groups]
      .filter((group) => group.ownerId === userId)
      .sort(byCreatedAtDesc);
  }, [state.groups, userId]);

  const managedItems = useMemo(() => {
    const draftEntry = buildCreateGroupDraftListEntry(currentDraft);

    if (!draftEntry) return ownedGroups;

    return [draftEntry, ...ownedGroups].sort(byCreatedAtDesc);
  }, [currentDraft, ownedGroups]);

  const visibleItems = useMemo(
    () => managedItems.filter((item) => !hiddenGroupIds.includes(item.id)),
    [hiddenGroupIds, managedItems],
  );

  const itemsPerPage = ITEMS_PER_PAGE[viewMode] ?? 6;
  const totalPages = Math.max(1, Math.ceil(visibleItems.length / itemsPerPage));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return visibleItems.slice(start, start + itemsPerPage);
  }, [currentPage, itemsPerPage, visibleItems]);

  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function handleStartNewGroup() {
    requireAuthAction("請先登入後再建立群組。", () => {
      navigate("/create-group/new");
    });
  }

  function handleOpenDraft(item) {
    if (deleteMode || !item?.draft) return;
    setSelectedDraft(item.draft);
  }

  function handleCloseDraftModal() {
    setSelectedDraft(null);
  }

  function handleResumeDraft() {
    if (!selectedDraft) return;
    setSelectedDraft(null);
    navigate("/create-group/new", {
      state: { resumeDraft: true },
    });
  }

  function handleOpenGroup(item) {
    if (deleteMode || !item?.id || item.status === "dissolved") return;

    setPendingAction({
      type: "navigate-group",
      title: "前往群組詳情？",
      description: "你將前往此群組的詳情頁面，查看目前的招募資訊與群組內容。",
      confirmLabel: "前往查看",
      confirmTone: "neutral",
      target: item,
    });
  }

  function handleRequestDeleteDraft(item) {
    if (!item?.draft) return;
    setPendingAction({
      type: "delete-draft",
      title: "移除此群組？",
      description: "此操作會刪除這份草稿，刪除後無法恢復。",
      confirmLabel: "確認移除",
      target: item,
    });
  }

  function handleRequestRemove(item) {
    if (!item) return;

    if (item.kind === "draft") {
      handleRequestDeleteDraft(item);
      return;
    }

    setPendingAction({
      type: "dissolve-group",
      title: "移除此群組？",
      description: "此操作會將群組從目前列表移除，請再次確認。",
      confirmLabel: "確認移除",
      target: item,
    });
  }

  function handleCloseConfirmModal() {
    setPendingAction(null);
  }

  async function handleConfirmAction() {
    if (!pendingAction) return;

    if (pendingAction.type === "delete-draft") {
      clearCreateGroupDraft();
      setCurrentDraft(null);
      setSelectedDraft(null);
      setPendingAction(null);
      return;
    }

    if (pendingAction.type === "navigate-group") {
      const groupId = pendingAction.target?.id;
      setPendingAction(null);
      if (groupId) {
        navigate(`/groups/${groupId}`);
      }
      return;
    }

    if (pendingAction.type === "dissolve-group") {
      const groupId = pendingAction.target?.id;
      if (!groupId) {
        setPendingAction(null);
        return;
      }

      await updateStoredGroup(groupId, { status: "dissolved" });
      updateGroup(groupId, { status: "dissolved" });
      setHiddenGroupIds((current) => [...new Set([...current, groupId])]);
      setPendingAction(null);
    }
  }

  return (
    <SmartContainer size="wide">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="p-4 sm:p-5 lg:p-6">
          <CreateGroupToolbar
            title="已建立群組管理"
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onCreate={handleStartNewGroup}
            deleteMode={deleteMode}
            onToggleDeleteMode={() => setDeleteMode((current) => !current)}
          />

          <div className="pt-5">
            {visibleItems.length ? (
              viewMode === "list" ? (
                <CreateGroupListView
                  groups={paginatedItems}
                  onDraftOpen={handleOpenDraft}
                  onOpenGroup={handleOpenGroup}
                  deleteMode={deleteMode}
                  onRequestRemove={handleRequestRemove}
                />
              ) : (
                <CreateGroupGridView
                  groups={paginatedItems}
                  onDraftOpen={handleOpenDraft}
                  onOpenGroup={handleOpenGroup}
                  deleteMode={deleteMode}
                  onRequestRemove={handleRequestRemove}
                />
              )
            ) : (
              <CreateGroupEmptyState
                isAuthenticated={Boolean(user)}
                onCreate={handleStartNewGroup}
              />
            )}

            <CreateGroupPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>

      <CreateGroupDraftModal
        open={Boolean(selectedDraft)}
        draft={selectedDraft}
        onClose={handleCloseDraftModal}
        onResume={handleResumeDraft}
        onDelete={() => handleRequestDeleteDraft({ draft: selectedDraft })}
      />

      <CreateGroupConfirmModal
        open={Boolean(pendingAction)}
        title={pendingAction?.title ?? ""}
        description={pendingAction?.description ?? ""}
        confirmLabel={pendingAction?.confirmLabel ?? "確認"}
        confirmTone={pendingAction?.confirmTone ?? "danger"}
        onClose={handleCloseConfirmModal}
        onConfirm={handleConfirmAction}
      />
    </SmartContainer>
  );
}
