import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../shared/stores/useAuthStore'
import EmptyState from '../../shared/ui/EmptyState'
import GroupViewModal from '../../shared/ui/GroupViewModal'
import FilterTabsBar from '../../shared/ui/FilterTabsBar'
import RevealSection from '../../shared/ui/RevealSection'
import HostedGroupCard from './components/HostedGroupCard'
import GroupHistoryModal from './components/GroupHistoryModal'
import RenewalModal from './components/RenewalModal'
import { STATUS_FILTER_TABS } from './utils/manageFilters'
import { useManageActions } from './hooks/useManageActions'

export default function ManagePage({ embedded = false }) {
  const navigate = useNavigate()
  const activeUser = useAuthStore(s => s.user)

  const {
    errors,
    statusFilter, setStatusFilter,
    viewGroupId, setViewGroupId,
    autoOpenActivateGroup, setAutoOpenActivateGroup,
    autoOpenActivate, setAutoOpenActivate,
    autoOpenApplications, setAutoOpenApplications,
    autoOpenBilling, setAutoOpenBilling,
    setHistoryModalGroupId,
    setRenewalModalGroupId,
    allGroups, displayGroups, filterCounts, membersMap, applicationCounts,
    historyModalGroup, renewalModalGroup,
    groupHandlersMap,
    refreshGroups,
    handleActivateGroup,
    handleRemoveMember,
    handleActivate,
    handleCancelGroup,
    handleStartRenewal,
    handleEndGroup,
    handleApprove,
    handleReportServiceInfoIssue,
    handleReject,
  } = useManageActions(activeUser)

  return (
    <div className="px-2 md:px-4 lg:px-16">
      {!embedded && (
        <div className="mb-6 text-center">
          <h1 className="page-title">群組管理</h1>
        </div>
      )}

      <div>
        <FilterTabsBar
          tabs={STATUS_FILTER_TABS}
          value={statusFilter}
          onChange={setStatusFilter}
          counts={filterCounts}
        />

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
            actionLabel="清除篩選"
            onAction={() => setStatusFilter('all')}
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
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
        onClose={() => { setViewGroupId(null); setAutoOpenActivateGroup(false); setAutoOpenActivate(false); setAutoOpenApplications(false); setAutoOpenBilling(false); refreshGroups() }}
        groupId={viewGroupId}
        onReportServiceInfoIssue={handleReportServiceInfoIssue}
        onActivate={handleActivate}
        onActivateGroup={handleActivateGroup}
        onCancelGroup={handleCancelGroup}
        onRemoveMember={handleRemoveMember}
        onApprove={handleApprove}
        onReject={handleReject}
        errors={errors}
        autoOpenActivateGroup={autoOpenActivateGroup}
        autoOpenActivate={autoOpenActivate}
        onAutoOpenActivateDone={() => setAutoOpenActivate(false)}
        autoOpenApplications={autoOpenApplications}
        autoOpenBilling={autoOpenBilling}
      />
      {historyModalGroup && (
        <GroupHistoryModal
          isOpen
          onClose={() => setHistoryModalGroupId(null)}
          group={historyModalGroup}
          members={membersMap[historyModalGroup.id] ?? []}
        />
      )}
      {renewalModalGroup && (
        <RenewalModal
          isOpen
          onClose={() => setRenewalModalGroupId(null)}
          group={renewalModalGroup}
          onStartRenewal={handleStartRenewal}
          onEndGroup={handleEndGroup}
        />
      )}
    </div>
  )
}
