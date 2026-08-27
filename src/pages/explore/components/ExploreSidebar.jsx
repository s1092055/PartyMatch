import { useNavigate } from 'react-router-dom'
import { Zap } from 'lucide-react'

export default function ExploreSidebar() {
  const navigate = useNavigate()

  return (
    <div className="xl:sticky xl:top-[7rem] xl:pt-12">
      <button
        onClick={() => navigate('/quick-match')}
        className="group w-full overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br from-brand to-brand-hover p-5 text-left shadow-button transition-opacity hover:opacity-90"
      >
        <div className="flex items-center gap-2">
          <Zap size={18} className="fill-white text-white" />
          <span className="text-base font-extrabold text-white">快速配對</span>
        </div>
        <p className="mt-1.5 text-sm font-medium text-white/80">
          設定條件，讓系統幫你找到最適合的群組
        </p>
      </button>
    </div>
  )
}
