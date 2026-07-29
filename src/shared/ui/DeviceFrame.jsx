// 首頁功能展示區塊用的 MacBook 瀏覽器外框，包住實際部署站台的截圖
// （截圖來源見 docs/history；唯一能穩定控制的視窗尺寸只有桌機寬度）

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
