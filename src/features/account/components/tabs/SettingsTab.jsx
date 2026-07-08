import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe, LogOut, Shield, Trash2 } from 'lucide-react'
import { useAuthStore } from '../../../../shared/stores/useAuthStore'
import { readStorage, writeStorage } from '../../../../shared/utils/storage'
import Toggle from '../../../../shared/ui/Toggle'

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
    <div className="flex items-center gap-4 px-5 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink-2">{label}</p>
        {desc && <p className="mt-0.5 text-xs text-ink-3">{desc}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line-subtle bg-raised px-5 py-3">
        <div className="flex items-center gap-2">
          <Icon size={13} className="text-ink-3" />
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">{title}</p>
        </div>
      </div>
      <div className="divide-y divide-line-subtle">{children}</div>
    </div>
  )
}

export default function SettingsTab({ hideLogout = false }) {
  const navigate = useNavigate()
  const [prefs, setPrefs] = useState(loadPrefs)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  function toggle(key) {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    writeStorage(PREFS_KEY, next)
  }

  function handleLogout() {
    useAuthStore.getState().logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="space-y-4">
      <SectionCard title="一般偏好" icon={Globe}>
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
      </SectionCard>

      <SectionCard title="隱私設定" icon={Shield}>
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
      </SectionCard>

      <SectionCard title="帳號操作" icon={LogOut}>
        {!hideLogout && (
          <div className="px-5 py-3.5">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl py-1 text-sm font-semibold text-ink-2 transition-colors hover:text-ink"
            >
              <LogOut size={16} className="shrink-0" />
              登出帳號
            </button>
          </div>
        )}
        <div className="px-5 py-3.5">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex w-full items-center gap-3 rounded-xl py-1 text-sm font-semibold text-danger transition-colors hover:text-danger/80"
            >
              <Trash2 size={16} className="shrink-0" />
              刪除帳號
            </button>
          ) : (
            <div className="rounded-xl border border-danger/30 bg-danger-subtle p-4">
              <p className="mb-1 text-sm font-bold text-danger">確定要刪除帳號？</p>
              <p className="mb-4 text-xs text-ink-3">此操作無法復原，所有資料將永久刪除。</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-lg border border-line py-2 text-xs font-bold text-ink-2 transition-colors hover:bg-raised"
                >
                  取消
                </button>
                <button
                  className="flex-1 rounded-lg bg-danger py-2 text-xs font-bold text-white transition-colors hover:bg-danger/90"
                >
                  確認刪除
                </button>
              </div>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  )
}
