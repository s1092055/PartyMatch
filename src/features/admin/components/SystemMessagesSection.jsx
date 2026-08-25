import { useState } from 'react'
import { Megaphone, Send, CheckCircle2 } from 'lucide-react'
import { toast } from '../../../common/utils/toast'
import { Card } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input, Textarea } from '../../../components/ui/input'
import ConfirmActionDialog from '../../../components/ui/ConfirmActionDialog'
import { broadcastSystemMessage, sendDirectSystemMessage } from '../../../common/api/systemMessagesApi'
import { findUserByEmail } from '../../../common/api/usersApi'

export default function SystemMessagesSection() {
  const [broadcastContent, setBroadcastContent] = useState('')
  const [broadcasting, setBroadcasting]         = useState(false)
  const [confirmBroadcast, setConfirmBroadcast] = useState(false)

  const [directEmail, setDirectEmail]     = useState('')
  const [directContent, setDirectContent] = useState('')
  const [directTarget, setDirectTarget]   = useState(null);
  const [directLookupError, setDirectLookupError] = useState('')
  const [lookingUp, setLookingUp]         = useState(false)
  const [sendingDirect, setSendingDirect] = useState(false)

  async function handleBroadcast() {
    setConfirmBroadcast(false)
    setBroadcasting(true)
    try {
      const { sent } = await broadcastSystemMessage(broadcastContent.trim())
      toast(`公告已發送給 ${sent} 位使用者`, 'success')
      setBroadcastContent('')
    } catch (err) {
      toast(err?.message ?? '公告發送失敗', 'error')
    } finally {
      setBroadcasting(false)
    }
  }

  async function handleLookupUser(e) {
    e.preventDefault()
    if (!directEmail.trim()) return
    setLookingUp(true)
    setDirectLookupError('')
    setDirectTarget(null)
    try {
      const user = await findUserByEmail(directEmail.trim())
      setDirectTarget(user)
    } catch (err) {
      setDirectLookupError(err?.message ?? '查詢失敗')
    } finally {
      setLookingUp(false)
    }
  }

  function resetDirectTarget() {
    setDirectTarget(null)
    setDirectLookupError('')
  }

  async function handleSendDirect(e) {
    e.preventDefault()
    if (!directTarget || !directContent.trim()) return
    setSendingDirect(true)
    try {
      await sendDirectSystemMessage(directTarget.id, directContent.trim())
      toast(`已發送給 ${directTarget.name}`, 'success')
      setDirectContent('')
      setDirectEmail('')
      setDirectTarget(null)
    } catch (err) {
      toast(err?.message ?? '發送失敗', 'error')
    } finally {
      setSendingDirect(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Megaphone strokeWidth={1.5} size={16} className="text-brand" />
          <span className="text-sm font-bold text-ink">發送系統公告</span>
        </div>

        <form
          onSubmit={e => { e.preventDefault(); if (broadcastContent.trim()) setConfirmBroadcast(true) }}
          className="space-y-3"
        >
          <div>
            <label className="text-xs font-semibold text-ink-3 mb-1 block">公告內容</label>
            <Textarea
              value={broadcastContent}
              onChange={e => setBroadcastContent(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="這則訊息會發送到每一位使用者的系統聊天室，請確認內容無誤"
              required
            />
          </div>

          <Button
            type="submit"
            variant="destructive"
            disabled={broadcasting || !broadcastContent.trim()}
            className="rounded-lg"
          >
            {broadcasting ? '發送中...' : '發送給所有使用者'}
          </Button>
        </form>

        {confirmBroadcast && (
          <ConfirmActionDialog
            title="確認發送系統公告？"
            message="這則訊息會發送給平台上「每一位」使用者，發送後無法收回，請再次確認內容。"
            confirmLabel="確認發送"
            danger
            onConfirm={handleBroadcast}
            onCancel={() => setConfirmBroadcast(false)}
          />
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Send strokeWidth={1.5} size={16} className="text-brand" />
          <span className="text-sm font-bold text-ink">單發系統訊息</span>
        </div>

        {!directTarget ? (
          <form onSubmit={handleLookupUser} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-ink-3 mb-1 block">對方 Email</label>
              <Input
                type="email"
                value={directEmail}
                onChange={e => { setDirectEmail(e.target.value); setDirectLookupError('') }}
                placeholder="輸入使用者的 email 查詢"
                required
              />
              {directLookupError && (
                <p className="mt-1 text-xs text-danger">{directLookupError}</p>
              )}
            </div>
            <Button type="submit" disabled={lookingUp || !directEmail.trim()} className="rounded-lg">
              {lookingUp ? '查詢中...' : '查詢使用者'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSendDirect} className="space-y-3">
            <div className="flex items-center justify-between gap-2 rounded-lg bg-brand-subtle px-3 py-2">
              <div className="flex items-center gap-2 text-sm text-ink">
                <CheckCircle2 strokeWidth={1.5} size={14} className="shrink-0 text-brand" />
                <span className="font-semibold">{directTarget.name}</span>
                <span className="text-ink-4">{directTarget.email}</span>
              </div>
              <button
                type="button"
                onClick={resetDirectTarget}
                className="shrink-0 text-xs font-semibold text-ink-3 underline-offset-2 hover:underline"
              >
                換一位
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-3 mb-1 block">訊息內容</label>
              <Textarea
                value={directContent}
                onChange={e => setDirectContent(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder={`這則訊息只會發送給 ${directTarget.name}`}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={sendingDirect || !directContent.trim()}
              className="rounded-lg"
            >
              {sendingDirect ? '發送中...' : '發送'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}
