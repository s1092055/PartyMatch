import { lazy, Suspense, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, ChevronLeft, ChevronRight, Info, RotateCcw, Search } from 'lucide-react'
import FlowLayout from '../../common/layout/FlowLayout'
import ScrollHint from '../../components/ui/primitives/ScrollHint'
import Step1Services from './components/steps/Step1Services'
import Step2PlansAndFilters from './components/steps/Step2PlansAndFilters'
import Step4Results from './components/steps/Step4Results'
import MatchSummaryPanel from './components/MatchSummaryPanel'
import { Button } from '../../components/ui/button'
import { useGroupStore } from '../../common/stores/useGroupStore'
import { useAuthStore } from '../../common/stores/useAuthStore'
import { useScrollEdge } from '../../common/utils/hooks'
import { matchGroups } from './utils/matchGroups'
import { PRICE_MIN, DEFAULT_PRICE_MAX } from './utils/priceRangeDefaults'

// /quick-match 是獨立於 AppLayout 之外的全螢幕流程頁面，GroupDetailModal 跟 MessagesModal
// 平常只在 AppLayout 裡掛載一次；這裡要自己掛一份，搜尋結果卡片點擊才能正常開啟群組詳情、
// 團主評價的「聯絡團主」（dispatch pm:open-dm）也才有 MessagesModal 監聽並開啟私訊
const GroupDetailModal = lazy(() => import('../group/GroupDetailModal'))
const MessagesModal = lazy(() => import('../messages/MessagesModal'))

const STEP_TITLES = ['選擇服務', '方案與條件', '搜尋結果']

const DEFAULT_CONDITIONS = {
  services:      [],
  selectedPlans: {},
  minPrice:      PRICE_MIN,
  maxPrice:      DEFAULT_PRICE_MAX,
  minRating:     0,
  groupAge:      'any',
}

export default function QuickMatchPage() {
  const navigate = useNavigate()
  const location = useLocation()
  function leaveFlow() {
    if (location.key === 'default') navigate('/explore')
    else navigate(-1)
  }
  const [step, setStep] = useState(1)
  const [conditions, setConditions] = useState(DEFAULT_CONDITIONS)
  const [results, setResults] = useState([])
  const {
    scrollRef, elRef: scrollElRef, atBottom, canScroll, isScrolling,
    handleScroll: handleContentScroll,
  } = useScrollEdge({ withMutationObserver: true, forwardWheel: step !== 2 })

  function toggleService(id) {
    setConditions(prev => {
      const removing = prev.services.includes(id)
      const services = removing ? prev.services.filter(s => s !== id) : [...prev.services, id]
      if (removing) {
        const selectedPlans = { ...prev.selectedPlans }
        delete selectedPlans[id]
        return { ...prev, services, selectedPlans }
      }
      return { ...prev, services }
    })
  }

  function handleChange(key, value) {
    setConditions(prev => ({ ...prev, [key]: value }))
  }

  function handleChangePlan(serviceId, planName) {
    setConditions(prev => ({
      ...prev,
      selectedPlans: { ...prev.selectedPlans, [serviceId]: planName },
    }))
  }

  function handleBack() {
    if (step > 1) {
      setStep(s => s - 1)
      scrollElRef.current?.scrollTo({ top: 0 })
    } else {
      leaveFlow()
    }
  }

  function handleNext() {
    if (step < 2) {
      setStep(s => s + 1)
      scrollElRef.current?.scrollTo({ top: 0 })
    }
  }

  function handleStartMatch() {
    const activeUserId = useAuthStore.getState().user?.id
    const candidateGroups = useGroupStore.getState().groups.filter(g => g.hostId !== activeUserId)
    const matched = matchGroups(candidateGroups, conditions)
    setResults(matched)
    setStep(3)
    scrollElRef.current?.scrollTo({ top: 0 })
  }

  function handleReset() {
    setConditions(DEFAULT_CONDITIONS)
    setResults([])
    setStep(1)
    scrollElRef.current?.scrollTo({ top: 0 })
  }

  const canNext = step === 1 ? conditions.services.length > 0 : true
  const isResultStep = step === 3

  function getBanner(currentStep) {
    switch (Math.min(currentStep, 3)) {
      case 1: return { Icon: AlertCircle, text: '請至少選擇一個服務' }
      case 2: return { Icon: Info, text: '請選擇搜尋的方案與篩選條件' }
      default: return results.length > 0
        ? { Icon: Info, text: `找到 ${results.length} 個符合條件的群組，依推薦分數排列` }
        : { Icon: Info, text: '沒有符合條件的群組，試著調整篩選條件' }
    }
  }
  const banner = getBanner(step)

  const footer = isResultStep ? (
    <>
      <Button variant="secondary" size="md" className="min-w-0 flex-1" onClick={handleBack}>
        <ChevronLeft size={15} strokeWidth={1.5} />
        調整條件
      </Button>
      <Button variant="secondary" size="md" className="min-w-0 flex-1" onClick={handleReset}>
        <RotateCcw size={15} />
        重新查找
      </Button>
    </>
  ) : (
    <>
      <Button variant="secondary" size="md" className="min-w-0 flex-1" onClick={handleBack}>
        <ChevronLeft size={15} strokeWidth={1.5} />
        {step === 1 ? '取消' : '上一步'}
      </Button>
      {step < 2 ? (
        <Button variant="default" size="md" className="min-w-0 flex-1" disabled={!canNext} onClick={handleNext}>
          下一步
          <ChevronRight size={15} strokeWidth={1.5} />
        </Button>
      ) : (
        <Button variant="success" size="md" className="min-w-0 flex-1" onClick={handleStartMatch}>
          <Search size={15} />
          開始搜尋
        </Button>
      )}
    </>
  )

  return (
    <>
    <FlowLayout
      steps={STEP_TITLES}
      currentStep={Math.min(step, 3)}
      title="快速搜尋"
      titleIcon={<Search size={18} className="shrink-0 text-brand" />}
      headerBanner={
        <div className="flex items-center justify-center gap-2 bg-brand-subtle px-6 py-3 text-sm font-medium text-brand">
          <banner.Icon size={15} />
          {banner.text}
        </div>
      }
      bottomNav={footer}
      maxWidth="max-w-xl md:max-w-2xl lg:max-w-4xl"
    >
      <div className="h-full">
        {isResultStep ? (
          <div className="flex h-full flex-col">
            <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-3">
              <div className="group relative min-w-0 min-h-0 flex-1">
                <div
                  ref={scrollRef}
                  onScroll={handleContentScroll}
                  key={step}
                  className="h-full overflow-y-auto p-2 pt-6 pb-4 animate-step-slide-up [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  <Step4Results results={results} />
                </div>
                <ScrollHint canScroll={canScroll} atBottom={atBottom} isScrolling={isScrolling} />
              </div>
              <div className="hidden shrink-0 self-stretch lg:block lg:mt-6 lg:mb-4 lg:w-px lg:bg-slate-200" />
              <div className="hidden shrink-0 lg:block lg:min-h-0 lg:w-72">
                <div className="h-full pt-6 pb-4">
                  <MatchSummaryPanel conditions={conditions} filtersChosen />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`flex h-full flex-col ${step === 2 && !canScroll ? 'lg:justify-center' : ''}`}>
            <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-3">
              <div className="group relative min-w-0 min-h-0 flex-1">
                <div
                  ref={scrollRef}
                  onScroll={handleContentScroll}
                  key={step}
                  className="h-full overflow-y-auto p-0.5 pt-6 pb-4 animate-step-slide-up [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {step === 1 && <Step1Services conditions={conditions} onToggle={toggleService} />}
                  {step === 2 && (
                    <Step2PlansAndFilters conditions={conditions} onChangePlan={handleChangePlan} onChangeFilter={handleChange} containerRef={scrollElRef} />
                  )}
                </div>
                <ScrollHint canScroll={canScroll} atBottom={atBottom} isScrolling={isScrolling} />
              </div>
              {step !== 1 && (
                <>
                  <div className="hidden shrink-0 self-stretch lg:block lg:mt-6 lg:mb-4 lg:w-px lg:bg-slate-200" />
                  <div className="hidden shrink-0 lg:block lg:min-h-0 lg:w-72">
                    <div className="h-full pt-6 pb-4">
                      <MatchSummaryPanel conditions={conditions} filtersChosen={step >= 2} onRemoveService={toggleService} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </FlowLayout>
    <Suspense fallback={null}>
      <MessagesModal />
      <GroupDetailModal />
    </Suspense>
    </>
  )
}
