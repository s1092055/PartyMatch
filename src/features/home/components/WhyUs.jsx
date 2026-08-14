import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { useAuthStore } from '../../../common/stores/useAuthStore'
import { HOME_WHY_US } from '../data/homeContent'

// 「為什麼選擇 PartyMatch？」區塊
export default function WhyUs() {
  const navigate = useNavigate()
  const loggedIn = useAuthStore(s => s.loggedIn)

  return (
    <section className="text-center">
      <h2 className="text-3xl font-extrabold text-ink">為什麼選擇 PartyMatch？</h2>
      <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-ink-3">
        打造安全又完善機制，安心共享每一次的訂閱體驗。
      </p>

      <div className="mt-8 flex w-full min-w-0 snap-x snap-mandatory gap-4 overflow-x-auto px-2 pb-2 [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
        {HOME_WHY_US.map(({ icon: Icon, title, desc }) => (
          <Card
            key={title}
            className="flex w-64 shrink-0 snap-center flex-col items-center gap-3 p-6 text-center sm:w-auto"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-subtle text-brand">
              <Icon size={18} strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-extrabold text-ink">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-3">{desc}</p>
            </div>
          </Card>
        ))}
      </div>

      {!loggedIn && (
        <Button size="lg" className="mt-8 rounded-full px-8" onClick={() => navigate('/login')}>
          登入會員了解更多
          <ChevronRight size={14} strokeWidth={1.5} />
        </Button>
      )}
    </section>
  )
}
