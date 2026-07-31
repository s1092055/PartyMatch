import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from './alert-dialog'
import { useConfirmCountdown } from '../../common/utils/hooks'

// 重要操作（解散群組、移除成員等）的確認對話框，倒數幾秒才能點擊確認按鈕，
// 避免使用者誤觸；倒數邏輯是業務規則，故獨立成這個業務層 wrapper，不寫進
// AlertDialog 這個通用 primitive 裡
export default function ConfirmActionDialog({
  title,
  message,
  confirmLabel = '確認',
  danger = false,
  countdownSeconds = 5,
  onConfirm,
  onCancel,
}) {
  const { remaining, ready } = useConfirmCountdown(countdownSeconds)

  return (
    <AlertDialog open onOpenChange={v => { if (!v) onCancel() }}>
      <AlertDialogContent>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        {message && <AlertDialogDescription>{message}</AlertDialogDescription>}
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction danger={danger} disabled={!ready} onClick={onConfirm}>
            {ready ? confirmLabel : `${confirmLabel}（${remaining}）`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
