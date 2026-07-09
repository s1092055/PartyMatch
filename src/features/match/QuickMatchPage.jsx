import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, ChevronLeft, ChevronRight, Info, RotateCcw, Search } from 'lucide-react'
import FlowLayout from '../../shared/layout/FlowLayout'
import ScrollHintButton from '../../shared/ui/ScrollHintButton'
import Step1Services from './components/steps/Step1Services'
import Step2PlansAndFilters from './components/steps/Step2PlansAndFilters'
import Step4Results from './components/steps/Step4Results'
import MatchSummaryPanel from './components/MatchSummaryPanel'
import Button from '../../shared/ui/Button'
import { useGroupStore } from '../../shared/stores/useGroupStore'
import { useAuthStore } from '../../shared/stores/useAuthStore'
import { useScrollEdge } from '../../shared/utils/hooks'
import { matchGroups } from './utils/matchGroups'

const STEP_TITLES = ['選擇服務', '方案與條件', '配對結果']

const DEFAULT_CONDITIONS = {
  services:      [],
  selectedPlans: {},
  maxPrice:      100,
  minRating:     70,
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
    scrollRef, elRef: scrollElRef, atBottom, canScroll,
    handleScroll: handleContentScroll, scrollToTop: scrollContentToTop, scrollDown: scrollContentDown,
  } = useScrollEdge({ withMutationObserver: true })

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
      case 2: return { Icon: Info, text: '請選擇要查找的方案，篩選條件皆為選填' }
      default: return results.length > 0
        ? { Icon: Info, text: `找到 ${results.length} 個符合條件的群組，依推薦分數排列` }
        : { Icon: Info, text: '沒有符合條件的群組，試著調整篩選條件' }
    }
  }
  const banner = getBanner(step)

  const footer = isResultStep ? (
    <>
      <Button variant="secondary" size="md" className="min-w-0 flex-1" onClick={handleBack}>
        <ChevronLeft size={15} />
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
        <ChevronLeft size={15} />
        {step === 1 ? '取消' : '上一步'}
      </Button>
      {step < 2 ? (
        <Button variant="primary" size="md" className="min-w-0 flex-1" disabled={!canNext} onClick={handleNext}>
          下一步
          <ChevronRight size={15} />
        </Button>
      ) : (
        <Button variant="success" size="md" className="min-w-0 flex-1" onClick={handleStartMatch}>
          <Search size={15} />
          開始查找
        </Button>
      )}
    </>
  )

  return (
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
      <div className="relative h-full">
        <div
          ref={scrollRef}
          onScroll={handleContentScroll}
          className="h-full overflow-y-auto pt-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="h-full p-0.5">
            {isResultStep ? (
              <div key={step} className="h-full animate-step-slide-up">
                <Step4Results results={results} conditions={conditions} />
              </div>
            ) : (
              <div className={`flex h-full flex-col ${step === 2 && !canScroll ? 'lg:justify-center' : ''}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
                  <div key={step} className="min-w-0 flex-1 animate-step-slide-up">
                    {step === 1 && <Step1Services conditions={conditions} onToggle={toggleService} />}
                    {step === 2 && (
                      <Step2PlansAndFilters conditions={conditions} onChangePlan={handleChangePlan} onChangeFilter={handleChange} />
                    )}
                  </div>
                  {step !== 1 && (
                    <>
                      <div className="hidden shrink-0 self-stretch lg:block lg:w-px lg:bg-slate-200" />
                      <div className="hidden shrink-0 lg:block lg:w-72">
                        <MatchSummaryPanel conditions={conditions} filtersChosen={step >= 2} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {!isResultStep && (
          <ScrollHintButton
            canScroll={canScroll}
            atBottom={atBottom}
            onScrollToTop={scrollContentToTop}
            onScrollDown={scrollContentDown}
          />
        )}
      </div>
    </FlowLayout>
  )
}
