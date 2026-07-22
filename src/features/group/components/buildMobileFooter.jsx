import { ChevronRight, CheckCircle2, Heart, LogIn, LogOut, ShieldCheck, Users } from 'lucide-react'
import Button from '../../../shared/ui/primitives/Button'

function renderCTA({
  group, activeUserId, navigate, handleClose,
  isHost, isWaitingMembers, needsFillInfo, hasServiceInfoIssue,
  isMember, isPendingApp, isFull,
  withdrawConfirm, setWithdrawConfirm, withdrawing, handleWithdraw,
}) {
  if (!activeUserId) return (
    <Button variant="primary" size="lg" className="w-full"
      onClick={() => navigate(`/login?redirectTo=/groups/${group.id}`)}>
      <LogIn size={16} />登入以加入群組
    </Button>
  )
  if (isHost) return (
    <div className="flex items-center justify-center gap-2 rounded-xl bg-brand-subtle px-4 py-3 text-sm font-medium text-brand">
      <ShieldCheck size={15} />你是此群組的團主
    </div>
  )
  if (isWaitingMembers) return null
  if (needsFillInfo) return (
    <div className="flex justify-center">
      <button
        onClick={() => {
          handleClose()
          navigate('/my-groups?view=member', { state: { openGroupId: group.id } })
        }}
        className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-colors ${
          hasServiceInfoIssue ? 'bg-danger hover:opacity-90' : 'bg-brand hover:bg-brand-hover'
        }`}
      >
        {hasServiceInfoIssue ? '修正服務帳號' : '填寫服務帳號'}
      </button>
    </div>
  )
  if (isMember) return (
    <div className="flex items-center justify-center gap-2 rounded-xl bg-success-subtle px-4 py-3 text-sm font-medium text-success-text">
      <CheckCircle2 size={15} />已加入此群組
    </div>
  )
  if (isPendingApp) return (
    withdrawConfirm ? (
      <div className="flex gap-2">
        <Button variant="ghost" size="lg" className="flex-1 border border-line" onClick={() => setWithdrawConfirm(false)}>返回</Button>
        <Button variant="danger" size="lg" className="flex-1" disabled={withdrawing} onClick={handleWithdraw}>
          {withdrawing ? '處理中…' : '確認取消'}
        </Button>
      </div>
    ) : (
      <Button variant="ghost" size="lg" className="w-full border border-line text-ink-3 hover:border-danger hover:text-danger"
        onClick={() => setWithdrawConfirm(true)}>
        取消申請
      </Button>
    )
  )
  if (isFull) return (
    <Button variant="ghost" size="lg" className="w-full border border-line" disabled>已額滿</Button>
  )
  return null
}

export function buildMobileFooter({
  group, activeUserId, navigate, handleClose,
  isHost, isWaitingMembers, needsFillInfo, hasServiceInfoIssue,
  isMember, isPendingApp, isFull, canApply, isFav,
  withdrawConfirm, setWithdrawConfirm, withdrawing, handleWithdraw,
  setShowMembers, setLeaveConfirm, setShowApply, toggleFav,
}) {
  return (
    <div className="px-6 py-3">
      {isWaitingMembers ? (
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => setShowMembers(true)}
            className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-ink-2 transition-colors hover:bg-raised"
          >
            <Users size={17} /> 成員名單
          </button>
          <button
            onClick={() => setLeaveConfirm(true)}
            className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-danger transition-colors hover:bg-danger-subtle"
          >
            <LogOut size={17} /> 退出群組
          </button>
        </div>
      ) : isPendingApp ? (
        withdrawConfirm ? (
          <div className="flex gap-2">
            <Button variant="ghost" size="lg" className="flex-1 border border-line" onClick={() => setWithdrawConfirm(false)}>返回</Button>
            <Button variant="danger" size="lg" className="flex-1" disabled={withdrawing} onClick={handleWithdraw}>
              {withdrawing ? '處理中…' : '確認取消'}
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="lg" className="w-full border border-line text-ink-3 hover:border-danger hover:text-danger"
            onClick={() => setWithdrawConfirm(true)}>
            取消申請
          </Button>
        )
      ) : canApply ? (
        <>
          <div className="flex items-center gap-2">
            <Button
              variant="ink"
              size="lg"
              className="flex-1"
              onClick={() => setShowApply(true)}
            >
              申請加入 <ChevronRight size={16} strokeWidth={1.5} />
            </Button>
            <button
              onClick={toggleFav}
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border transition-colors ${
                isFav ? 'border-red-100 bg-red-50 text-red-500' : 'border-line text-ink-2 hover:border-red-200 hover:text-red-400'
              }`}
              aria-label={isFav ? '取消收藏' : '加入收藏'}
            >
              <Heart size={18} className={isFav ? 'fill-red-500' : ''} />
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-ink-4">申請後需經團主審核，通過後即可加入群組</p>
        </>
      ) : (
        renderCTA({
          group, activeUserId, navigate, handleClose,
          isHost, isWaitingMembers, needsFillInfo, hasServiceInfoIssue,
          isMember, isPendingApp, isFull,
          withdrawConfirm, setWithdrawConfirm, withdrawing, handleWithdraw,
        })
      )}
    </div>
  )
}
