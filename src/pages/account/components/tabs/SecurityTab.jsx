import { useState } from 'react'
import { KeyRound, ShieldCheck, Smartphone, Eye, EyeOff, CheckCircle2, Info } from 'lucide-react'

function PasswordField({ label, value, onChange }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  )
}

export default function SecurityTab() {
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [saved, setSaved] = useState(false)
  const [twoFaMsg, setTwoFaMsg] = useState(false)
  const [loggedOutDevice, setLoggedOutDevice] = useState(null)

  function handleSave() {
    if (!pw.current || !pw.next || pw.next !== pw.confirm) return
    setSaved(true)
    setPw({ current: '', next: '', confirm: '' })
    setTimeout(() => setSaved(false), 3000)
  }

  function handleManage2FA() {
    setTwoFaMsg(true)
    setTimeout(() => setTwoFaMsg(false), 3000)
  }

  function handleLogoutDevice(index) {
    setLoggedOutDevice(index)
    setTimeout(() => setLoggedOutDevice(null), 3000)
  }

  return (
    <div className="space-y-4">
      
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
          <KeyRound size={15} className="text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">修改密碼</span>
        </div>
        <div className="p-5 space-y-3">
          <PasswordField label="目前密碼"   value={pw.current}  onChange={v => setPw(p => ({ ...p, current: v }))} />
          <PasswordField label="新密碼"     value={pw.next}     onChange={v => setPw(p => ({ ...p, next: v }))} />
          <PasswordField label="確認新密碼" value={pw.confirm}  onChange={v => setPw(p => ({ ...p, confirm: v }))} />

          {pw.next && pw.confirm && pw.next !== pw.confirm && (
            <p className="text-xs text-red-500">兩次密碼輸入不一致</p>
          )}

          {saved && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
              <CheckCircle2 size={15} /> 密碼已成功更新
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={!pw.current || !pw.next || pw.next !== pw.confirm}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:pointer-events-none text-white text-sm font-semibold py-2 rounded-lg transition-colors"
          >
            更新密碼
          </button>
        </div>
      </div>

<div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
          <ShieldCheck size={15} className="text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">雙重驗證（2FA）</span>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Smartphone size={16} className="text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-700">簡訊驗證碼</p>
                <p className="text-xs text-slate-400">每次登入時發送 OTP 到你的手機</p>
              </div>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">已啟用</span>
          </div>
          {twoFaMsg && (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg mb-2">
              <Info size={15} /> 此功能即將推出，敬請期待
            </div>
          )}
          <button
            onClick={handleManage2FA}
            className="w-full border border-slate-200 text-slate-600 text-sm py-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            管理雙重驗證設定
          </button>
        </div>
      </div>

<div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-700">近期登入紀錄</p>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            { device: 'Chrome · macOS',   ip: '118.168.x.x', time: '2026-05-07 14:23', current: true },
            { device: 'Safari · iPhone',  ip: '118.168.x.x', time: '2026-05-06 09:11', current: false },
            { device: 'Chrome · Windows', ip: '61.220.x.x',  time: '2026-05-04 22:05', current: false },
          ].map((log, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-700">{log.device}</p>
                  {log.current && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">目前</span>}
                  {loggedOutDevice === i && <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-medium">已登出</span>}
                </div>
                <p className="text-xs text-slate-400">{log.ip} · {log.time}</p>
              </div>
              {!log.current && loggedOutDevice !== i && (
                <button
                  onClick={() => handleLogoutDevice(i)}
                  className="text-xs text-red-500 hover:underline"
                >
                  登出此裝置
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
