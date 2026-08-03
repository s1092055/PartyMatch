import { Search, SquarePen } from 'lucide-react'
import ConversationAvatar from './ConversationAvatar'
import { formatTime } from '../utils'

const CONV_TABS = [
  { id: 'all',   label: '全部', filter: () => true },
  { id: 'group', label: '群組', filter: c => c.type === 'group' },
  { id: 'dm',    label: '個人', filter: c => c.type === 'dm' },
]

export { CONV_TABS }

export default function ConversationList({ filteredConvs, activeTab, selectedId, user, searchQuery, onSelectConversation, onTabChange, onSearchChange }) {
  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 rounded-lg border border-transparent bg-raised px-3 py-2 transition-[border-color,box-shadow] focus-within:border-brand focus-within:ring-4 focus-within:ring-brand-subtle">
          <Search size={14} className="shrink-0 text-ink-4" />
          <input
            type="text"
            placeholder="搜尋對話..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-4"
          />
        </div>
      </div>

      <div className="flex border-b border-line px-3 py-2 gap-1">
        {CONV_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-colors ${
              activeTab === tab.id
                ? 'bg-brand text-white'
                : 'text-ink-3 hover:bg-raised hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {filteredConvs.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-ink-4">
            <SquarePen size={32} strokeWidth={1.5} />
            <p className="text-sm">目前沒有對話</p>
          </div>
        )}
        {filteredConvs.map(conversation => {
          const unread = conversation.unreadCounts?.[user?.id] ?? 0
          return (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-raised ${
                conversation.id === selectedId ? 'bg-brand-subtle/40' : ''
              }`}
            >
              <ConversationAvatar conversation={conversation} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-bold text-ink">{conversation.name}</span>
                  <span className="shrink-0 text-xs text-ink-4">{formatTime(conversation.lastMessageAt)}</span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-ink-3">{conversation.lastMessage}</span>
                  {unread > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand px-1 text-xs font-black text-white">
                      {unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
