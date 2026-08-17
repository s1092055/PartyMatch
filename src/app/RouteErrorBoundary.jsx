import { useEffect } from 'react'
import { useRouteError } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { Button } from '../components/ui/button'

// 部署新版本後，舊分頁記得的 JS chunk 檔名已從伺服器移除，這時點擊觸發 lazy() 動態
// import() 會抓到 SPA fallback 回傳的 index.html（text/html），瀏覽器嘗試當 JS 執行
// 就會丟出這類錯誤；用 sessionStorage 記一次，避免真的壞掉的頁面陷入無限重整迴圈
const CHUNK_ERROR_PATTERN = /dynamically imported module|is not a valid JavaScript MIME type|Importing a module script failed/i
const RELOAD_FLAG_KEY = 'pm_chunk_reload_attempted'

export default function RouteErrorBoundary() {
  const error = useRouteError()
  const message = error?.message ?? String(error ?? '')
  const isChunkLoadError = CHUNK_ERROR_PATTERN.test(message)

  useEffect(() => {
    if (!isChunkLoadError) return
    if (sessionStorage.getItem(RELOAD_FLAG_KEY)) return
    sessionStorage.setItem(RELOAD_FLAG_KEY, '1')
    window.location.reload()
  }, [isChunkLoadError])

  if (isChunkLoadError) return null

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-5 text-center text-ink">
      <p className="text-lg font-bold">發生未預期的錯誤</p>
      <p className="max-w-sm text-sm text-ink-3">請重新整理頁面；若問題持續發生，請稍後再試一次。</p>
      <Button onClick={() => window.location.reload()}>
        <RefreshCw size={16} strokeWidth={1.5} />
        重新整理
      </Button>
    </div>
  )
}
