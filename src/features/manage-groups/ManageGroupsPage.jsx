import { useEffect, useRef, useState } from 'react'
import { Archive } from 'lucide-react'
import { useAuthStore } from '../../common/stores/useAuthStore'
import { useNotificationStore } from '../../common/stores/useNotificationStore'
import { usePendingRefreshStore } from '../../common/stores/usePendingRefreshStore'
import { useOpenGroupStore } from '../../common/stores/useOpenGroupStore'
import EmptyState from '../../components/ui/primitives/EmptyState'
import GroupHistoryModal from '../../components/ui/group/GroupHistoryModal'
import RevealSection from '../../components/ui/primitives/RevealSection'
import HostedGroupCard from './components/HostedGroupCard'
import { useHostActions } from './hooks/useHostActions'
import { useDeferWhileModalOpen } from '../../common/utils/hooks'

export default function ManageGroupsPage() {
  const activeUser = useAuthStore(s => s.user)
  const [historyOpen, setHistoryOpen] = useState(false)
  const closeHistory = () => setHistoryOpen(false)

  // 進入這個頁面就代表使用者看過「群組管理」相關的最新動態了，
  // 通知中心的紅點跟側邊欄紅點用同一套邏輯清除；也會反應在使用者
  // 停留在這頁時新進來的背景通知（unreadForPage 變動就會重新觸發）
  const unreadForPage = useNotificationStore(s => s.getUnreadCountForPage(activeUser?.id, '/manage-groups'))
  useEffect(() => {
    if (activeUser?.id && unreadForPage > 0) {
      useNotificationStore.getState().markReadForPage(activeUser.id, '/manage-groups')
    }
  }, [activeUser?.id, unreadForPage])

  // toast「重新整理」只會悄悄換掉 store 資料，卡片不會重新掛載、slide-up
  // 動畫不會重播；用這個 tick 當 key 強制整批卡片重新掛載一次
  const refreshTick = usePendingRefreshStore(s => s.refreshTick)

  // 團主的群組 Modal 已經改成全站掛載在 HostGroupModalHost（見 AppLayout.jsx），
  // 這裡的 useHostActions() 只用來拿列表要顯示的資料，不再自己管 Modal 開關狀態
  const {
    displayGroups: liveDisplayGroups, historyGroups: liveHistoryGroups,
    membersMap: liveMembersMap, applicationCounts: liveApplicationCounts,
    groupHandlersMap,
    refreshGroups,
  } = useHostActions(activeUser)
  const displayGroups = useDeferWhileModalOpen(liveDisplayGroups)
  const historyGroups = useDeferWhileModalOpen(liveHistoryGroups)
  const membersMap = useDeferWhileModalOpen(liveMembersMap)
  const applicationCounts = useDeferWhileModalOpen(liveApplicationCounts)

  // 從群組紀錄點進去查看的群組 Modal 關閉後，要能回到群組紀錄 Modal，
  // 而不是直接整個消失；用全站共用的 hostOpenGroupId 判斷該群組 Modal
  // 真的「已經開過、現在關閉了」，而不是點擊當下那個尚未開啟的 null 狀態
  const historyReopenRef = useRef(null)
  const hostOpenGroupId = useOpenGroupStore(s => s.hostOpenGroupId)
  useEffect(() => {
    const pending = historyReopenRef.current
    if (!pending) return
    if (hostOpenGroupId === pending.groupId) {
      pending.opened = true
      return
    }
    if (pending.opened && hostOpenGroupId === null) {
      historyReopenRef.current = null
      setHistoryOpen(true)
    }
  }, [hostOpenGroupId])

  return (
    <div className="px-2 md:px-4">
      <h1 className="page-title mb-6 text-center">群組管理</h1>

      <div className="fixed bottom-9 right-6 z-40">
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          aria-label="群組紀錄"
          className="relative grid h-14 w-14 place-items-center rounded-full border border-line bg-surface text-ink-2 shadow-floating transition-all hover:-translate-y-0.5 hover:bg-brand-subtle hover:text-brand lg:h-12 lg:w-12 dark:border-[#238EC7] dark:text-[#238EC7]"
        >
          <Archive className="size-6 lg:size-5" strokeWidth={1.5} />
        </button>
      </div>
      <div className="min-w-0">
        {displayGroups.length === 0 ? (
          <EmptyState
            title="你還沒有建立任何群組"
            description="建立你的第一個共享群組"
            actionLabel="建立第一個群組"
            onAction={() => window.dispatchEvent(new CustomEvent('pm:open-create-group'))}
          />
        ) : (
          <div key={refreshTick} className="grid grid-cols-1 gap-3 p-2 md:grid-cols-2 xl:grid-cols-3">
            {displayGroups.map((g, i) => (
              <RevealSection key={g.id} delay={i * 60}>
                <HostedGroupCard
                  group={g}
                  members={membersMap[g.id] ?? []}
                  pendingAppCount={applicationCounts[g.id] ?? 0}
                  paymentCount={0}
                  {...groupHandlersMap[g.id]}
                />
              </RevealSection>
            ))}
          </div>
        )}
      </div>
      <GroupHistoryModal
        isOpen={historyOpen}
        onClose={closeHistory}
        items={historyGroups}
        emptyDescription="已解散或已結束的群組會顯示在這裡"
        renderItem={(g, i) => (
          <RevealSection key={g.id} delay={i * 60}>
            <HostedGroupCard
              group={g}
              members={membersMap[g.id] ?? []}
              pendingAppCount={applicationCounts[g.id] ?? 0}
              paymentCount={0}
              onViewGroup={() => {
                historyReopenRef.current = { groupId: g.id, opened: false }
                closeHistory()
                refreshGroups()
                window.dispatchEvent(new CustomEvent('pm:open-host-group', { detail: { groupId: g.id } }))
              }}
            />
          </RevealSection>
        )}
      />
    </div>
  );
}
