import { useRef, useState } from 'react'
import { MoreVertical, Users } from 'lucide-react'
import { useClickOutside } from '../../../shared/utils/hooks'

export default function ConversationMenu({ selected, onMembersToggle }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  useClickOutside(open, [menuRef], () => setOpen(false))

  if (selected?.type !== 'group') return null

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink active:scale-100 active:opacity-70"
        aria-label="更多選項"
      >
        <MoreVertical size={18} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-2xl border border-line bg-white p-1 shadow-popover">
          <button
            onClick={() => { onMembersToggle(); setOpen(false) }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-raised"
          >
            <Users size={15} />
            群組成員
          </button>
        </div>
      )}
    </div>
  )
}
