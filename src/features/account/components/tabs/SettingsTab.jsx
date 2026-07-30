import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe, LogOut, Shield, Trash2 } from 'lucide-react'
import { readStorage, writeStorage } from '../../../../shared/utils/storage'
import { useAuthStore } from '../../../../shared/stores/useAuthStore'
import { toast } from '../../../../shared/utils/toast'
import { Switch } from '../../../../components/ui/switch'
import { Button } from '../../../../components/ui/button'

const PREFS_KEY = 'pm_app_prefs'
const DEFAULT_PREFS = {
  darkMode:       false,
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

export default function SettingsTab() {
  const navigate = useNavigate()
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

  async function handleConfirmDelete() {
    if (!password.trim() || deleting) return
    setDeleting(true)
    setDeleteError('')
    const result = await useAuthStore.getState().deactivateAccount(password)
    setDeleting(false)
    if (!result.ok) {
      setDeleteError(result.error ?? '停用失敗，請稍後再試')
      return
    }
    toast('帳號已停用，如需恢復請聯絡客服')
    navigate('/', { replace: true })
  }

  return (
    <div className="space-y-6">
      <SectionGroup title="一般偏好" icon={Globe}>
        <SettingRow
          label="深色模式"
          desc="（開發中）切換深色介面"
          checked={prefs.darkMode}
          onChange={() => toggle('darkMode')}
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

      <SectionGroup title="帳號操作" icon={LogOut}>
        <div className="py-3 border-b border-line-subtle last:border-0">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex w-full items-center gap-3 py-1 text-sm font-semibold text-danger transition-all hover:-translate-y-0.5 hover:text-danger/80"
            >
              <Trash2 size={16} className="shrink-0" />
              刪除帳號
            </button>
          ) : (
            <div className="rounded-xl border border-danger/30 bg-danger-subtle p-4">
              <p className="mb-1 text-sm font-bold text-danger">確定要刪除帳號？</p>
              <p className="mb-4 text-xs text-ink-3">帳號將被停用，無法再登入；資料會保留，如需恢復請聯絡客服。請輸入密碼確認。</p>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="請輸入密碼"
                value={password}
                onChange={e => { setPassword(e.target.value); setDeleteError('') }}
                className="field mb-2 w-full text-sm"
              />
              {deleteError && <p className="mb-2 text-xs font-semibold text-danger">{deleteError}</p>}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={resetDeleteFlow}
                  disabled={deleting}
                  className="h-auto flex-1 rounded-lg border border-line py-2 text-xs"
                >
                  取消
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  disabled={!password.trim() || deleting}
                  className="h-auto flex-1 rounded-lg py-2 text-xs"
                >
                  {deleting ? '處理中…' : '確認刪除'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SectionGroup>
    </div>
  )
}
