import { useRef, useState } from 'react'
import { MoreVertical, Trash2, Users } from 'lucide-react'
import { useClickOutside } from '../../../shared/utils/hooks'

export default function ConversationMenu({ selected, onMembersToggle, onDeleteConversation }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  useClickOutside(open, [menuRef], () => setOpen(false))

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
        aria-label="更多選項"
      >
        <MoreVertical size={18} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-2xl border border-line bg-white p-1 shadow-popover">
          {selected?.type === 'group' && (
            <>
              <button
                onClick={() => { onMembersToggle(); setOpen(false) }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-raised"
              >
                <Users size={15} />
                群組成員
              </button>
              <div className="my-1 h-px bg-line-subtle" />
            </>
          )}
          <button
            onClick={() => { onDeleteConversation(); setOpen(false) }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-danger transition-colors hover:bg-danger-subtle"
          >
            <Trash2 size={15} />
            刪除對話
          </button>
        </div>
      )}
    </div>
  )
}
