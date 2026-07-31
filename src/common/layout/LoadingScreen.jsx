import logoUrl from '../../assets/Logo.svg'

export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas">
      <img src={logoUrl} alt="" className="h-14 w-14 animate-logo-bounce" />
      <span className="animate-typewriter text-xl font-extrabold">
        <span className="text-brand">Party</span><span className="text-ink">Match</span>
      </span>
    </div>
  )
}
