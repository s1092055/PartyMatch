import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ChevronLeft, ChevronRight, Info, RotateCcw, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogCloseButton } from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import Step1Services from './components/steps/Step1Services'
import Step2PlansAndFilters from './components/steps/Step2PlansAndFilters'
import Step4Results from './components/steps/Step4Results'
import MatchSummaryPanel from './components/MatchSummaryPanel'
import { useGroupStore } from '../../common/stores/useGroupStore'
import { useAuthStore } from '../../common/stores/useAuthStore'
import { matchGroups } from './utils/matchGroups'
import { PRICE_MIN, DEFAULT_PRICE_MAX } from './utils/priceRangeDefaults'

const STEP_TITLES = ['選擇服務', '方案與條件', '搜尋結果']

const DEFAULT_CONDITIONS = {
  services:      [],
  selectedPlans: {},
  minPrice:      PRICE_MIN,
  maxPrice:      DEFAULT_PRICE_MAX,
  minRating:     0,
  groupAge:      'any',
}

export default function QuickMatchModal() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [conditions, setConditions] = useState(DEFAULT_CONDITIONS)
  const [results, setResults] = useState([])
  const bodyRef = useRef(null)

  useEffect(() => {
    function onOpen() {
      setStep(1)
      setConditions(DEFAULT_CONDITIONS)
      setResults([])
      setOpen(true)
    }
    window.addEventListener('pm:open-quick-match', onOpen)
    return () => window.removeEventListener('pm:open-quick-match', onOpen)
  }, [])

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
      bodyRef.current?.scrollTo({ top: 0 })
    } else {
      setOpen(false)
    }
  }

  function handleNext() {
    if (step < 2) {
      setStep(s => s + 1)
      bodyRef.current?.scrollTo({ top: 0 })
    }
  }

  function handleStartMatch() {
    const activeUserId = useAuthStore.getState().user?.id
    const candidateGroups = useGroupStore.getState().groups.filter(g => g.hostId !== activeUserId)
    const matched = matchGroups(candidateGroups, conditions)
    setResults(matched)
    setStep(3)
    bodyRef.current?.scrollTo({ top: 0 })
  }

  function handleReset() {
    setConditions(DEFAULT_CONDITIONS)
    setResults([])
    setStep(1)
    bodyRef.current?.scrollTo({ top: 0 })
  }

  function handleExploreAll() {
    setOpen(false)
    navigate('/explore')
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent maxWidth="max-w-4xl" height="min(88dvh, 760px)">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search size={18} className="shrink-0 text-brand" strokeWidth={1.5} />
            快速搜尋
          </DialogTitle>
          <DialogDescription>依服務、方案與篩選條件快速搜尋符合的共享群組</DialogDescription>
          <DialogCloseButton />
        </DialogHeader>

        <div className="shrink-0 border-b border-line bg-raised/70 px-6 py-3">
          <div className="mb-2 flex items-center gap-1.5">
            {STEP_TITLES.map((label, i) => (
              <div
                key={label}
                className={`h-1 flex-1 rounded-full transition-colors ${i < Math.min(step, 3) ? 'bg-brand' : 'bg-line'}`}
              />
            ))}
          </div>
          <div className="mb-2 flex gap-1">
            {STEP_TITLES.map((label, i) => (
              <span
                key={label}
                className={`flex-1 truncate text-center text-xs font-bold ${i + 1 === step ? 'text-brand' : 'text-ink-3'}`}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-brand">
            <banner.Icon size={14} />
            {banner.text}
          </div>
        </div>

        <div
          ref={bodyRef}
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden px-6 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-row lg:items-start"
        >
          <div className="min-w-0 flex-1">
            {step === 1 && <Step1Services conditions={conditions} onToggle={toggleService} />}
            {step === 2 && (
              <Step2PlansAndFilters conditions={conditions} onChangePlan={handleChangePlan} onChangeFilter={handleChange} containerRef={bodyRef} />
            )}
            {isResultStep && <Step4Results results={results} />}
          </div>

          {step !== 1 && (
            <div className="hidden shrink-0 lg:sticky lg:top-0 lg:block lg:w-72 lg:self-start">
              <MatchSummaryPanel
                conditions={conditions}
                filtersChosen={step >= 2}
                onRemoveService={!isResultStep ? toggleService : undefined}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          {isResultStep ? (
            <>
              <Button variant="secondary" size="md" className="min-w-0 flex-1" onClick={handleBack}>
                <ChevronLeft size={15} strokeWidth={1.5} />
                調整條件
              </Button>
              <Button variant="secondary" size="md" className="min-w-0 flex-1" onClick={handleReset}>
                <RotateCcw size={15} />
                重新查找
              </Button>
              <Button variant="ghost" size="md" className="min-w-0 flex-1 border border-line" onClick={handleExploreAll}>
                探索所有群組
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
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
