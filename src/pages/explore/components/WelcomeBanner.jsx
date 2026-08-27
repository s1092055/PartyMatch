export default function WelcomeBanner({ userName = '' }) {
  return (
    <section className="relative grid min-h-[15rem] overflow-hidden rounded-[var(--radius-card)] pt-8 sm:p-8 lg:pl-0 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center lg:max-w-[54rem] lg:mx-auto w-full">
      <div className="relative z-10 max-w-2xl mx-auto lg:mx-0 text-center lg:text-left">
        <h1 className="text-[2rem] font-extrabold leading-tight tracking-normal text-ink sm:text-[2.4rem]">
          歡迎回來{userName ? `，${userName}` : ''}<br />
          找到適合你的<span className="text-brand">共享訂閱</span>
        </h1>
        <p className="mt-4 max-w-[26rem] text-base font-medium leading-relaxed text-ink-2 mx-auto lg:mx-0">
          與值得信賴的夥伴一起分攤，聰明地享受數位服務。
        </p>
      </div>

      <div className="pointer-events-none relative hidden items-center justify-center lg:flex">
        <div className="relative h-52 w-72">
          <div className="absolute bottom-3 left-6 h-20 w-52 rounded-[50%] bg-blue-100/70 blur-sm" />

          <div className="absolute left-9 top-12 h-28 w-32 rotate-[-9deg] rounded-[1.5rem] bg-blue-600 shadow-[0_30px_60px_-36px_rgb(37_99_235_/_0.95)]">
            <div className="absolute right-[-1.15rem] top-10 h-9 w-9 rounded-full bg-blue-600" />
            <div className="absolute bottom-[-1.05rem] left-12 h-8 w-8 rounded-full bg-white" />
          </div>

          <div className="absolute right-8 top-7 h-32 w-[8.25rem] rotate-[10deg] rounded-[1.5rem] bg-emerald-500 shadow-[0_30px_60px_-36px_rgb(16_185_129_/_0.9)]">
            <div className="absolute left-[-1.05rem] top-11 h-8 w-8 rounded-full bg-emerald-500" />
            <div className="absolute right-9 bottom-[-1rem] h-8 w-8 rounded-full bg-white" />
          </div>

          <div className="absolute bottom-8 left-24 h-[4.75rem] w-[4.75rem] rotate-[-4deg] rounded-[1.25rem] border border-line bg-white shadow-card" />
          <div className="absolute bottom-11 left-[7.9rem] h-8 w-8 rounded-xl bg-blue-100" />
          <div className="absolute right-20 top-[5.4rem] h-10 w-10 rounded-2xl bg-emerald-100" />
          <div className="absolute right-3 top-4 h-3 w-3 rounded-full bg-blue-400" />
          <div className="absolute left-2 top-20 h-3 w-3 rounded-full bg-amber-300" />
          <div className="absolute right-12 bottom-8 h-4 w-4 rounded-full bg-blue-500" />
          <div className="absolute left-40 top-1 h-5 w-5 rounded-full bg-line" />
        </div>
      </div>
    </section>
  )
}
