import { HOME_INTRO_PILLARS } from '../data/homeContent'

// 「PartyMatch 是什麼？」區塊：首頁第一個內容區塊，讓還不認識 PartyMatch 的使用者快速看懂
// 服務內容，走高層次的一句話定位＋三個核心環節，後面「我想成為？」再接細節流程
export default function IntroSection() {
  return (
    <section className="text-center">
      <h2 className="text-3xl font-extrabold text-ink">PartyMatch 是什麼？</h2>
      <p className="mx-auto mt-3 max-w-lg text-left text-base leading-relaxed text-ink-3">
        PartyMatch 是訂閱共享媒合平台，協助你找到願意一起分攤 Netflix、Spotify、ChatGPT 等熱門訂閱服務的夥伴。從尋找或建立群組、送出申請，到金流代管與成員溝通，都能在同一個平台完成，讓多人合購訂閱更簡單、也更安心。
      </p>

      <div className="mx-auto mt-10 max-w-lg divide-y divide-line text-left">
        {HOME_INTRO_PILLARS.map(({ title, desc }, i) => (
          <div key={title} className="flex items-start gap-4 py-5 first:pt-0 last:pb-0">
            <span className="shrink-0 text-2xl font-extrabold text-brand-subtle">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div>
              <p className="font-extrabold text-ink">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-3">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
