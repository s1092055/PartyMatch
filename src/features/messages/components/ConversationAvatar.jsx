import logoUrl from '../../../assets/Logo.svg'
import ServiceLogo from '../../../components/ui/ServiceLogo'

export default function ConversationAvatar({ conversation, size = 44 }) {
  if (conversation.serviceId) {
    return <ServiceLogo serviceId={conversation.serviceId} size={size} className="shrink-0" />
  }
  // avatarInitial 為空代表對方關閉了大頭照顯示（後端已遮罩），fallback 成 PartyMatch logo
  if (!conversation.avatarInitial) {
    return (
      <span
        className="grid shrink-0 place-items-center rounded-full border border-line bg-surface"
        style={{ width: size, height: size }}
      >
        <img src={logoUrl} alt="" style={{ width: size / 2, height: size / 2 }} />
      </span>
    )
  }
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full text-sm font-black text-white"
      style={{ width: size, height: size, background: conversation.avatarColor ?? '#64748b' }}
    >
      {conversation.avatarInitial}
    </span>
  )
}
