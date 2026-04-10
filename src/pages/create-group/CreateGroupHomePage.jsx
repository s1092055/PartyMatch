import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deleteDraft,
  deleteGroup,
} from "../../shared/modules/groups/api/groupApi.js";
import { LoadingSpinner } from "../../shared/components/feedback/LoadingSpinner.jsx";
import { SmartContainer } from "../../shared/components/layout/SmartContainer.jsx";
import { useRequireAuthAction } from "../../shared/modules/auth/hooks/useRequireAuthAction.js";
import { useDrafts } from "../../shared/modules/groups/hooks/useDrafts.js";
import { useGroups } from "../../shared/modules/groups/hooks/useGroups.js";
import { useGroupsActions } from "../../shared/modules/groups/state/index.js";
import { CreateGroupConfirmModal } from "./components/CreateGroupConfirmModal.jsx";
import { CreateGroupDraftModal } from "./components/CreateGroupDraftModal.jsx";
import { CreateGroupEmptyState } from "./components/CreateGroupEmptyState.jsx";
import { GroupGridView } from "../../shared/modules/groups/components/GroupGridView.jsx";
import { GroupListView } from "../../shared/modules/groups/components/GroupListView.jsx";
import { CreateGroupPagination } from "./components/CreateGroupPagination.jsx";
import { CreateGroupToolbar } from "./components/CreateGroupToolbar.jsx";
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
  const { refreshGroups } = useGroupsActions();
  const {
    currentUserId: ownerId,
    currentDraft,
    isLoading: isDraftsLoading,
    reloadDrafts,
  } = useDrafts();
  const {
    groups,
    isLoading: isGroupsLoading,
    reloadGroups,
  } = useGroups();
  const [viewMode, setViewMode] = useState("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  const ownedGroups = useMemo(() => {
    return [...groups].sort(byCreatedAtDesc);
  }, [groups]);

  const managedItems = useMemo(() => {
    const draftEntry = buildCreateGroupDraftListEntry(currentDraft);

    if (!draftEntry) return ownedGroups;

    return [draftEntry, ...ownedGroups].sort(byCreatedAtDesc);
  }, [currentDraft, ownedGroups]);

  const itemsPerPage = ITEMS_PER_PAGE[viewMode] ?? 6;
  const totalPages = Math.max(1, Math.ceil(managedItems.length / itemsPerPage));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return managedItems.slice(start, start + itemsPerPage);
  }, [currentPage, itemsPerPage, managedItems]);

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
      state: {
        resumeDraft: true,
        initialData: selectedDraft,
      },
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
      try {
        const draftId = pendingAction.target?.draft?.id ?? currentDraft?.id ?? null;
        if (draftId && ownerId) {
          await deleteDraft(draftId, ownerId);
        }
        await reloadDrafts();
        setSelectedDraft(null);
        setPendingAction(null);
      } catch {
        setPendingAction(null);
      }
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

      try {
        await deleteGroup(groupId);
        await reloadGroups();
        await refreshGroups();
      } finally {
        setPendingAction(null);
      }
    }
  }

  if (isGroupsLoading || isDraftsLoading) {
    return <LoadingSpinner label="正在載入已建立群組..." />;
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
            {managedItems.length ? (
              viewMode === "list" ? (
                <GroupListView
                  groups={paginatedItems}
                  onDraftOpen={handleOpenDraft}
                  onOpenGroup={handleOpenGroup}
                  deleteMode={deleteMode}
                  onRequestRemove={handleRequestRemove}
                />
              ) : (
                <GroupGridView
                  groups={paginatedItems}
                  onDraftOpen={handleOpenDraft}
                  onOpenGroup={handleOpenGroup}
                  deleteMode={deleteMode}
                  onRequestRemove={handleRequestRemove}
                />
              )
            ) : (
              <CreateGroupEmptyState
                isAuthenticated={Boolean(ownerId)}
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
