import { useState } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'

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
          <Input
            type={type}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={placeholder}
            autoFocus
            className="py-1.5 px-3"
          />
        ) : (
          <p className="text-sm text-ink-2">{value || <span className="text-ink-4">未填寫</span>}</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0 pt-5">
        {editing ? (
          <>
            <Button onClick={save} size="icon" aria-label="儲存"><Check size={13} strokeWidth={3} /></Button>
            <Button onClick={cancel} variant="ghost" size="icon" aria-label="取消編輯" className="border border-line text-ink-3"><X size={13} /></Button>
          </>
        ) : (
          <Button onClick={() => setEditing(true)} variant="ghost" size="icon" aria-label={`編輯${label}`} className="border border-line text-ink-3">
            <Pencil size={12} />
          </Button>
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
    </div>
  )
}
