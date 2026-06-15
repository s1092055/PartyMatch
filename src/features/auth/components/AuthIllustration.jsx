import { Lock, PieChart, ShieldCheck, Users } from 'lucide-react'
import ServiceLogo from '../../../shared/ui/ServiceLogo'

const FEATURES = [
  {
    icon: Users,
    title: '快速配對',
    desc: '找到合適的夥伴一起分攤訂閱費用。',
  },
  {
    icon: ShieldCheck,
    title: '安全可靠',
    desc: '保障交易安全與個資隱私。',
  },
  {
    icon: PieChart,
    title: '輕鬆管理',
    desc: '集中管理你的訂閱與付款狀態。',
  },
]

export default function AuthIllustration({ title = '更聰明的訂閱方式' }) {
  return (
    <aside className="relative hidden min-h-[43rem] overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-12 shadow-sm lg:block">
      <div className="relative z-10">
        <h2 className="text-3xl font-extrabold leading-tight text-slate-950">{title}</h2>
        <p className="mt-5 text-base font-medium leading-relaxed text-slate-500">
          與對的人一起分享訂閱，享受更多優質服務。
        </p>

        <div className="mt-10 space-y-7">
          {FEATURES.map(({ icon: Icon, title: featureTitle, desc }) => (
            <div key={featureTitle} className="flex items-start gap-5">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-100 text-blue-600">
                <Icon size={27} strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-lg font-extrabold text-slate-950">{featureTitle}</p>
                <p className="mt-1 text-sm font-medium leading-relaxed text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[22rem] bg-[linear-gradient(150deg,transparent_20%,rgba(37,99,235,0.08)_20%,rgba(37,99,235,0.08)_62%,transparent_62%)]" />

      <div className="absolute bottom-20 right-12 w-48 rounded-[2rem] border-[10px] border-white bg-white p-5 shadow-xl shadow-slate-200/70">
        <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-200" />
        <p className="pt-7 text-sm font-extrabold text-slate-950">我的訂閱</p>
        <div className="mt-4 space-y-3">
          <MiniSubscription serviceId="spotify" title="Spotify 家庭方案" price="NT$150 / 月" />
          <MiniSubscription serviceId="disney" title="Disney+ 標準方案" price="NT$93 / 月" />
          <MiniSubscription serviceId="youtube" title="YouTube Premium" price="NT$70 / 月" />
        </div>
      </div>

      <div className="absolute bottom-16 left-16 w-[19rem] rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
        <div className="flex items-center gap-4">
          <ServiceLogo serviceId="netflix" size={58} />
          <div>
            <p className="text-base font-extrabold text-slate-950">Netflix 高級方案</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">每月 NT$390</p>
          </div>
        </div>

        <div className="mt-7 flex items-center justify-between">
          <div className="flex -space-x-3">
            {['陳', '林', '王', '張'].map((name, index) => (
              <span
                key={name}
                className="grid h-10 w-10 place-items-center rounded-full border-2 border-white text-sm font-bold text-white"
                style={{ backgroundColor: ['#3B82F6', '#EC4899', '#F59E0B', '#10B981'][index] }}
              >
                {name}
              </span>
            ))}
          </div>
          <span className="rounded-full bg-success-subtle px-3 py-1 text-xs font-extrabold text-success-text">已滿團</span>
        </div>
      </div>

      <div className="absolute bottom-16 right-60 grid h-16 w-16 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
        <Lock size={30} />
      </div>
    </aside>
  )
}

function MiniSubscription({ serviceId, title, price }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
      <ServiceLogo serviceId={serviceId} size={32} />
      <div className="min-w-0">
        <p className="truncate text-2xs font-extrabold text-slate-950">{title}</p>
        <p className="text-xs font-bold text-slate-400">{price}</p>
      </div>
    </div>
  )
}
