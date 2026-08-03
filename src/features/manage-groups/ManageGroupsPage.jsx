import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Archive } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { useAuthStore } from '../../common/stores/useAuthStore'
import EmptyState from '../../components/ui/primitives/EmptyState'
import GroupViewModal from '../../components/ui/group/GroupViewModal'
import GroupHistoryModal from '../../components/ui/group/GroupHistoryModal'
import FilterTabsBar from '../../components/ui/FilterTabsBar'
import RevealSection from '../../components/ui/primitives/RevealSection'
import ScrollHint from '../../components/ui/primitives/ScrollHint'
import HostedGroupCard from './components/HostedGroupCard'
import RenewalModal from './components/RenewalModal'
import { STATUS_FILTER_TABS } from './utils/hostFilters'
import { useHostActions } from './hooks/useHostActions'
import { useScrollEdge } from '../../common/utils/hooks'

export default function ManageGroupsPage() {
  const navigate = useNavigate()
  const activeUser = useAuthStore(s => s.user)
  const [historyOpen, setHistoryOpen] = useState(false)
  const closeHistory = () => setHistoryOpen(false)
  const { scrollRef: listScrollRef, canScroll: listCanScroll, atBottom: listAtBottom, isScrolling: listIsScrolling, handleScroll: handleListScroll } = useScrollEdge()

  const {
    errors,
    statusFilter, setStatusFilter,
    viewGroupId, setViewGroupId,
    autoOpenLockGroup, setAutoOpenLockGroup,
    autoOpenActivate, setAutoOpenActivate,
    autoOpenApplications, setAutoOpenApplications,
    autoOpenBilling, setAutoOpenBilling,
    autoOpenMemberInfo, setAutoOpenMemberInfo,
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="page-title mb-0">群組管理</h1>
        <Button
          variant="ghost"
          onClick={() => setHistoryOpen(true)}
          aria-label="群組紀錄"
          className="h-9 shrink-0 rounded-lg border border-line px-3"
        >
          <Archive size={14} strokeWidth={1.5} />
          群組紀錄
        </Button>
      </div>

      <FilterTabsBar
        tabs={STATUS_FILTER_TABS}
        value={statusFilter}
        onChange={setStatusFilter}
        counts={filterCounts}
      />

      <div className="min-w-0">
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
              className="max-h-[calc(100dvh-16rem)] overflow-y-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-3">
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

      <GroupViewModal
        isOpen={!!viewGroupId}
        onClose={() => { setViewGroupId(null); setAutoOpenLockGroup(false); setAutoOpenActivate(false); setAutoOpenApplications(false); setAutoOpenBilling(false); setAutoOpenMemberInfo(false); refreshGroups() }}
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
        autoOpenMemberInfo={autoOpenMemberInfo}
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
              onViewGroup={() => { closeHistory(); refreshGroups(); setViewGroupId(g.id) }}
            />
          </RevealSection>
        )}
      />
    </div>
  )
}
