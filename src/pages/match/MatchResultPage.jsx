import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Zap, RotateCcw, Compass } from 'lucide-react'
import { getGroups } from '../../shared/stores/groupStore'
import { matchGroups } from '../../shared/utils/matchGroups'
import MatchConditionBar from './components/MatchConditionBar'
import RecommendedGroupCard from './components/RecommendedGroupCard'
import Button from '../../shared/components/ui/Button'

const DEFAULT_CONDITIONS = {
  services: ['spotify', 'youtube', 'disney'], maxPrice: 100, minRating: 70,
}

function loadConditions() {
  try {
    const raw = sessionStorage.getItem('quickmatch_conditions')
    return raw ? JSON.parse(raw) : DEFAULT_CONDITIONS
  } catch {
    return DEFAULT_CONDITIONS
  }
}

export default function MatchResultPage() {
  const navigate = useNavigate()
  const conditions = useMemo(() => loadConditions(), [])
  const results = useMemo(() => matchGroups(getGroups(), conditions), [conditions])

  return (
    <div>
      
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {results.length > 0 ? (
          <div className="flex items-center gap-5 py-6">
            <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center shrink-0 shadow-[0_18px_30px_-20px_rgb(16_178_108_/_0.85)]">
              <CheckCircle2 size={34} className="text-white" />
            </div>
            <div>
              <h1 className="page-title">已為你找到<span className="text-brand">最適合</span>的群組</h1>
              <p className="page-subtitle mt-2">
                根據你的條件，我們為你篩選了{' '}
                <span className="font-bold text-ink">{results.length} 個</span>
                {' '}最適合加入的群組
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Zap size={24} className="text-slate-400" />
            <div>
              <h1 className="text-xl font-bold text-slate-700">找不到符合條件的群組</h1>
              <p className="text-sm text-slate-500 mt-0.5">試著放寬篩選條件，或直接探索所有群組</p>
            </div>
          </div>
        )}
        <div className="panel w-full overflow-hidden lg:w-[23rem]">
          <button
            onClick={() => navigate('/quick-match/results')}
            className="flex w-full items-center justify-between border-b border-line-subtle px-5 py-4 text-left transition-colors hover:bg-raised"
          >
            <span>
              <span className="block text-sm font-extrabold text-ink">重新配對</span>
              <span className="text-xs text-ink-3">使用相同條件重新尋找群組</span>
            </span>
            <RotateCcw size={20} className="text-brand" />
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('pm:open-match'))}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-raised"
          >
            <span>
              <span className="block text-sm font-extrabold text-ink">調整條件</span>
              <span className="text-xs text-ink-3">變更條件以獲得更多結果</span>
            </span>
            <Zap size={20} className="text-brand" />
          </button>
        </div>
      </div>

<MatchConditionBar conditions={conditions} />

{results.length > 0 ? (
        <div className="space-y-4">
          {results.map((group, i) => (
            <RecommendedGroupCard key={group.id} group={group} rank={i + 1} />
          ))}

<div className="text-center py-4 text-sm text-slate-400">
            以上推薦基於你的偏好條件與群組評分綜合排序
          </div>
        </div>
      ) : (
        
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Zap size={36} className="text-slate-200 mx-auto mb-4" />
          <p className="font-semibold text-slate-600 mb-2">沒有符合條件的群組</p>
          <p className="text-sm text-slate-400 mb-6 max-w-xs mx-auto">
            試著調整預算上限、放寬評分要求，或選擇更多服務類型
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="primary" onClick={() => window.dispatchEvent(new CustomEvent('pm:open-match'))}>
              <RotateCcw size={14} />
              重新配對
            </Button>
            <Button variant="secondary" onClick={() => navigate('/explore')}>
              <Compass size={14} />
              探索所有群組
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
