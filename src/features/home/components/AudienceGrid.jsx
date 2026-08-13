import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { HOME_AUDIENCES } from '../data/homeContent'

// 「適合每一種共享生活」區塊；photo 有素材的用 assets 裡的實際照片，沒有的才 fallback
// 用 picsum.photos 依情境 seed 頂替（通用生活情境素材，不是宣稱平台的真實使用者）。
// 卡片用 bento 排版：第一張（學生族群）直向跨兩列，其餘四張兩兩一組排在右側，
// 圖片滿版、文字疊在底部的漸層遮罩上
function AudienceCard({ photo, photoSeed, title, desc, tall }) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl ${tall ? 'row-span-2 min-h-[280px] lg:min-h-0' : 'min-h-[132px]'}`}>
      <img
        src={photo ?? `https://picsum.photos/seed/${photoSeed}/400/500`}
        alt={title}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="font-extrabold text-white">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-white/80">{desc}</p>
      </div>
    </div>
  )
}

export default function AudienceGrid() {
  const navigate = useNavigate()

  return (
    <section className="flex flex-col items-center gap-10">
      <div className="flex flex-col items-center text-center">
        <h2 className="text-3xl font-extrabold text-ink">
          適合每一種共享生活
        </h2>
        <p className="mt-3 max-w-xs text-base leading-relaxed text-ink-3">
          不論是學生、情侶、家庭或工作夥伴，找到最適合的共享方式。
        </p>
        <button
          type="button"
          onClick={() => navigate('/explore')}
          className="mt-5 flex w-fit items-center gap-1 text-sm font-bold text-brand transition-colors hover:text-brand-hover"
        >
          探索所有群組
          <ChevronRight size={14} strokeWidth={1.5} />
        </button>
      </div>

      <div className="grid w-full grid-cols-2 grid-rows-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {HOME_AUDIENCES.map((audience, i) => (
          <AudienceCard key={audience.title} {...audience} tall={i === 0} />
        ))}
      </div>
    </section>
  )
}
