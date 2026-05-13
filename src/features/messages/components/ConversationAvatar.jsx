import logoUrl from '../../../assets/Logo.svg'
import ServiceLogo from '../../../components/ui/ServiceLogo'
import { PresenceDot } from '../../../common/layout/components/navShared'

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
        style={{ background: conversation.avatarColor ?? '#64718A' }}
      >
        {conversation.avatarInitial}
      </span>
      <Dot conversation={conversation} size={size} />
    </span>
  )
}
