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

export default function ConfirmActionDialog(
  {
    title,
    message,
    confirmLabel = '確認',
    danger = false,
    countdownSeconds = 5,
    onConfirm,
    onCancel,
  }
) {
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
