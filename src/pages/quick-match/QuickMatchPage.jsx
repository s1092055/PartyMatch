import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Zap, AlertCircle } from 'lucide-react'
import ServiceSelectionGrid from './components/ServiceSelectionGrid'
import PreferenceForm from './components/PreferenceForm'
import MatchSummaryPanel from './components/MatchSummaryPanel'
import Button from '../../shared/components/ui/Button'

const DEFAULT_CONDITIONS = {
  services:      ['spotify', 'youtube', 'disney'],
  maxPrice:      100,
  joinMode:      'any',
  minRating:     4.5,
  billingPeriod: 'any',
  groupAge:      'any',
}

function StepHeader({ number, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-brand text-white text-sm font-extrabold flex items-center justify-center shrink-0 mt-0.5 shadow-button">
        {number}
      </div>
      <div>
        <p className="font-extrabold text-ink text-base">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

export default function QuickMatchPage() {
  const navigate = useNavigate()
  const [conditions, setConditions] = useState(DEFAULT_CONDITIONS)

  function toggleService(id) {
    setConditions(prev => ({
      ...prev,
      services: prev.services.includes(id)
        ? prev.services.filter(s => s !== id)
        : [...prev.services, id],
    }))
  }

  function handleFormChange(key, value) {
    setConditions(prev => ({ ...prev, [key]: value }))
  }

  function handleClear() {
    setConditions(DEFAULT_CONDITIONS)
  }

  function handleStartMatch() {
    sessionStorage.setItem('quickmatch_conditions', JSON.stringify(conditions))
    navigate('/quick-match/results')
  }

  const canMatch = conditions.services.length > 0

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center gap-2 mb-1">
        <Zap size={26} className="text-success fill-success" />
        <h1 className="page-title">快速配對</h1>
      </div>
      <p className="page-subtitle mb-6 ml-8">選好條件，讓系統幫你找到最適合的共享群組</p>

      <div className="flex flex-col lg:flex-row gap-7 lg:items-start">
        {/* Left — steps */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Step 1 */}
          <div className="card p-6">
            <StepHeader
              number="1"
              title="選擇你想搜尋的服務"
              subtitle="可複選，至少選一個"
            />
            <ServiceSelectionGrid
              selected={conditions.services}
              onToggle={toggleService}
            />
            {conditions.services.length === 0 && (
              <div className="flex items-center gap-2 mt-3 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                <AlertCircle size={13} />
                請至少選擇一個服務才能開始配對
              </div>
            )}
          </div>

          {/* Step 2 */}
          <div className="card p-6">
            <StepHeader
              number="2"
              title="設定篩選條件"
              subtitle="依照你的需求調整"
            />
            <PreferenceForm conditions={conditions} onChange={handleFormChange} />
          </div>

          {/* Step 3 (optional) */}
          <div className="card p-6">
            <StepHeader
              number="3"
              title="搜尋偏好（選填）"
              subtitle="不填寫也可以直接開始配對"
            />
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-sm font-bold text-ink">扣款日偏好</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { label: '不限',           value: 'any' },
                    { label: '月初（1–10 日）', value: 'early' },
                    { label: '月中（11–20 日）', value: 'mid' },
                    { label: '月底（21–31 日）', value: 'late' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleFormChange('billingPeriod', opt.value)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        conditions.billingPeriod === opt.value
                          ? 'border-brand bg-brand-subtle text-brand'
                          : 'border-line bg-surface text-ink-2 hover:border-brand/40 hover:text-ink'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-bold text-ink">群組年資</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { label: '不限',       value: 'any' },
                    { label: '三個月內',   value: 'new' },
                    { label: '三個月至一年', value: 'established' },
                    { label: '一年以上',   value: 'veteran' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleFormChange('groupAge', opt.value)}
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

          {/* Action bar */}
          <div className="flex gap-3 pb-6">
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={() => navigate('/explore')}
            >
              <ChevronLeft size={15} />
              返回探索群組
            </Button>
            <Button
              variant="success"
              size="md"
              className="flex-1"
              disabled={!canMatch}
              onClick={handleStartMatch}
            >
              <Zap size={15} />
              開始配對
            </Button>
          </div>
        </div>

        {/* Right — sticky summary (desktop only) */}
        <div className="hidden lg:block w-full lg:w-[19rem] shrink-0">
          <MatchSummaryPanel conditions={conditions} onClear={handleClear} />
        </div>
      </div>
    </div>
  )
}
