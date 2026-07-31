import ServiceLogo from '../../../components/ui/ServiceLogo'

export default function ConversationAvatar({ conversation, size = 44 }) {
  if (conversation.serviceId) {
    return <ServiceLogo serviceId={conversation.serviceId} size={size} className="shrink-0 rounded-xl" />
  }
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full text-sm font-black text-white"
      style={{ width: size, height: size, background: conversation.avatarColor ?? '#64748b' }}
    >
      {conversation.avatarInitial ?? '?'}
    </span>
  )
}
