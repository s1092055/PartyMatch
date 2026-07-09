import { useCallback, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, RotateCcw, Zap } from 'lucide-react'
import FlowLayout from '../../shared/layout/FlowLayout'
import Step1Services from './components/steps/Step1Services'
import Step2Plans from './components/steps/Step2Plans'
import Step3Filters from './components/steps/Step3Filters'
import Step4Results from './components/steps/Step4Results'
import MatchSummaryPanel from './components/MatchSummaryPanel'
import Button from '../../shared/ui/Button'
import { useGroupStore } from '../../shared/stores/useGroupStore'
import { useAuthStore } from '../../shared/stores/useAuthStore'
import { matchGroups } from './utils/matchGroups'

const STEP_TITLES = ['選擇服務', '選擇方案', '篩選條件', '配對結果']

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
  const [atBottom, setAtBottom] = useState(false)
  const [canScroll, setCanScroll] = useState(false)
  const scrollElRef = useRef(null)
  const resizeObserverRef = useRef(null)
  const mutationObserverRef = useRef(null)

  function updateScrollState(el) {
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    setAtBottom(scrollTop + clientHeight >= scrollHeight - 20)
    setCanScroll(scrollHeight > clientHeight + 20)
  }
  function handleContentScroll(e) { updateScrollState(e.currentTarget) }
  function scrollContentToTop() { scrollElRef.current?.scrollTo({ top: 0, behavior: 'smooth' }) }
  function scrollContentDown()  { scrollElRef.current?.scrollBy({ top: 200, behavior: 'smooth' }) }

  const scrollRef = useCallback((el) => {
    scrollElRef.current = el
    resizeObserverRef.current?.disconnect()
    mutationObserverRef.current?.disconnect()
    if (!el) return
    const check = () => updateScrollState(el)
    const observer = new ResizeObserver(check)
    observer.observe(el)
    resizeObserverRef.current = observer
    const mutationObserver = new MutationObserver(check)
    mutationObserver.observe(el, { childList: true, subtree: true })
    mutationObserverRef.current = mutationObserver
    updateScrollState(el)
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
      scrollElRef.current?.scrollTo({ top: 0 })
    } else {
      leaveFlow()
    }
  }

  function handleNext() {
    if (step < 3) {
      setStep(s => s + 1)
      scrollElRef.current?.scrollTo({ top: 0 })
    }
  }

  function handleStartMatch() {
    const activeUserId = useAuthStore.getState().user?.id
    const candidateGroups = useGroupStore.getState().groups.filter(g => g.hostId !== activeUserId)
    const matched = matchGroups(candidateGroups, conditions)
    setResults(matched)
    setStep(4)
    scrollElRef.current?.scrollTo({ top: 0 })
  }

  function handleReset() {
    setConditions(DEFAULT_CONDITIONS)
    setResults([])
    setStep(1)
    scrollElRef.current?.scrollTo({ top: 0 })
  }

  const canNext = step === 1 ? conditions.services.length > 0 : true
  const isResultStep = step === 4

  const footer = isResultStep ? (
    <>
      <Button variant="secondary" size="md" className="min-w-0 flex-1" onClick={handleReset}>
        <RotateCcw size={15} />
        重新配對
      </Button>
      <Button variant="secondary" size="md" className="min-w-0 flex-1" onClick={handleBack}>
        <ChevronLeft size={15} />
        調整條件
      </Button>
    </>
  ) : (
    <>
      <Button variant="secondary" size="md" className="min-w-0 flex-1" onClick={handleBack}>
        <ChevronLeft size={15} />
        {step === 1 ? '取消' : '上一步'}
      </Button>
      {step < 3 ? (
        <Button variant="primary" size="md" className="min-w-0 flex-1" disabled={!canNext} onClick={handleNext}>
          下一步
          <ChevronRight size={15} />
        </Button>
      ) : (
        <Button variant="success" size="md" className="min-w-0 flex-1" onClick={handleStartMatch}>
          <Zap size={15} />
          開始配對
        </Button>
      )}
    </>
  )

  return (
    <FlowLayout
      progress={(Math.min(step, 4) / 4) * 100}
      title={STEP_TITLES[step - 1]}
      bottomNav={footer}
      maxWidth="max-w-xl md:max-w-2xl lg:max-w-3xl"
    >
      <div className="relative h-full">
        <div
          ref={scrollRef}
          onScroll={handleContentScroll}
          className="h-full overflow-y-auto pt-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div key={step} className="h-full animate-step-slide-up p-0.5">
            {isResultStep ? (
              <Step4Results results={results} conditions={conditions} />
            ) : (
              <div className={`flex h-full flex-col gap-4 lg:flex-row lg:items-start ${!canScroll ? 'lg:justify-center' : ''}`}>
                <div className="min-w-0 flex-1">
                  {step === 1 && <Step1Services conditions={conditions} onToggle={toggleService} />}
                  {step === 2 && <Step2Plans conditions={conditions} onChangePlan={handleChangePlan} />}
                  {step === 3 && <Step3Filters conditions={conditions} onChange={handleChange} />}
                </div>
                <div className="hidden shrink-0 lg:block lg:w-72">
                  <MatchSummaryPanel conditions={conditions} />
                </div>
              </div>
            )}
          </div>
        </div>

        {!isResultStep && canScroll && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 hidden justify-end lg:flex">
            <button
              onClick={atBottom ? scrollContentToTop : scrollContentDown}
              className="pointer-events-auto grid h-8 w-8 place-items-center rounded-full border border-line bg-canvas shadow-md text-ink-3 transition-colors hover:text-ink animate-bounce"
              title={atBottom ? '回到頂部' : '往下捲動'}
            >
              {atBottom ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        )}
      </div>
    </FlowLayout>
  )
}
