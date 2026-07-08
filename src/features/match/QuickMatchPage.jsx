import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, RotateCcw, Zap } from 'lucide-react'
import FlowLayout from '../../shared/layout/FlowLayout'
import SlideTrack, { SlidePanel } from '../../shared/ui/SlideTrack'
import Step1Services from './components/steps/Step1Services'
import Step2Plans from './components/steps/Step2Plans'
import Step3Filters from './components/steps/Step3Filters'
import Step4Results from './components/steps/Step4Results'
import MatchSummaryPanel from './components/MatchSummaryPanel'
import Button from '../../shared/ui/Button'
import { useGroupStore } from '../../shared/stores/useGroupStore'
import { useAuthStore } from '../../shared/stores/useAuthStore'
import { matchGroups } from './utils/matchGroups'

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
    if (step > 1) setStep(s => s - 1)
    else leaveFlow()
  }

  function handleNext() {
    if (step < 3) setStep(s => s + 1)
  }

  function handleStartMatch() {
    const activeUserId = useAuthStore.getState().user?.id
    const candidateGroups = useGroupStore.getState().groups.filter(g => g.hostId !== activeUserId)
    const matched = matchGroups(candidateGroups, conditions)
    setResults(matched)
    setStep(4)
  }

  function handleReset() {
    setConditions(DEFAULT_CONDITIONS)
    setResults([])
    setStep(1)
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
    <FlowLayout progress={(Math.min(step, 4) / 4) * 100} bottomNav={footer}>
      <SlideTrack activeIndex={step - 1} count={4}>
        <SlidePanel count={4}>
          <div className="flex flex-col gap-4 py-4 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1">
              <Step1Services conditions={conditions} onToggle={toggleService} />
            </div>
            <div className="hidden shrink-0 lg:block lg:w-72">
              <MatchSummaryPanel conditions={conditions} />
            </div>
          </div>
        </SlidePanel>
        <SlidePanel count={4}>
          <div className="flex flex-col gap-4 py-4 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1">
              <Step2Plans conditions={conditions} onChangePlan={handleChangePlan} />
            </div>
            <div className="hidden shrink-0 lg:block lg:w-72">
              <MatchSummaryPanel conditions={conditions} />
            </div>
          </div>
        </SlidePanel>
        <SlidePanel count={4}>
          <div className="flex flex-col gap-4 py-4 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1">
              <Step3Filters conditions={conditions} onChange={handleChange} />
            </div>
            <div className="hidden shrink-0 lg:block lg:w-72">
              <MatchSummaryPanel conditions={conditions} />
            </div>
          </div>
        </SlidePanel>
        <SlidePanel count={4}>
          <Step4Results results={results} conditions={conditions} />
        </SlidePanel>
      </SlideTrack>
    </FlowLayout>
  )
}
