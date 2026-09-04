import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Compass, RotateCw, Search } from 'lucide-react'
import { useGroupStore } from '../../common/stores/useGroupStore'
import { useApplicationStore } from '../../common/stores/useApplicationStore'
import { useMemberStore } from '../../common/stores/useMemberStore'
import { useDeferWhileModalOpen } from '../../common/utils/hooks'
import { applyFilters } from '../../common/utils/searchUtils'
import { useAuthStore } from '../../common/stores/useAuthStore'
import EmptyState from '../../components/ui/primitives/EmptyState'
import PageHeader from '../../common/layout/PageHeader'
import RevealSection from '../../components/ui/primitives/RevealSection'
import CategoryPills from '../../components/ui/primitives/CategoryPills'
import ExploreGroupCard from './components/ExploreGroupCard'

export default function ExplorePage() {
  const location = useLocation();
  const [category, setCategory] = useState('all')
  const activeUserId = useAuthStore(s => s.user?.id)
  const groups = useDeferWhileModalOpen(useGroupStore(s => s.groups))
  const applications = useDeferWhileModalOpen(useApplicationStore(s => s.applications))
  const members = useDeferWhileModalOpen(useMemberStore(s => s.members))
  const [refreshing, setRefreshing] = useState(false)

  // location.key 在任何 navigate() 之後都會變（包含群組詳情 Modal 開關時
  // 附加/移除的 ?group= 參數），如果不排除掉這個參數，點開一個「已額滿」的
  // 群組時，這裡會用只抓 recruiting 狀態的請求把 groups store 整包蓋掉，
  // 額滿群組不在這批資料裡，Modal 就會因為找不到群組而沒開啟（間歇性發生，
  // 純粹是這裡的重抓跟 Modal 自己要讀的資料互相覆蓋的先後順序問題）
  const pageEntryKeyRef = useRef(null)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    params.delete('group')
    const entryKey = `${location.pathname}?${params.toString()}`
    if (pageEntryKeyRef.current === entryKey) return
    pageEntryKeyRef.current = entryKey
    useGroupStore.getState().init({ all: true })
    window.scrollTo(0, 0)
  }, [location.key]) // eslint-disable-line react-hooks/exhaustive-deps

  // 條件搜尋 Modal 已經是全站掛載（AppNav.jsx），這裡只需要在從舊路由／首頁按鈕帶著
  // openConditionSearch 導航進來時，補發一次全站事件請它自動開啟
  useEffect(() => {
    if (location.state?.openConditionSearch) {
      window.dispatchEvent(new CustomEvent('pm:open-condition-search'))
    }
  }, [location.state]);

  async function handleRefresh() {
    if (refreshing) return
    setRefreshing(true)
    try {
      await useGroupStore.getState().init({ all: true })
      window.scrollTo(0, 0)
    } finally {
      setRefreshing(false)
    }
  }

  const allGroups = useMemo(
    () => groups.filter(g => g.hostId !== activeUserId),
    [groups, activeUserId],
  )

  const { appliedGroupIds, memberGroupIds } = useMemo(() => {
    if (!activeUserId) return { appliedGroupIds: new Set(), memberGroupIds: new Set() }
    const applied = new Set(
      applications
        .filter(a => (a.applicantId ?? a.userId) === activeUserId && a.status === 'pending')
        .map(a => a.groupId)
    )
    const memberIds = new Set(
      members.filter(m => m.userId === activeUserId).map(m => m.groupId)
    )
    return { appliedGroupIds: applied, memberGroupIds: memberIds }
  }, [activeUserId, applications, members])

  const filtered = useMemo(
    () => applyFilters(allGroups, { category }),
    [allGroups, category],
  )

  return (
    <div className="px-2 md:px-4">
      <div className="sticky top-0 z-30 -mx-2 -mt-8 bg-canvas px-2 pb-5 pt-8 md:-mx-4 md:px-4">
        <PageHeader title="探索群組" className="mb-6 text-center" />

        <CategoryPills
          variant="grid"
          showAll
          active={category}
          onChange={c => { setCategory(c); window.scrollTo(0, 0) }}
        />
      </div>

      <div className="fixed bottom-28 right-6 z-40 can-hover:lg:bottom-40">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('pm:open-condition-search'))}
          aria-label="條件搜尋"
          className="relative grid h-14 w-14 place-items-center rounded-full border border-line bg-surface text-ink-2 shadow-floating transition-all hover:-translate-y-0.5 hover:bg-brand-subtle hover:text-brand lg:h-12 lg:w-12 dark:border-[#238EC7] dark:text-[#238EC7]"
        >
          <Search className="size-6 lg:size-5" strokeWidth={1.5} />
        </button>
      </div>

      <div className="fixed bottom-9 right-6 z-40 can-hover:lg:bottom-24">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="重新整理群組列表"
          className="relative grid h-14 w-14 place-items-center rounded-full border border-line bg-surface text-ink-2 shadow-floating transition-all hover:-translate-y-0.5 hover:bg-brand-subtle hover:text-brand disabled:opacity-60 lg:h-12 lg:w-12 dark:border-[#238EC7] dark:text-[#238EC7]"
        >
          <span className={`inline-flex size-6 lg:size-5 transition-transform duration-700 ease-out ${refreshing ? 'animate-spin [animation-duration:0.7s]' : ''}`}>
            <RotateCw className="size-full" strokeWidth={1.5} />
          </span>
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="沒有符合條件的群組"
          description="試著調整篩選分類，或使用右下角的條件搜尋"
        />
      ) : (
        (<div
          key={category}
          className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
          {filtered.map((group, i) => (
            <RevealSection key={group.id} delay={Math.min(i * 60, 300)}>
              <ExploreGroupCard group={group} isApplied={appliedGroupIds.has(group.id)} isMember={memberGroupIds.has(group.id)} />
            </RevealSection>
          ))}
        </div>)
      )}
    </div>
  );
}
