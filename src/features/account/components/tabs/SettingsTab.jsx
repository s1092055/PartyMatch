import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe, LogOut, Shield, Trash2 } from 'lucide-react'
import { readStorage, writeStorage } from '../../../../common/utils/storage'
import { useAuthStore } from '../../../../common/stores/useAuthStore'
import { toast } from '../../../../common/utils/toast'
import { Switch } from '../../../../components/ui/switch'
import FilterSelect from '../../../../components/ui/primitives/FilterSelect'
import { useFilterSelectGroup } from '../../../../components/ui/primitives/useFilterSelectGroup'
import { Input } from '../../../../components/ui/input'
import { PRESENCE_LABELS } from '../../../../common/layout/components/navConstants'
import { PresenceDot } from '../../../../common/layout/components/navShared'
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

export default function SettingsTab() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [prefs, setPrefs] = useState(loadPrefs)
  const showAvatar = useAuthStore(s => s.user?.showAvatar ?? true)
  const [savingAvatarVisibility, setSavingAvatarVisibility] = useState(false)
  const presenceStatus = useAuthStore(s => s.user?.presenceStatus ?? 'online')
  const [savingPresence, setSavingPresence] = useState(false)
  const presenceFilterGroup = useFilterSelectGroup()
  const presenceOptions = Object.entries(PRESENCE_LABELS).map(([value, label]) => ({
    value,
    label,
    icon: <PresenceDot status={value} className="h-2.5 w-2.5 shrink-0" />,
  }))
  const presenceGroups = [{ label: null, items: presenceOptions }]
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [password, setPassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  function toggle(key) {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    writeStorage(PREFS_KEY, next)
  }

  // 這是會影響其他使用者看到你的方式的帳號設定（後端遮罩 avatarInitial/avatarColor），
  // 不是本機偏好，要打 API 存到你的帳號，不能跟其他純本機開關一樣寫 localStorage
  async function toggleAvatarVisibility() {
    setSavingAvatarVisibility(true)
    const result = await useAuthStore.getState().updateProfile({ showAvatar: !showAvatar })
    setSavingAvatarVisibility(false)
    if (!result.ok) toast(result.error ?? '儲存失敗，請稍後再試', 'error')
  }

  // 狀態是手動選擇的，不是自動偵測上下線，跟 showAvatar 一樣要打 API 存到帳號，
  // 其他使用者才看得到（群組成員列表、聊天室等）
  async function changePresence(next) {
    if (next === presenceStatus) return
    setSavingPresence(true)
    const result = await useAuthStore.getState().updateProfile({ presenceStatus: next })
    setSavingPresence(false)
    if (!result.ok) toast(result.error ?? '儲存失敗，請稍後再試', 'error')
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
          onChange={toggleTheme}
        />
        <div className="flex items-center gap-4 py-3 border-b border-line-subtle last:border-0">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink-2">目前狀態</p>
            <p className="mt-0.5 text-xs text-ink-3">顯示在你的頭像旁邊</p>
          </div>
          <FilterSelect
            id="presence-status"
            ariaLabel="目前狀態"
            group={presenceFilterGroup}
            value={presenceStatus}
            onChange={savingPresence ? () => {} : changePresence}
            groups={presenceGroups}
            className="h-9 w-[7.5rem] shrink-0 font-bold"
            triggerContent={(
              <span className="flex min-w-0 items-center gap-1.5">
                {presenceOptions.find(o => o.value === presenceStatus)?.icon}
                <span className="truncate">{presenceOptions.find(o => o.value === presenceStatus)?.label}</span>
              </span>
            )}
          />
        </div>
      </SectionGroup>

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
        <SettingRow
          label="分享使用資料"
          desc="協助改善平台體驗（匿名）"
          checked={prefs.shareActivity}
          onChange={() => toggle('shareActivity')}
        />
      </SectionGroup>

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
