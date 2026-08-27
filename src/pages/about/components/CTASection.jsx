import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import Button from '../../../shared/components/ui/Button'

export default function CTASection() {
  const navigate = useNavigate()

  return (
    <section className="rounded-[var(--radius-card)] border border-brand/20 bg-brand-subtle p-8 text-center sm:p-10">
      <h2 className="text-xl font-extrabold text-ink sm:text-2xl">
        準備好找到下一個共享訂閱了嗎？
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-relaxed text-ink-2">
        現在就加入 PartyMatch，找到值得信賴的夥伴，一起更划算地享受數位服務。
      </p>
      <div className="mt-6">
        <Button size="md" onClick={() => navigate('/explore')} className="h-12 px-8">
          <Search size={17} />
          開始探索群組
        </Button>
      </div>
    </section>
  )
}
