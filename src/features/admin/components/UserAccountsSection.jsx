import { useState } from 'react'
import { UserCog, Search, Lock, Unlock } from 'lucide-react'
import { toast } from '../../../common/utils/toast'
import { Card } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import ConfirmActionDialog from '../../../components/ui/ConfirmActionDialog'
import FoundUserCard from './FoundUserCard'
import { useEmailLookup } from '../hooks/useEmailLookup'
import { searchUserByEmail, reactivateUserApi } from '../../../common/api/adminApi'

export default function UserAccountsSection() {
  const {
    email,
    setEmail,
    target,
    setTarget,
    error: lookupError,
    setError: setLookupError,
    loading: lookingUp,
    handleLookup,
    reset: resetTarget,
  } = useEmailLookup(searchUserByEmail)
  const [reactivating, setReactivating] = useState(false)
  const [confirmReactivate, setConfirmReactivate] = useState(false)

  async function handleReactivate() {
    setConfirmReactivate(false)
    setReactivating(true)
    try {
      await reactivateUserApi(target.id)
      toast(`已恢復 ${target.name} 的帳號`, 'success')
      setTarget({ ...target, deactivatedAt: null })
    } catch (err) {
      toast(err?.message ?? '恢復失敗，請稍後再試', 'error')
    } finally {
      setReactivating(false)
    }
  }

  return (
    <Card className="p-5 max-w-xl">
      <div className="flex items-center gap-2 mb-4">
        <UserCog strokeWidth={1.5} size={16} className="text-brand" />
        <span className="text-sm font-bold text-ink">帳號解鎖</span>
      </div>

      {!target ? (
        <form onSubmit={handleLookup} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-ink-3 mb-1 block">使用者 Email</label>
            <Input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setLookupError('') }}
              placeholder="輸入使用者的 email 查詢"
              required
            />
            {lookupError && <p className="mt-1 text-xs text-danger">{lookupError}</p>}
          </div>
          <Button type="submit" disabled={lookingUp || !email.trim()} className="rounded-lg">
            <Search strokeWidth={1.5} size={14} />
            {lookingUp ? '查詢中...' : '查詢使用者'}
          </Button>
        </form>
      ) : (
        <div className="space-y-3">
          <FoundUserCard user={target} onReset={resetTarget} />

          <div className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2.5">
            {target.deactivatedAt ? (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-danger">
                <Lock strokeWidth={1.5} size={14} />
                帳號已停用
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-brand">
                <Unlock strokeWidth={1.5} size={14} />
                帳號啟用中
              </span>
            )}
            {target.deactivatedAt && (
              <Button
                size="sm"
                disabled={reactivating}
                onClick={() => setConfirmReactivate(true)}
                className="rounded-lg"
              >
                {reactivating ? '恢復中...' : '解鎖帳號'}
              </Button>
            )}
          </div>
        </div>
      )}

      {confirmReactivate && (
        <ConfirmActionDialog
          title="解鎖此帳號？"
          message={`確定要恢復 ${target?.name} 的帳號嗎？對方會收到通知，之後即可重新登入。`}
          confirmLabel="確認解鎖"
          onConfirm={handleReactivate}
          onCancel={() => setConfirmReactivate(false)}
        />
      )}
    </Card>
  )
}
