import { HOME_INTRO_PILLARS } from '../data/homeContent'

// 「PartyMatch 是什麼？」區塊：首頁第一個內容區塊，讓還不認識 PartyMatch 的使用者快速看懂
// 服務內容，走高層次的一句話定位＋三個核心環節，後面「我想成為？」再接細節流程
export default function IntroSection() {
  return (
    <section className="text-center">
      {/* 標題上方的裝飾用問號：低透明度＋左右兩個問號分別往內側微微傾斜，中間維持不轉，
          純裝飾不影響版面高度 */}
      <div aria-hidden="true" className="flex items-center justify-center gap-3 text-4xl font-extrabold text-ink-4/30">
        <span className="-rotate-12">？</span>
        <span>？</span>
        <span className="rotate-12">？</span>
      </div>
      <h2 className="mt-2 text-3xl font-extrabold text-ink">PartyMatch 是什麼？</h2>
      <p className="mx-auto mt-3 max-w-lg text-left text-base leading-relaxed text-ink-3">
        PartyMatch 是訂閱共享媒合平台，協助你找到願意一起分攤 Netflix、Spotify、ChatGPT 等熱門訂閱服務的夥伴。從尋找或建立群組、送出申請，到金流代管與成員溝通，都能在同一個平台完成，讓多人合購訂閱更簡單、也更安心。
      </p>

      {/* 手機/平板維持直向清單（divide-y），電腦版（lg）改成三欄水平排列（divide-y-0
          + grid-cols-3），純粹是「螢幕夠不夠寬」的版面判斷，不涉及 hover 互動，所以
          直接用一般的 lg: 斷點即可，不用疊 can-hover: */}
      <div className="mx-auto mt-10 max-w-lg divide-y divide-line text-left lg:max-w-4xl lg:grid lg:grid-cols-3 lg:gap-x-8 lg:divide-y-0">
        {HOME_INTRO_PILLARS.map(({ title, desc }, i) => (
          <div key={title} className="flex flex-col gap-1 py-5 first:pt-0 last:pb-0 lg:py-0">
            <span className="text-2xl font-extrabold text-brand-subtle">
              {String(i + 1).padStart(2, '0')}
            </span>
            <p className="font-extrabold text-ink">{title}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-3">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
