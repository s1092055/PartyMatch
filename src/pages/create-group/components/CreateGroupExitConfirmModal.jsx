import { AnimatePresence, motion } from "framer-motion";

const MotionDiv = motion.div;

export function CreateGroupExitConfirmModal({ open, onClose, onConfirm }) {
  return (
    <AnimatePresence>
      {open ? (
        <MotionDiv
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <MotionDiv
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-[32px] border border-black/10 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.24)]"
          >
            <div className="px-6 py-6 sm:px-7 sm:py-7">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-black/40">
                離開建立流程
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-black">
                離開建立流程？
              </h2>
              <p className="mt-3 text-sm leading-7 text-black/58 sm:text-[15px]">
                離開前可先儲存目前草稿，之後可再回來繼續編輯。
              </p>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-full border border-black/12 bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-black/[0.03]"
                >
                  返回編輯
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/85"
                >
                  儲存並離開
                </button>
              </div>
            </div>
          </MotionDiv>
        </MotionDiv>
      ) : null}
    </AnimatePresence>
  );
}
