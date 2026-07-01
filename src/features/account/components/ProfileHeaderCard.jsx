import { CheckCircle2 } from 'lucide-react'

export default function ProfileHeaderCard({ user }) {
  return (
    <div className="card p-6 mb-5 flex flex-col md:flex-row items-start md:items-center gap-5">

      <div className="relative shrink-0">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold"
          style={{ backgroundColor: user.avatarColor }}
        >
          {(user.displayName ?? '使')[0]}
        </div>
        {user.isVerified && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow">
            <CheckCircle2 size={18} className="text-brand" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <h2 className="text-xl font-bold text-ink">{user.displayName}</h2>
          {user.isVerified && (
            <span className="badge badge-blue">
              <CheckCircle2 size={11} /> 已驗證
            </span>
          )}
        </div>
        <p className="text-sm text-ink-3">{user.email}</p>
      </div>

    </div>
  )
}
