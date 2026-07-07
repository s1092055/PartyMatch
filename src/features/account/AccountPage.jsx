import { useEffect, useState } from "react";
import { Bell, ChevronDown, Clock, Coins, Lock, Settings, Shield, User } from "lucide-react";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import ProfileHeaderCard from "./components/ProfileHeaderCard";
import PersonalInfoTab from "./components/tabs/PersonalInfoTab";
import TokenTab from "./components/tabs/TokenTab";
import AdminTab from "./components/tabs/AdminTab";
import SettingsTab from "./components/tabs/SettingsTab";

const BASE_TABS = [
  { value: "profile",       label: "個人資料", icon: User       },
  { value: "tokens",        label: "付款設定", icon: Coins      },
  { value: "notifications", label: "通知偏好", icon: Bell,       comingSoon: true },
  { value: "security",      label: "安全驗證", icon: Lock,       comingSoon: true },
  { value: "settings",      label: "其他設定", icon: Settings   },
];

function TabReveal({ children }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 0.75s cubic-bezier(0.25, 0.1, 0.25, 1), transform 0.75s cubic-bezier(0.25, 0.1, 0.25, 1)',
    }}>
      {children}
    </div>
  )
}

function ComingSoonPlaceholder({ label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-raised">
        <Clock size={22} className="text-ink-3" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-ink">「{label}」尚未開放</p>
        <p className="text-xs text-ink-3">此功能正在開發中，敬請期待</p>
      </div>
    </div>
  )
}

function TabContent({ value, user, onChange, tabs }) {
  const tab = tabs.find(t => t.value === value)
  if (tab?.comingSoon) return <ComingSoonPlaceholder label={tab.label} />
  if (value === "profile")       return <PersonalInfoTab user={user} onChange={onChange} />
  if (value === "tokens")        return <TokenTab />
  if (value === "settings")      return <SettingsTab />
  if (value === "admin")         return <AdminTab />
  return null
}

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [openAccordion, setOpenAccordion] = useState("profile");
  const isAdmin = useAuthStore(s => s.user?.isAdmin ?? false)
  const [user, setUser] = useState(() => {
    const profile = useAuthStore.getState().getProfile();
    return {
      ...profile,
      phone: profile?.phone ?? "",
      bio: profile?.bio ?? "",
      lineId: profile?.lineId ?? "",
    };
  });

  const TABS = isAdmin ? [...BASE_TABS, { value: "admin", label: "管理員", icon: Shield }] : BASE_TABS

  function handleUserChange(key, value) {
    setUser((prev) => ({ ...prev, [key]: value }));
    useAuthStore.getState().updateProfile({ [key]: value }).catch(console.error);
  }

  return (
    <div className="px-2 md:px-4 lg:px-16">
      <ProfileHeaderCard user={user} />

      {/* 桌面版：左右 sidebar 佈局 */}
      <div className="hidden md:flex md:gap-6 lg:gap-8">
        {/* 左側 tab 選單 */}
        <nav className="w-44 shrink-0 self-start">
          <ul className="flex flex-col gap-1">
            {TABS.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.value
              return (
                <li key={tab.value}>
                  <button
                    onClick={() => setActiveTab(tab.value)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
                      isActive
                        ? 'bg-brand-subtle text-brand'
                        : 'text-ink-2 hover:bg-raised hover:text-ink'
                    }`}
                  >
                    {Icon && <Icon size={17} strokeWidth={2.1} className="shrink-0" />}
                    <span className="flex-1 text-left">{tab.label}</span>
                    {tab.comingSoon && (
                      <span className="rounded-full bg-raised px-1.5 py-0.5 text-[0.6rem] font-bold text-ink-3">即將</span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* 右側內容區 */}
        <div className="min-w-0 flex-1">
          <TabReveal key={activeTab}>
            <TabContent value={activeTab} user={user} onChange={handleUserChange} tabs={TABS} />
          </TabReveal>
        </div>
      </div>

      {/* 手機版：Accordion */}
      <div className="md:hidden space-y-2">
        {TABS.map(tab => {
          const isOpen = openAccordion === tab.value
          return (
            <div key={tab.value} className="card overflow-hidden">
              <button
                onClick={() => setOpenAccordion(isOpen ? null : tab.value)}
                className="flex w-full items-center justify-between px-4 py-3.5 text-left"
              >
                <span className="flex items-center gap-2.5">
                  {tab.icon && <tab.icon size={17} strokeWidth={2.1} className={isOpen ? 'text-brand' : 'text-ink-3'} />}
                  <span className={`font-bold ${isOpen ? 'text-brand' : 'text-ink'}`}>{tab.label}</span>
                  {tab.comingSoon && (
                    <span className="rounded-full bg-raised px-1.5 py-0.5 text-[0.6rem] font-bold text-ink-3">即將</span>
                  )}
                </span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-ink-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <TabReveal key={tab.value}>
                  <div className="border-t border-line px-4 py-4">
                    <TabContent value={tab.value} user={user} onChange={handleUserChange} tabs={TABS} />
                  </div>
                </TabReveal>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
}
