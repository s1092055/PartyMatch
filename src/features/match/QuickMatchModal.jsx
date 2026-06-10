import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Compass, RotateCcw, Zap } from 'lucide-react'
import ServiceSelectionGrid from './components/ServiceSelectionGrid'
import MatchSummaryPanel from './components/MatchSummaryPanel'
import ServiceLogo from '../../shared/components/ui/ServiceLogo'
import { getServiceById } from '../../shared/services/serviceTypes'
import MatchConditionBar from './components/MatchConditionBar'
import ExploreGroupCard from '../explore/components/ExploreGroupCard'
import CreateGroupStepper from '../create/components/CreateGroupStepper'
import Button from '../../shared/components/ui/Button'
import ModalShell from '../../shared/components/ui/ModalShell'
import { isAuthenticated } from '../../shared/stores/authStore'
import { getGroups } from '../../shared/stores/groupStore'
import { matchGroups } from '../../shared/utils/matchGroups'

const DEFAULT_CONDITIONS = {
  services:      [],
  selectedPlans: {},
  maxPrice:      100,
  minRating:     70,
  groupAge:      'any',
}

const STEPS = [
  { n: 1, label: '選擇服務' },
  { n: 2, label: '選擇方案' },
  { n: 3, label: '篩選條件' },
  { n: 4, label: '配對結果' },
]


function Step1({ conditions, onToggle }) {
  return (
    <div>
      <h3 className="text-base font-extrabold text-ink mb-4">選擇你想搜尋的服務（複選）</h3>
      <ServiceSelectionGrid selected={conditions.services} onToggle={onToggle} />
      {conditions.services.length === 0 && (
        <div className="flex items-center gap-2 mt-3 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
          <AlertCircle size={13} />
          請至少選擇一個服務
        </div>
      )}
    </div>
  )
}

const RATING_MARKS = [60, 70, 80, 90]

function Step2({ conditions, onChangePlan }) {
  return (
    <div>
      <h3 className="text-base font-extrabold text-ink mb-0.5">選擇方案</h3>
      <p className="text-xs text-ink-3 mb-5">為每個服務選擇你想加入的方案</p>
      <div className="space-y-6">
        {conditions.services.map(serviceId => {
          const service = getServiceById(serviceId)
          if (!service) return null
          const selected = conditions.selectedPlans?.[serviceId] ?? 'any'
          return (
            <div key={serviceId}>
              <div className="mb-3 flex items-center gap-2">
                <ServiceLogo serviceId={serviceId} size={24} className="rounded-lg" />
                <p className="text-sm font-extrabold text-ink">{service.name}</p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  onClick={() => onChangePlan(serviceId, 'any')}
                  className={`rounded-xl border px-4 py-2.5 text-left transition-colors ${
                    selected === 'any'
                      ? 'border-brand bg-brand-subtle text-brand'
                      : 'border-line bg-surface text-ink-2 hover:border-brand/40 hover:text-ink'
                  }`}
                >
                  <p className="text-sm font-bold">不限方案</p>
                  <p className="text-xs text-ink-4 mt-0.5">接受所有方案</p>
                </button>
                {service.plans.map(plan => (
                  <button
                    key={plan.name}
                    onClick={() => onChangePlan(serviceId, plan.name)}
                    className={`rounded-xl border px-4 py-2.5 text-left transition-colors ${
                      selected === plan.name
                        ? 'border-brand bg-brand-subtle text-brand'
                        : 'border-line bg-surface text-ink-2 hover:border-brand/40 hover:text-ink'
                    }`}
                  >
                    <p className="text-sm font-bold">{plan.name}</p>
                    <p className="text-xs text-ink-4 mt-0.5">NT${plan.monthlyPrice}/月・最多 {plan.maxSeats} 人</p>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Step3({ conditions, onChange }) {
  const pricePct = ((conditions.maxPrice - 50) / (500 - 50)) * 100
  return (
    <div>
      <h3 className="text-base font-extrabold text-ink mb-0.5">篩選條件</h3>
      <p className="text-xs text-ink-3 mb-5">選填，不填寫也可以直接開始配對</p>
      <div className="space-y-6">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-bold text-ink">預算上限</label>
            <span className="text-sm font-bold text-brand">NT${conditions.maxPrice} 以下</span>
          </div>
          <div className="relative pt-1">
            <div className="relative h-1.5 rounded-full bg-line">
              <div className="absolute h-full rounded-full bg-brand" style={{ width: `${pricePct}%` }} />
            </div>
            <input
              type="range" min={50} max={500} step={10} value={conditions.maxPrice}
              onChange={e => onChange('maxPrice', Number(e.target.value))}
              className="absolute inset-0 h-1.5 w-full cursor-pointer opacity-0"
            />
            <div className="mt-1 flex justify-between">
              <span className="text-xs text-ink-4">NT$50</span>
              <span className="text-xs text-ink-4">NT$500</span>
            </div>
          </div>
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-bold text-ink">最低信用分數</label>
            <span className="text-sm font-bold text-warning">{conditions.minRating} 分以上</span>
          </div>
          <div className="relative pt-1">
            <div className="relative h-1.5 rounded-full bg-line">
              <div className="absolute h-full rounded-full bg-brand" style={{ width: `${conditions.minRating}%` }} />
            </div>
            <input
              type="range" min={0} max={100} step={1} value={conditions.minRating}
              onChange={e => onChange('minRating', Number(e.target.value))}
              className="absolute inset-0 h-1.5 w-full cursor-pointer opacity-0"
            />
            <div className="mt-1 flex justify-between">
              <span className="text-xs text-ink-4">0</span>
              <span className="text-xs text-ink-4">100</span>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            {RATING_MARKS.map(r => (
              <button
                key={r}
                onClick={() => onChange('minRating', r)}
                className={`flex-1 rounded py-1 text-xs font-medium border transition-colors ${
                  conditions.minRating === r
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-ink-3 border-line hover:border-slate-300'
                }`}
              >
                {r}+
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-bold text-ink">群組年資</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: '不限',         value: 'any' },
              { label: '三個月內',     value: 'new' },
              { label: '三個月至一年', value: 'established' },
              { label: '一年以上',     value: 'veteran' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => onChange('groupAge', opt.value)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  conditions.groupAge === opt.value
                    ? 'border-brand bg-brand-subtle text-brand'
                    : 'border-line bg-surface text-ink-2 hover:border-brand/40 hover:text-ink'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Step4({ results, conditions, onClose }) {
  const navigate = useNavigate()

  function handleExplore() {
    onClose()
    navigate('/explore')
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-3 py-14 text-center lg:px-6">
        <Zap size={40} className="mb-4 text-ink-4" />
        <p className="mb-1 text-base font-extrabold text-ink">沒有符合條件的群組</p>
        <p className="max-w-xs text-sm text-ink-3">
          試著調整預算上限、放寬評分要求，或選擇更多服務類型
        </p>
        <button
          onClick={handleExplore}
          className="mt-6 flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-bold text-ink-2 transition-colors hover:border-brand/40 hover:text-brand"
        >
          <Compass size={14} />
          探索所有群組
        </button>
      </div>
    )
  }

  return (
    <div className="px-3 pt-2 pb-3 lg:px-6 lg:pt-3 lg:pb-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success shadow-[0_8px_20px_-8px_rgb(16_178_108_/_0.6)]">
          <CheckCircle2 size={18} className="text-white" />
        </div>
        <div>
          <p className="font-extrabold text-ink">找到 {results.length} 個符合條件的群組</p>
          <p className="text-xs text-ink-3">依照推薦分數排列，前三名標有排名徽章</p>
        </div>
      </div>
      <MatchConditionBar conditions={conditions} showEdit={false} />
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((group, i) => (
          <div key={group.id} className="relative">
            {i < 3 && (
              <span className={`absolute left-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold shadow-sm ${
                i === 0 ? 'bg-amber-400 text-white' :
                i === 1 ? 'bg-slate-300 text-slate-700' :
                          'bg-orange-300 text-white'
              }`}>
                {i + 1}
              </span>
            )}
            <ExploreGroupCard group={group} onBeforeNavigate={onClose} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function QuickMatchModal() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [conditions, setConditions] = useState(DEFAULT_CONDITIONS)
  const [results, setResults] = useState([])

  useEffect(() => {
    function handler() {
      if (!isAuthenticated()) {
        navigate('/login?redirectTo=/quick-match')
        return
      }
      setIsOpen(true)
      setStep(1)
      setConditions(DEFAULT_CONDITIONS)
      setResults([])
    }
    window.addEventListener('pm:open-match', handler)
    return () => window.removeEventListener('pm:open-match', handler)
  }, [navigate])

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
    else setIsOpen(false)
  }

  function handleNext() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
  }

  function handleStartMatch() {
    const matched = matchGroups(getGroups(), conditions)
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

  if (!isOpen) return null

  const footer = isResultStep ? (
    <>
      <Button variant="secondary" size="md" className="flex-1" onClick={handleReset}>
        <RotateCcw size={15} />
        重新配對
      </Button>
      <Button variant="secondary" size="md" className="flex-1" onClick={handleBack}>
        <ChevronLeft size={15} />
        調整條件
      </Button>
    </>
  ) : (
    <>
      <Button variant="secondary" size="md" className="flex-1" onClick={handleBack}>
        <ChevronLeft size={15} />
        {step === 1 ? '取消' : '上一步'}
      </Button>
      {step < STEPS.length - 1 ? (
        <Button variant="primary" size="md" className="flex-1" disabled={!canNext} onClick={handleNext}>
          下一步
          <ChevronRight size={15} />
        </Button>
      ) : (
        <Button variant="success" size="md" className="flex-1" onClick={handleStartMatch}>
          <Zap size={15} />
          開始配對
        </Button>
      )}
    </>
  )

  return (
    <ModalShell
      onClose={() => setIsOpen(false)}
      icon={<Zap size={20} className="fill-success text-success" />}
      title="快速配對"
      footer={footer}
    >
      <div className="shrink-0 px-6 lg:px-12 pt-5">
        <CreateGroupStepper steps={STEPS} current={step} />
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-2 lg:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {!isResultStep ? (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:mr-6">
            <div className="min-w-0 flex-1 flex flex-col">
              <div className="flex-1 px-3 pt-2 pb-3 lg:px-6 lg:pt-3 lg:pb-6">
                {step === 1 && <Step1 conditions={conditions} onToggle={toggleService} />}
                {step === 2 && <Step2 conditions={conditions} onChangePlan={handleChangePlan} />}
                {step === 3 && <Step3 conditions={conditions} onChange={handleChange} />}
              </div>
            </div>
            <div className="hidden shrink-0 lg:flex lg:flex-col lg:w-64 lg:pt-3 lg:pb-2">
              <MatchSummaryPanel conditions={conditions} />
            </div>
          </div>
        ) : (
          <Step4
            results={results}
            conditions={conditions}
            onClose={() => setIsOpen(false)}
          />
        )}
      </div>
    </ModalShell>
  )
}
