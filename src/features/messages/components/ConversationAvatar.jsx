import logoUrl from '../../../assets/Logo.svg'
import ServiceLogo from '../../../components/ui/ServiceLogo'
import { PresenceDot } from '../../../common/layout/components/navShared'

// 只有 DM（跟特定某個人的私訊）才顯示狀態點——群組聊天室是多人共用的頭像，
// 沒有單一「對方」的線上狀態可以顯示
function Dot({ conversation, size }) {
  if (conversation.type !== 'dm') return null
  const dotSize = Math.max(Math.round(size / 3.2), 9)
  return (
    <PresenceDot
      status={conversation.presenceStatus}
      className="absolute bottom-0 right-0"
      style={{ width: dotSize, height: dotSize }}
    />
  )
}

export default function ConversationAvatar({ conversation, size = 44 }) {
  if (conversation.serviceId) {
    return <ServiceLogo serviceId={conversation.serviceId} size={size} className="shrink-0" />
  }
  // avatarInitial 為空代表對方關閉了大頭照顯示（後端已遮罩），fallback 成 PartyMatch logo
  if (!conversation.avatarInitial) {
    return (
      <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
        <span
          className="grid h-full w-full place-items-center rounded-full border border-line bg-surface"
        >
          <img src={logoUrl} alt="" style={{ width: size / 2, height: size / 2 }} />
        </span>
        <Dot conversation={conversation} size={size} />
      </span>
    )
  }
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <span
        className="grid h-full w-full place-items-center rounded-full text-sm font-black text-white"
        style={{ background: conversation.avatarColor ?? '#64748b' }}
      >
        {conversation.avatarInitial}
      </span>
      <Dot conversation={conversation} size={size} />
    </span>
  )
}
