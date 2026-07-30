import { ChevronRight, CheckCircle2, LogIn, LogOut, ShieldCheck, Users } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import FavoriteToggleButton from '../../../shared/ui/FavoriteToggleButton'

function renderCTA({
  group, activeUserId, navigate, handleClose,
  isHost, isWaitingMembers, needsFillInfo, hasServiceInfoIssue,
  isMember, isPendingApp, isFull,
  withdrawConfirm, setWithdrawConfirm, withdrawing, handleWithdraw,
}) {
  if (!activeUserId) return (
    <Button variant="default" size="lg" className="w-full"
      onClick={() => navigate('/login')}>
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
      <Button
        variant={hasServiceInfoIssue ? 'destructive' : 'default'}
        size="lg"
        className="w-full"
        onClick={() => {
          handleClose()
          navigate('/my-subscriptions', { state: { openGroupId: group.id } })
        }}
      >
        {hasServiceInfoIssue ? '修正服務帳號' : '填寫服務帳號'}
      </Button>
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
        <Button variant="destructive" size="lg" className="flex-1" disabled={withdrawing} onClick={handleWithdraw}>
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
  setShowMembers, setLeaveConfirm, onApplyClick, toggleFav,
}) {
  return (
    <div className="px-6 py-3">
      {isWaitingMembers ? (
        <div className="grid grid-cols-2 gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-auto flex-col gap-1 py-2 text-xs"
            onClick={() => setShowMembers(true)}
          >
            <Users size={17} /> 群組名單
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto flex-col gap-1 py-2 text-xs text-danger hover:bg-danger-subtle"
            onClick={() => setLeaveConfirm(true)}
          >
            <LogOut size={17} /> 退出群組
          </Button>
        </div>
      ) : canApply ? (
        <>
          <div className="flex items-center gap-2">
            <Button
              variant="ink"
              size="lg"
              className="flex-1"
              onClick={onApplyClick}
            >
              申請加入 <ChevronRight size={16} strokeWidth={1.5} />
            </Button>
            <FavoriteToggleButton isFav={isFav} onClick={toggleFav} heartSize={18} className="h-12 w-12" />
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
