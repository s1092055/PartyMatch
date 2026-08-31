import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Globe, LogIn, LogOut, Shield, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogCloseButton } from './dialog'
import { Button } from './button'
import { useTheme } from '../theme-provider'
import { loadPrefs, savePrefs } from '../../common/utils/appPrefs'
import { useAuthStore } from '../../common/stores/useAuthStore'
import { toast } from '../../common/utils/toast'
import { Switch } from './switch'
import { Input } from './input'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from './alert-dialog'

const NOTIFICATION_CATEGORIES = [
  { key: 'application', label: '申請審核', desc: '送出申請、審核結果通知' },
  { key: 'group',       label: '群組動態', desc: '群組成立、成員異動、續訂等通知' },
  { key: 'billing',     label: '帳單與服務資訊', desc: '填寫服務資訊、扣款提醒、撥款通知' },
]

const EMPTY_MUTED_CATEGORIES = []

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
        <Icon size={13} strokeWidth={1.5} className="text-ink-3" />
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">{title}</p>
      </div>
      {children}
    </div>
  )
}

export function SettingsModalBody({ onClose }) {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const loggedIn = useAuthStore(s => s.loggedIn)
  const [prefs, setPrefs] = useState(loadPrefs)
  const showAvatar = useAuthStore(s => s.user?.showAvatar ?? true)
  const [savingAvatarVisibility, setSavingAvatarVisibility] = useState(false)
  const mutedCategories = useAuthStore(s => s.user?.mutedNotificationCategories ?? EMPTY_MUTED_CATEGORIES)
  const [savingCategory, setSavingCategory] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [password, setPassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  function toggle(key) {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    savePrefs(next)
  }

  async function toggleAvatarVisibility() {
    setSavingAvatarVisibility(true)
    const result = await useAuthStore.getState().updateProfile({ showAvatar: !showAvatar })
    setSavingAvatarVisibility(false)
    if (!result.ok) toast(result.error ?? '儲存失敗，請稍後再試', 'error')
  }

  async function toggleNotificationCategory(category) {
    setSavingCategory(category)
    const next = mutedCategories.includes(category)
      ? mutedCategories.filter(c => c !== category)
      : [...mutedCategories, category]
    const result = await useAuthStore.getState().updateProfile({ mutedNotificationCategories: next })
    setSavingCategory(null)
    if (!result.ok) toast(result.error ?? '儲存失敗，請稍後再試', 'error')
  }

  function resetDeleteFlow() {
    setShowDeleteConfirm(false)
    setPassword('')
    setDeleteError('')
  }

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
    onClose()
    toast(`帳號已停用，${result.recoveryWindowDays ?? 30} 天內可用原帳號密碼重新登入即可恢復，逾期請聯絡客服`)
    navigate('/', { replace: true })
  }

  return (
    <>
      <SectionGroup title="一般偏好" icon={Globe}>
        <SettingRow
          label="深色模式"
          desc="切換深色介面"
          checked={theme === 'dark'}
          onChange={toggleTheme}
        />
        <SettingRow
          label="自動開啟快速搜尋"
          desc="每次造訪時自動彈出快速搜尋"
          checked={prefs.autoOpenSearch}
          onChange={() => toggle('autoOpenSearch')}
        />
        <SettingRow
          label="分享使用資料"
          desc="協助改善平台體驗（匿名）"
          checked={prefs.shareActivity}
          onChange={() => toggle('shareActivity')}
        />
      </SectionGroup>

      {loggedIn ? (
        <>
          <SectionGroup title="隱私設定" icon={Shield}>
            <SettingRow
              label="顯示自己的大頭照"
              desc="關閉後其他人會看到預設圖示"
              checked={showAvatar}
              onChange={savingAvatarVisibility ? undefined : toggleAvatarVisibility}
            />
            <SettingRow
              label="接收行銷郵件"
              desc="優惠活動與新功能消息"
              checked={prefs.marketingEmail}
              onChange={() => toggle('marketingEmail')}
            />
          </SectionGroup>

          <SectionGroup title="通知偏好" icon={Bell}>
            {NOTIFICATION_CATEGORIES.map(cat => (
              <SettingRow
                key={cat.key}
                label={cat.label}
                desc={cat.desc}
                checked={!mutedCategories.includes(cat.key)}
                onChange={savingCategory ? undefined : () => toggleNotificationCategory(cat.key)}
              />
            ))}
            <p className="pt-2 text-xs text-ink-4">爭議處理與系統安全通知一律會發送，不受此設定影響</p>
          </SectionGroup>

          <SectionGroup title="帳號操作" icon={LogOut}>
            <div className="py-3 border-b border-line-subtle last:border-0">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex w-full items-center gap-3 py-1 text-sm font-semibold text-danger transition-all hover:-translate-y-0.5 hover:text-danger/80"
              >
                <Trash2 strokeWidth={1.5} size={16} className="shrink-0" />
                刪除帳號
              </button>
            </div>
          </SectionGroup>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line py-8 text-center">
          <p className="text-sm font-medium text-ink-3">登入後可管理更多帳號設定</p>
          <Button onClick={() => { onClose(); navigate('/login') }} className="rounded-2xl">
            <LogIn strokeWidth={1.5} size={16} />
            前往登入
          </Button>
        </div>
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
    </>
  )
}

export default function SettingsModal({ isOpen, onClose }) {
  const loggedIn = useAuthStore(s => s.loggedIn)
  return (
    <Dialog open={isOpen} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent maxWidth="max-w-md" height={loggedIn ? 'min(80dvh, 640px)' : 'min(50dvh, 360px)'}>
        <DialogHeader>
          <DialogTitle>偏好設定</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>
        <DialogDescription>偏好設定</DialogDescription>
        <DialogBody className="space-y-6 px-6 py-5">
          {isOpen && <SettingsModalBody onClose={onClose} />}
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
