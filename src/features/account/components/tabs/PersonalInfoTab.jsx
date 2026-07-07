import { useState } from 'react'
import { Pencil, Check, X } from 'lucide-react'

function EditableField({ label, value, onSave, type = 'text', placeholder }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function save() { onSave(draft); setEditing(false) }
  function cancel() { setDraft(value); setEditing(false) }

  return (
    <div className="flex items-start gap-3 py-3 border-b border-line-subtle last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-ink-3 mb-1">{label}</p>
        {editing ? (
          <input
            type={type}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={placeholder}
            autoFocus
            className="field py-1.5 px-3"
          />
        ) : (
          <p className="text-sm text-ink-2">{value || <span className="text-ink-4 italic">未填寫</span>}</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0 pt-5">
        {editing ? (
          <>
            <button onClick={save} aria-label="儲存" className="w-7 h-7 rounded-[var(--radius-inner)] bg-brand hover:bg-brand-hover flex items-center justify-center text-white transition-colors"><Check size={13} strokeWidth={3} /></button>
            <button onClick={cancel} aria-label="取消編輯" className="w-7 h-7 rounded-[var(--radius-inner)] border border-line hover:bg-raised flex items-center justify-center text-ink-3 transition-colors"><X size={13} /></button>
          </>
        ) : (
          <button onClick={() => setEditing(true)} aria-label={`編輯${label}`} className="w-7 h-7 rounded-[var(--radius-inner)] border border-line hover:bg-raised flex items-center justify-center text-ink-3 transition-colors">
            <Pencil size={12} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function PersonalInfoTab({ user, onChange }) {
  return (
    <div>
      <EditableField label="顯示名稱" value={user.displayName}  onSave={v => onChange('displayName', v)} />
      <EditableField label="電子信箱" value={user.email}        onSave={v => onChange('email', v)} type="email" />
      <EditableField label="手機號碼" value={user.phone ?? ''}  onSave={v => onChange('phone', v)} type="tel" placeholder="+886-912-345-678" />
      <EditableField label="個人簡介" value={user.bio ?? ''}    onSave={v => onChange('bio', v)}   placeholder="介紹一下自己…" />
      <EditableField label="LINE ID"  value={user.lineId ?? ''} onSave={v => onChange('lineId', v)} placeholder="@yourlineid" />
    </div>
  )
}
