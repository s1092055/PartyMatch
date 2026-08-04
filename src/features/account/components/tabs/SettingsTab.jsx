import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe, LogOut, Shield, Trash2 } from 'lucide-react'
import { readStorage, writeStorage } from '../../../../common/utils/storage'
import { useAuthStore } from '../../../../common/stores/useAuthStore'
import { toast } from '../../../../common/utils/toast'
import { Switch } from '../../../../components/ui/switch'
import { Input } from '../../../../components/ui/input'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '../../../../components/ui/alert-dialog'
import { useTheme } from '../../../../components/theme-provider'

const PREFS_KEY = 'pm_app_prefs'
const DEFAULT_PREFS = {
  autoOpenSearch: false,
  showAvatars:    true,
  marketingEmail: false,
  shareActivity:  false,
}

function loadPrefs() {
  return { ...DEFAULT_PREFS, ...readStorage(PREFS_KEY, {}) }
}

function SettingRow({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-line-subtle last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink-2">{label}</p>
        {desc && <p className="mt-0.5 text-xs text-ink-3">{desc}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  )
}

function SectionGroup({ title, icon: Icon, children }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <Icon size={13} className="text-ink-3" />
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">{title}</p>
      </div>
      {children}
    </div>
  )
}

export default function SettingsTab({ loggedIn = true }) {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const [prefs, setPrefs] = useState(loadPrefs)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [password, setPassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  function toggle(key) {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    writeStorage(PREFS_KEY, next)
  }

  function resetDeleteFlow() {
    setShowDeleteConfirm(false)
    setPassword('')
    setDeleteError('')
  }

  // AlertDialogAction（Radix）預設點擊後會自動關閉 Dialog，這裡要在密碼錯誤時
  // 讓 Dialog 留在原地顯示錯誤訊息，所以要先 preventDefault 蓋掉這個預設行為，
  // 成功後才手動呼叫 resetDeleteFlow() 關閉
  async function handleConfirmDelete(e) {
    e.preventDefault()
    if (!password.trim() || deleting) return
    setDeleting(true)
    setDeleteError('')
    const result = await useAuthStore.getState().deactivateAccount(password)
    setDeleting(false)
    if (!result.ok) {
      setDeleteError(result.error ?? '停用失敗，請稍後再試')
      return
    }
    resetDeleteFlow()
    toast('帳號已停用，如需恢復請聯絡客服')
    navigate('/', { replace: true })
  }

  return (
    <div className="space-y-6">
      <SectionGroup title="一般偏好" icon={Globe}>
        <SettingRow
          label="深色模式"
          desc="切換深色介面"
          checked={theme === 'dark'}
          onChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        />
        <SettingRow
          label="顯示成員大頭貼"
          desc="在群組列表中顯示成員頭像"
          checked={prefs.showAvatars}
          onChange={() => toggle('showAvatars')}
        />
      </SectionGroup>

      <SectionGroup title="隱私設定" icon={Shield}>
        <SettingRow
          label="接收行銷郵件"
          desc="優惠活動與新功能消息"
          checked={prefs.marketingEmail}
          onChange={() => toggle('marketingEmail')}
        />
        <SettingRow
          label="分享使用資料"
          desc="協助改善平台體驗（匿名）"
          checked={prefs.shareActivity}
          onChange={() => toggle('shareActivity')}
        />
      </SectionGroup>

      {loggedIn && (
        <SectionGroup title="帳號操作" icon={LogOut}>
          <div className="py-3 border-b border-line-subtle last:border-0">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex w-full items-center gap-3 py-1 text-sm font-semibold text-danger transition-all hover:-translate-y-0.5 hover:text-danger/80"
            >
              <Trash2 size={16} className="shrink-0" />
              刪除帳號
            </button>
          </div>
        </SectionGroup>
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={v => { if (!v) resetDeleteFlow() }}>
        <AlertDialogContent>
          <AlertDialogTitle>確定要刪除帳號？</AlertDialogTitle>
          <AlertDialogDescription>帳號將被停用，無法再登入；資料會保留，如需恢復請聯絡客服。請輸入密碼確認。</AlertDialogDescription>
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="請輸入密碼"
            value={password}
            onChange={e => { setPassword(e.target.value); setDeleteError('') }}
            className="mt-4"
          />
          {deleteError && <p className="mt-2 text-xs font-semibold text-danger">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} onClick={resetDeleteFlow}>取消</AlertDialogCancel>
            <AlertDialogAction danger disabled={!password.trim() || deleting} onClick={handleConfirmDelete}>
              {deleting ? '處理中…' : '確認刪除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
