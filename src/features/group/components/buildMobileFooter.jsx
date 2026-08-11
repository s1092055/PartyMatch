import { ChevronRight, CheckCircle2, LogIn, LogOut, ShieldCheck, Users } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import FavoriteToggleButton from '../../../components/ui/FavoriteToggleButton'

function renderCTA({
  group, activeUserId, navigate, handleClose,
  isHost, isWaitingMembers, needsFillInfo, hasServiceInfoIssue, isSharedCredentials,
  isMember, isPendingApp, isFull,
  cancelConfirm, setCancelConfirm, cancelling, handleCancel,
  redirectAfterLogin,
}) {
  if (!activeUserId) return (
    <Button variant="default" size="lg" className="w-full"
      onClick={() => navigate('/login', { state: redirectAfterLogin })}>
      <LogIn size={16} />登入以加入群組
    </Button>
  )
  if (isHost) return (
    <div className="flex items-center justify-center gap-2 rounded-lg bg-brand-subtle px-4 py-3 text-sm font-medium text-brand">
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
        {hasServiceInfoIssue ? '修正服務帳號' : isSharedCredentials ? '提取帳號資訊' : '填寫服務帳號'}
      </Button>
    </div>
  )
  if (isMember) return (
    <div className="flex items-center justify-center gap-2 rounded-lg bg-success-subtle px-4 py-3 text-sm font-medium text-success-text">
      <CheckCircle2 size={15} />已加入此群組
    </div>
  )
  if (isPendingApp) return (
    cancelConfirm ? (
      <div className="flex gap-2">
        <Button variant="ghost" size="lg" className="flex-1 border border-line" onClick={() => setCancelConfirm(false)}>返回</Button>
        <Button variant="destructive" size="lg" className="flex-1" disabled={cancelling} onClick={handleCancel}>
          {cancelling ? '處理中…' : '確認取消'}
        </Button>
      </div>
    ) : (
      <Button variant="ghost" size="lg" className="w-full border border-line text-ink-3 hover:border-danger hover:text-danger"
        onClick={() => setCancelConfirm(true)}>
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
  isHost, isWaitingMembers, needsFillInfo, hasServiceInfoIssue, isSharedCredentials,
  isMember, isPendingApp, isFull, canApply, isFav,
  cancelConfirm, setCancelConfirm, cancelling, handleCancel,
  setShowMembers, setLeaveConfirm, onApplyClick, toggleFav,
  padded = true,        // 桌機右欄已由外層容器提供左右留白，這裡不用再疊加一層，避免按鈕跟著往內縮、跟價格區塊的進度條對不齊
  squareFavorite = false, // 桌機右欄的收藏按鈕改用跟訊息按鈕一致的方形圓角，不要跟手機版一樣是圓形
  redirectAfterLogin,   // 未登入點「登入以加入群組」時帶去 /login，登入成功後導回這裡並重新打開這個群組詳情 modal
}) {
  return (
    <div className={padded ? 'px-6 py-3' : 'py-3'}>
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
        <div className="flex items-center gap-2">
          <Button
            size="lg"
            className="flex-1"
            onClick={onApplyClick}
          >
            申請加入 <ChevronRight size={16} strokeWidth={1.5} />
          </Button>
          <FavoriteToggleButton isFav={isFav} onClick={toggleFav} heartSize={18} className="h-12 w-12" square={squareFavorite} />
        </div>
      ) : (
        renderCTA({
          group, activeUserId, navigate, handleClose,
          isHost, isWaitingMembers, needsFillInfo, hasServiceInfoIssue, isSharedCredentials,
          isMember, isPendingApp, isFull,
          cancelConfirm, setCancelConfirm, cancelling, handleCancel,
          redirectAfterLogin,
        })
      )}
    </div>
  )
}
