import Button from '../ui/Button'
import Modal from '../ui/Modal'

export default function LogoutConfirmModal({ isOpen, onClose, onConfirm }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="px-8 py-9 text-center">
        <div className="mx-auto mb-5 flex items-center justify-center gap-2 text-2xl font-extrabold">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-600 text-xl font-black text-white">P</div>
          <span><span className="text-blue-600">Party</span><span className="text-slate-950">Match</span></span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-950">確定要登出嗎？</h2>
        <p className="mx-auto mt-5 max-w-sm text-sm font-medium leading-relaxed text-slate-500">
          登出後你將離開目前的工作階段，但你的資料仍會保留。
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4">
          <Button
            variant="secondary"
            size="lg"
            className="h-12 border-slate-200 text-slate-950"
            onClick={onClose}
          >
            取消
          </Button>
          <Button size="lg" className="h-12 bg-blue-600 hover:bg-blue-700" onClick={onConfirm}>
            確認登出
          </Button>
        </div>
      </div>
    </Modal>
  )
}
