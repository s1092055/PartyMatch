import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { useAuthStore } from '../../../common/stores/useAuthStore'

// 「自己開團，輕鬆管理」區塊：說明文字＋「立即建立群組」CTA。團主流程的兩層 Tab
// 已經搬到獨立的 IdentityJourney（「不同身份，各有各的任務」）
export default function BenefitsList() {
  const navigate = useNavigate()
  const loggedIn = useAuthStore(s => s.loggedIn)

  return (
    <section id="benefits" className="scroll-mt-24 flex flex-col items-center text-center">
      <h2 className="text-3xl font-extrabold text-ink">
        自己開團，輕鬆管理
      </h2>
      <p className="mt-3 max-w-sm text-base leading-relaxed text-ink-3">
        從開團、管理到續約，PartyMatch 都替你安排好了。
      </p>

      <Button
        size="lg"
        className="mt-6 rounded-full px-8"
        onClick={() => navigate(loggedIn ? '/create-group' : '/register')}
      >
        立即建立群組
        <ChevronRight size={14} strokeWidth={1.5} />
      </Button>
    </section>
  )
}
