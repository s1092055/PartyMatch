import { useState } from 'react'
import { Archive } from 'lucide-react'
import { useAuthStore } from '../../common/stores/useAuthStore'
import EmptyState from '../../components/ui/primitives/EmptyState'
import GroupViewModal from '../../components/ui/group/GroupViewModal'
import GroupHistoryModal from '../../components/ui/group/GroupHistoryModal'
import FilterTabsBar from '../../components/ui/FilterTabsBar'
import RevealSection from '../../components/ui/primitives/RevealSection'
import HostedGroupCard from './components/HostedGroupCard'
import RenewalModal from './components/RenewalModal'
import { STATUS_FILTER_TABS } from './utils/hostFilters'
import { useHostActions } from './hooks/useHostActions'

export default function ManageGroupsPage() {
  const activeUser = useAuthStore(s => s.user)
  const [historyOpen, setHistoryOpen] = useState(false)
  const closeHistory = () => setHistoryOpen(false)

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
    handleResolveDispute,
    handleReject,
    handleAdjustBillingDate,
  } = useHostActions(activeUser)

  return (
    <div className="px-2 md:px-4">
      <h1 className="page-title mb-6 text-center">群組管理</h1>

      <div className="fixed bottom-9 left-6 z-40 can-hover:lg:left-24">
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          aria-label="群組紀錄"
          className="relative flex h-12 w-12 items-center justify-center gap-2 rounded-full border border-line bg-surface text-sm font-bold text-ink-2 shadow-floating transition-all hover:-translate-y-0.5 hover:bg-brand-subtle hover:text-brand lg:h-10 lg:w-auto lg:justify-start lg:px-4"
        >
          <Archive className="size-5 lg:size-4" strokeWidth={1.5} />
          <span className="hidden lg:inline">群組紀錄</span>
        </button>
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
            description="建立你的第一個共享群組"
            actionLabel="建立第一個群組"
            onAction={() => window.dispatchEvent(new CustomEvent('pm:open-create-group'))}
          />
        ) : displayGroups.length === 0 ? (
          <EmptyState
            title="此分類目前沒有群組"
            description="試試切換到其他狀態分類"
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 p-2 md:grid-cols-2 xl:grid-cols-3">
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
      <GroupViewModal
        isOpen={!!viewGroupId}
        onClose={() => { setViewGroupId(null); setAutoOpenLockGroup(false); setAutoOpenActivate(false); setAutoOpenApplications(false); setAutoOpenBilling(false); setAutoOpenMemberInfo(false); refreshGroups() }}
        groupId={viewGroupId}
        onReportServiceInfoIssue={handleReportServiceInfoIssue}
        onResolveDispute={handleResolveDispute}
        onActivate={handleActivate}
        onLockGroup={handleLockGroup}
        onCancelGroup={handleCancelGroup}
        onRemoveMember={handleRemoveMember}
        onApprove={handleApprove}
        onReject={handleReject}
        onAdjustBillingDate={handleAdjustBillingDate}
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
  );
}
