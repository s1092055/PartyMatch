import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useAuthStore } from '../../../common/stores/useAuthStore'
import { HOME_BENEFITS } from '../data/homeContent'

// 「從找人到成團，一切變得更簡單」區塊
export default function BenefitsList() {
  const navigate = useNavigate()
  const loggedIn = useAuthStore(s => s.loggedIn)

  return (
    <section id="benefits" className="scroll-mt-24 flex flex-col items-center text-center">
      <h2 className="text-3xl font-extrabold text-ink">
        從找人到成團，一切變得更簡單
      </h2>

      <ul className="mt-8 grid w-full grid-cols-1 gap-6 sm:grid-cols-3">
        {HOME_BENEFITS.map(({ icon: Icon, title, desc }) => (
          <li key={title} className="flex flex-col items-center gap-2">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-subtle text-brand">
              <Icon size={20} strokeWidth={1.5} />
            </div>
            <p className="font-extrabold text-ink">{title}</p>
            <p className="text-sm text-ink-3">{desc}</p>
          </li>
        ))}
      </ul>

      {!loggedIn && (
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="mt-8 flex w-fit items-center gap-1 text-sm font-bold text-brand transition-colors hover:text-brand-hover"
        >
          登入會員了解更多
          <ChevronRight size={14} strokeWidth={1.5} />
        </button>
      )}
    </section>
  )
}
