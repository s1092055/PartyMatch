import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { CreateGroupDraftPanel } from "./CreateGroupDraftPanel.jsx";

const MotionDiv = motion.div;

export function CreateGroupDraftModal({
  open,
  draft,
  onClose,
  onResume,
  onDelete,
}) {
  return (
    <AnimatePresence>
      {open && draft ? (
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
            className="relative w-full max-w-4xl"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="關閉草稿內容"
              className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/92 text-black/70 transition hover:bg-white hover:text-black"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <CreateGroupDraftPanel
              draft={draft}
              onResume={onResume}
              showCreateNewButton={false}
              showDeleteButton
              onDelete={onDelete}
              className="max-h-[min(760px,calc(100dvh-48px))] overflow-y-auto pr-1 scrollbar-none"
            />
          </MotionDiv>
        </MotionDiv>
      ) : null}
    </AnimatePresence>
  );
}
