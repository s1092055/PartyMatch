import { Link } from 'react-router-dom'
import logoUrl from '../../assets/Logo.svg'

const LEGAL_LINKS = [
  { to: '/terms',      label: '服務條款' },
  { to: '/privacy',    label: '隱私政策' },
  { to: '/disclaimer', label: '免責聲明' },
]

export default function AppFooter() {
  return (
    <footer className="border-t border-line bg-canvas px-5 pt-10 pb-20 md:pb-10">
      <div className="mx-auto max-w-5xl flex flex-col items-center gap-5 md:flex-row md:justify-center md:gap-10">

        <div className="flex items-center gap-2.5">
          <img src={logoUrl} alt="PartyMatch" className="h-7 w-7" />
          <span className="font-extrabold">
            <span className="text-brand">Party</span><span className="text-ink">Match</span>
          </span>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {LEGAL_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="text-xs font-medium text-ink-3 transition-colors hover:text-ink"
            >
              {label}
            </Link>
          ))}
        </nav>

        <p className="text-xs text-ink-4">© 2026 PartyMatch</p>
      </div>
    </footer>
  )
}
