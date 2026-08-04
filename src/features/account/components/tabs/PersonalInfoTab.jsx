import { useState } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Input, Textarea } from '../../../../components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../../components/ui/select'
import { COUNTRY_CODES, parsePhone, toE164, formatPhoneDisplay } from '../../../../common/utils/phone'

function EditableField({ label, value, onSave, type = 'text', placeholder, locked, onLockedClick }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function save() { onSave(draft); setEditing(false) }
  function cancel() { setDraft(value); setEditing(false) }
  function startEdit() { locked ? onLockedClick() : setEditing(true) }

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
          <Button onClick={startEdit} variant="ghost" size="icon" aria-label={`編輯${label}`} className="border border-line text-ink-3">
            <Pencil size={12} />
          </Button>
        )}
      </div>
    </div>
  )
}

function PhoneEditableField({ value, onSave, locked, onLockedClick }) {
  const [editing, setEditing] = useState(false)
  const parsed = parsePhone(value)
  const [countryCode, setCountryCode] = useState(parsed.countryCode)
  const [localNumber, setLocalNumber] = useState(parsed.localNumber)

  function save() {
    onSave(toE164(countryCode, localNumber))
    setEditing(false)
  }
  function cancel() {
    setCountryCode(parsed.countryCode)
    setLocalNumber(parsed.localNumber)
    setEditing(false)
  }
  function startEdit() { locked ? onLockedClick() : setEditing(true) }

  return (
    <div className="flex items-start gap-3 py-3 border-b border-line-subtle last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-ink-3 mb-1">手機號碼</p>
        {editing ? (
          <div className="flex items-center gap-2">
            <Select value={countryCode} onValueChange={setCountryCode}>
              <SelectTrigger aria-label="國碼" className="h-9 w-auto shrink-0 gap-1 text-sm font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_CODES.map(c => (
                  <SelectItem key={c.code} value={c.code}>{c.code} {c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="tel"
              inputMode="numeric"
              value={localNumber}
              onChange={e => setLocalNumber(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="912345678"
              autoFocus
              className="py-1.5 px-3"
            />
          </div>
        ) : (
          <p className="text-sm text-ink-2">{value ? formatPhoneDisplay(value) : <span className="text-ink-4">未填寫</span>}</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0 pt-5">
        {editing ? (
          <>
            <Button onClick={save} size="icon" aria-label="儲存"><Check size={13} strokeWidth={3} /></Button>
            <Button onClick={cancel} variant="ghost" size="icon" aria-label="取消編輯" className="border border-line text-ink-3"><X size={13} /></Button>
          </>
        ) : (
          <Button onClick={startEdit} variant="ghost" size="icon" aria-label="編輯手機號碼" className="border border-line text-ink-3">
            <Pencil size={12} />
          </Button>
        )}
      </div>
    </div>
  )
}

function BioEditableField({ value, onSave, locked, onLockedClick }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function save() { onSave(draft.trim()); setEditing(false) }
  function cancel() { setDraft(value); setEditing(false) }
  function startEdit() { locked ? onLockedClick() : setEditing(true) }

  return (
    <div className="flex items-start gap-3 py-3 border-b border-line-subtle last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-ink-3 mb-1">個人簡介</p>
        {editing ? (
          <>
            <Textarea
              value={draft}
              onChange={e => setDraft(e.target.value.slice(0, 500))}
              placeholder="簡單介紹一下自己，讓其他成員在群組裡認識你"
              autoFocus
              rows={3}
              className="py-1.5 px-3"
            />
            <p className="mt-1 text-right text-xs text-ink-4">{draft.length}/500</p>
          </>
        ) : (
          <p className="whitespace-pre-wrap text-sm text-ink-2">{value || <span className="text-ink-4">尚未填寫，群組成員彼此都看得到</span>}</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0 pt-5">
        {editing ? (
          <>
            <Button onClick={save} size="icon" aria-label="儲存"><Check size={13} strokeWidth={3} /></Button>
            <Button onClick={cancel} variant="ghost" size="icon" aria-label="取消編輯" className="border border-line text-ink-3"><X size={13} /></Button>
          </>
        ) : (
          <Button onClick={startEdit} variant="ghost" size="icon" aria-label="編輯個人簡介" className="border border-line text-ink-3">
            <Pencil size={12} />
          </Button>
        )}
      </div>
    </div>
  )
}

export default function PersonalInfoTab({ user, onChange, locked, onLockedClick }) {
  return (
    <div>
      <EditableField label="顯示名稱" value={user.displayName}  onSave={v => onChange('displayName', v)} locked={locked} onLockedClick={onLockedClick} />
      <EditableField label="電子信箱" value={user.email}        onSave={v => onChange('email', v)} type="email" locked={locked} onLockedClick={onLockedClick} />
      <PhoneEditableField value={user.phone ?? ''} onSave={v => onChange('phone', v)} locked={locked} onLockedClick={onLockedClick} />
      <BioEditableField value={user.bio ?? ''} onSave={v => onChange('bio', v)} locked={locked} onLockedClick={onLockedClick} />
    </div>
  )
}
