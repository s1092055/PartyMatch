import { useEffect, useState } from "react";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import { useAuthStore } from "../../common/stores/useAuthStore";
import { useLogout } from "../../common/utils/hooks";
import { toast } from "../../common/utils/toast";
import CreditScoreModal from "../../components/ui/CreditScoreModal";
import { Button } from "../../components/ui/button";
import HostReviewsModal from "../manage-groups/components/HostReviewsModal";
import ProfileHeaderCard from "./components/ProfileHeaderCard";
import PersonalInfoTab from "./components/tabs/PersonalInfoTab";
import SettingsTab from "./components/tabs/SettingsTab";

const BASE_TABS = [
  { value: "profile",  label: "個人資料", icon: User     },
  { value: "settings", label: "其他設定", icon: Settings },
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

function TabContent({ value, user, onChange }) {
  if (value === "profile")  return <PersonalInfoTab user={user} onChange={onChange} />
  if (value === "settings") return <SettingsTab />
  return null
}

function LogoutButton({ className = "", fullWidth = false }) {
  const { loggingOut, logout } = useLogout();

  return (
    <div className={`flex ${fullWidth ? '' : 'justify-end'} ${className}`}>
      <Button
        onClick={logout}
        loading={loggingOut}
        className={`shrink-0 rounded-2xl ${fullWidth ? 'w-full' : ''}`}
      >
        <LogOut size={16} className="shrink-0" />
        登出
      </Button>
    </div>
  )
}

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [openAccordion, setOpenAccordion] = useState(null);
  const [creditScoreOpen, setCreditScoreOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [user, setUser] = useState(() => {
    const profile = useAuthStore.getState().getProfile();
    return {
      ...profile,
      phone: profile?.phone ?? "",
      bio: profile?.bio ?? "",
    };
  });

  async function handleUserChange(key, value) {
    const previousValue = user[key];
    setUser((prev) => ({ ...prev, [key]: value }));
    // updateProfile 失敗時回傳 { ok: false }（不會 throw），先前用 .catch 接永遠接不到，
    // 導致儲存失敗被完全吞掉、畫面仍顯示未儲存成功的樂觀值——改為檢查 result.ok 並復原；
    // 回傳這個 promise 讓呼叫端（欄位的儲存按鈕）可以在存檔中顯示 loading 狀態
    const result = await useAuthStore.getState().updateProfile({ [key]: value });
    if (result.ok) return;
    setUser((prev) => ({ ...prev, [key]: previousValue }));
    toast(result.error ?? "儲存失敗，請稍後再試", "error");
  }

  return (
    <div className="px-2 pt-6 md:mx-auto md:max-w-2xl md:px-4 md:pt-0 lg:max-w-3xl">
      <ProfileHeaderCard
        user={user}
        onOpenCreditScore={() => setCreditScoreOpen(true)}
        onOpenReviews={() => setReviewsOpen(true)}
      />

      <CreditScoreModal isOpen={creditScoreOpen} onClose={() => setCreditScoreOpen(false)} />
      <HostReviewsModal isOpen={reviewsOpen} onClose={() => setReviewsOpen(false)} host={user} />

      {/* 桌面版：左右 sidebar 佈局 */}
      <div className="hidden lg:flex lg:gap-8">
        {/* 左側 tab 選單 */}
        <nav className="w-44 shrink-0 self-start" aria-label="帳號設定分頁">
          <ul className="flex flex-col gap-1" role="tablist">
            {BASE_TABS.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.value
              return (
                <li key={tab.value} role="presentation">
                  <button
                    id={`account-tab-${tab.value}`}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`account-tabpanel-${tab.value}`}
                    onClick={() => setActiveTab(tab.value)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold transition-colors ${
                      isActive
                        ? 'bg-brand-subtle text-brand'
                        : 'text-ink-2 hover:bg-raised hover:text-ink'
                    }`}
                  >
                    {Icon && <Icon size={17} strokeWidth={2.1} className="shrink-0" />}
                    <span className="flex-1 text-left">{tab.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* 右側內容區：固定高度，內容過長時自行垂直捲動，登出按鈕固定在底部 */}
        <div className="flex min-w-0 flex-1 flex-col" style={{ height: 'calc(100dvh - 16rem)', minHeight: '28rem' }}>
          <div
            id={`account-tabpanel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`account-tab-${activeTab}`}
            className="min-h-0 flex-1 overflow-y-auto pl-1.5 pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <TabReveal key={activeTab}>
              <TabContent value={activeTab} user={user} onChange={handleUserChange} />
            </TabReveal>
          </div>

          <LogoutButton className="mt-4" />
        </div>
      </div>

      {/* 手機版／平板：Accordion */}
      <div className="lg:hidden">
        <div className="space-y-2">
        {BASE_TABS.map(tab => {
          const isOpen = openAccordion === tab.value
          return (
            <div key={tab.value} className="overflow-hidden rounded-inner border border-line bg-surface shadow-card">
              <button
                id={`account-accordion-${tab.value}`}
                aria-expanded={isOpen}
                aria-controls={`account-accordion-panel-${tab.value}`}
                onClick={() => setOpenAccordion(isOpen ? null : tab.value)}
                className="flex w-full items-center justify-between px-4 py-3.5 text-left"
              >
                <span className="flex items-center gap-2.5">
                  {tab.icon && <tab.icon size={17} strokeWidth={2.1} className={isOpen ? 'text-brand' : 'text-ink-3'} />}
                  <span className={`font-bold ${isOpen ? 'text-brand' : 'text-ink'}`}>{tab.label}</span>
                </span>
                <ChevronDown
                  size={18}
                  strokeWidth={1.5}
                  className={`shrink-0 text-ink-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <TabReveal key={tab.value}>
                  <div
                    id={`account-accordion-panel-${tab.value}`}
                    role="region"
                    aria-labelledby={`account-accordion-${tab.value}`}
                    className="border-t border-line px-4 py-4"
                  >
                    <TabContent value={tab.value} user={user} onChange={handleUserChange} />
                  </div>
                </TabReveal>
              )}
            </div>
          )
        })}
        </div>

        <LogoutButton fullWidth className="mt-6" />
      </div>
    </div>
  );
}
