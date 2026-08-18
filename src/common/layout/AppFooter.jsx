import { Link } from 'react-router-dom'
import logoUrl from '../../assets/Logo.svg'

const LEGAL_LINKS = [
  { to: '/terms',      label: '服務條款' },
  { to: '/privacy',    label: '隱私政策' },
  { to: '/disclaimer', label: '免責聲明' },
]

export default function AppFooter() {
  return (
    // 分隔線的左右邊界要跟探索群組／收藏／我的訂閱／群組管理這幾個頁面的群組卡片列表切齊。
    // border 是畫在元素自己的外緣，padding 不會把 border 往內推——所以不能用 padding 去湊寬度，
    // 要直接複製出跟頁面內容一樣的巢狀 wrapper（AppLayout 那層 + 頁面自己那層，兩層都只用
    // padding 讓子層的起始位置跟著內縮），border-t 畫在最內層、自己不再帶任何水平 padding，
    // 這樣它的邊緣位置才會跟被兩層 padding 往內推過的群組卡片列表完全一樣
    // pb-24 避開 DesktopSidebar 的浮動訊息按鈕（fixed bottom-right，不分寬度一律顯示，
    // 只有真的有 hover 能力的桌機才會換成貼齊收合側邊欄的 pb-10），用 can-hover:lg: 而不是
    // md: 判斷要不要收回來——手機／iPad 都沒有 hover 能力，都要留這圈較大的底部留白
    <footer className="bg-canvas pb-24 pt-10 can-hover:lg:pb-10">
      <div className="mx-auto w-full max-w-7xl px-4 lg:max-w-[clamp(80rem,100vw,90rem)] lg:px-2">
        <div className="px-2 md:px-4">
          <div className="border-t border-line pt-10">
            <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 md:flex-row md:justify-center md:gap-10">

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
          </div>
        </div>
      </div>
    </footer>
  )
}
