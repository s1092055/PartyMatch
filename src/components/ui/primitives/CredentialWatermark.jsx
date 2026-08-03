// 帳密無法在網頁上做到「截圖變黑」（那是 DRM 綁定 <video> 受保護播放管線的能力，
// 一般文字內容拿不到），退而求其次疊一層可辨識查看者身分＋時間的浮水印，
// 外流出去時至少能溯源回是誰截的圖
export default function CredentialWatermark({ viewerName, children }) {
  const stamp = `${viewerName ?? '使用者'} · ${new Date().toLocaleString('zh-TW', { hour12: false })}`

  return (
    <div className="relative overflow-hidden rounded-lg">
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex select-none flex-wrap content-around justify-around gap-x-6 gap-y-4 overflow-hidden opacity-[0.08]"
        style={{ transform: 'rotate(-18deg) scale(1.3)' }}
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className="whitespace-nowrap text-xs font-bold text-ink">{stamp}</span>
        ))}
      </div>
    </div>
  )
}
