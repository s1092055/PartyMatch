// 首頁功能展示區塊用的裝置外框——包住同一張桌機截圖，用不同裝置比例裁切，
// 讓訪客一眼看出「這是網頁 app，桌機/平板/手機都能用」，不是真的分別截了三種畫面
// （截圖來源是實際部署站台，唯一能穩定控制的視窗尺寸只有桌機寬度，見 docs/history）

export function MacFrame({ src, alt, className = '' }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-line bg-white shadow-lg ${className}`}>
      <div className="flex items-center gap-1.5 border-b border-line bg-raised px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
      </div>
      <div className="aspect-[16/10] w-full overflow-hidden bg-raised">
        <img src={src} alt={alt} className="h-full w-full object-cover object-top" loading="lazy" />
      </div>
    </div>
  )
}

export function IPadFrame({ src, alt, className = '' }) {
  return (
    <div className={`rounded-[1.75rem] border-[6px] border-ink bg-ink p-0.5 shadow-lg ${className}`}>
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[1.4rem] bg-raised">
        <span className="absolute left-1/2 top-1.5 z-10 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-ink-3/60" />
        <img src={src} alt={alt} className="h-full w-full object-cover object-left-top" loading="lazy" />
      </div>
    </div>
  )
}

export function IPhoneFrame({ src, alt, className = '' }) {
  return (
    <div className={`rounded-[1.6rem] border-[5px] border-ink bg-ink p-0.5 shadow-lg ${className}`}>
      <div className="relative aspect-[9/19.5] w-full overflow-hidden rounded-[1.3rem] bg-raised">
        <span className="absolute left-1/2 top-1.5 z-10 h-3 w-12 -translate-x-1/2 rounded-full bg-ink" />
        <img src={src} alt={alt} className="h-full w-full object-cover object-left-top" loading="lazy" />
      </div>
    </div>
  )
}
