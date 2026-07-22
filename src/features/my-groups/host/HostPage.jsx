import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../shared/stores/useAuthStore'
import EmptyState from '../../../shared/ui/primitives/EmptyState'
import GroupViewModal from '../../../shared/ui/group/GroupViewModal'
import GroupHistoryModal from '../../../shared/ui/group/GroupHistoryModal'
import FilterTabsBar from '../../../shared/ui/FilterTabsBar'
import RevealSection from '../../../shared/ui/primitives/RevealSection'
import ScrollHint from '../../../shared/ui/primitives/ScrollHint'
import HostedGroupCard from './components/HostedGroupCard'
import RenewalModal from './components/RenewalModal'
import HostReviewsModal from './components/HostReviewsModal'
import { STATUS_FILTER_TABS } from './utils/hostFilters'
import { useHostActions } from './hooks/useHostActions'
import { useScrollEdge } from '../../../shared/utils/hooks'

export default function HostPage({ embedded = false }) {
  const navigate = useNavigate()
  const activeUser = useAuthStore(s => s.user)
  const { scrollRef: listScrollRef, canScroll: listCanScroll, atBottom: listAtBottom, isScrolling: listIsScrolling, handleScroll: handleListScroll } = useScrollEdge()
  const [historyOpen, setHistoryOpen] = useState(false)
  const [reviewsOpen, setReviewsOpen] = useState(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const hostProfile = useMemo(() => useAuthStore.getState().getProfile(), [activeUser])

  const {
    errors,
    statusFilter, setStatusFilter,
    viewGroupId, setViewGroupId,
    autoOpenLockGroup, setAutoOpenLockGroup,
    autoOpenActivate, setAutoOpenActivate,
    autoOpenApplications, setAutoOpenApplications,
    autoOpenBilling, setAutoOpenBilling,
    setRenewalModalGroupId,
    allGroups, displayGroups, historyGroups, filterCounts, membersMap, applicationCounts,
    renewalModalGroup,
    groupHandlersMap,
    refreshGroups,
    handleLockGroup,
    handleRemoveMember,
    handleActivate,
    handleCancelGroup,
    handleStartRenewal,
    handleEndGroup,
    handleApprove,
    handleReportServiceInfoIssue,
    handleReject,
  } = useHostActions(activeUser)

  return (
    <div className="px-2 md:px-4 lg:px-16">
      {!embedded && (
        <div className="mb-6 text-center">
          <h1 className="page-title">群組管理</h1>
        </div>
      )}

      <div className="md:flex md:gap-6 lg:gap-8">
        <FilterTabsBar
          tabs={STATUS_FILTER_TABS}
          value={statusFilter}
          onChange={setStatusFilter}
          counts={filterCounts}
          onOpenHistory={() => setHistoryOpen(true)}
          historyCount={historyGroups.length}
          onOpenReviews={() => setReviewsOpen(true)}
        />

        <div className="min-w-0 flex-1">
          {allGroups.length === 0 ? (
            <EmptyState
              title="你還沒有建立任何群組"
              description="建立你的第一個共享群組，開始招募成員一起分攤費用"
              actionLabel="建立第一個群組"
              onAction={() => navigate('/create-group')}
            />
          ) : displayGroups.length === 0 ? (
            <EmptyState
              title="此分類目前沒有群組"
              description="試試切換到其他狀態分類"
            />
          ) : (
            <div className="group relative">
              <div
                ref={listScrollRef}
                onScroll={handleListScroll}
                className="max-h-[calc(100vh-16rem)] overflow-y-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <div className="grid gap-3 md:grid-cols-2">
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
              </div>
              <ScrollHint canScroll={listCanScroll} atBottom={listAtBottom} isScrolling={listIsScrolling} />
            </div>
          )}
        </div>
      </div>

      <GroupViewModal
        isOpen={!!viewGroupId}
        onClose={() => { setViewGroupId(null); setAutoOpenLockGroup(false); setAutoOpenActivate(false); setAutoOpenApplications(false); setAutoOpenBilling(false); refreshGroups() }}
        groupId={viewGroupId}
        onReportServiceInfoIssue={handleReportServiceInfoIssue}
        onActivate={handleActivate}
        onLockGroup={handleLockGroup}
        onCancelGroup={handleCancelGroup}
        onRemoveMember={handleRemoveMember}
        onApprove={handleApprove}
        onReject={handleReject}
        errors={errors}
        autoOpenLockGroup={autoOpenLockGroup}
        autoOpenActivate={autoOpenActivate}
        onAutoOpenActivateDone={() => setAutoOpenActivate(false)}
        autoOpenApplications={autoOpenApplications}
        autoOpenBilling={autoOpenBilling}
        onOpenRenewal={() => setRenewalModalGroupId(viewGroupId)}
      />
      {renewalModalGroup && (
        <RenewalModal
          isOpen
          onClose={() => setRenewalModalGroupId(null)}
          group={renewalModalGroup}
          onStartRenewal={handleStartRenewal}
          onEndGroup={handleEndGroup}
        />
      )}

      <GroupHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        items={historyGroups}
        emptyDescription="已解散或已結束的群組會顯示在這裡"
        renderItem={(g, i) => (
          <RevealSection key={g.id} delay={i * 60}>
            <HostedGroupCard
              group={g}
              members={membersMap[g.id] ?? []}
              pendingAppCount={applicationCounts[g.id] ?? 0}
              paymentCount={0}
              onViewGroup={() => { setHistoryOpen(false); refreshGroups(); setViewGroupId(g.id) }}
            />
          </RevealSection>
        )}
      />

      <HostReviewsModal
        isOpen={reviewsOpen}
        onClose={() => setReviewsOpen(false)}
        host={hostProfile}
      />
    </div>
  )
}
