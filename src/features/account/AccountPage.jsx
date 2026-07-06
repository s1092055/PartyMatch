import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { useSubscriptionStore } from "../../shared/stores/useSubscriptionStore";
import Tabs from "../../shared/ui/Tabs";
import PageHeader from "../../shared/layout/PageHeader";
import ProfileHeaderCard from "./components/ProfileHeaderCard";
import PersonalInfoTab from "./components/tabs/PersonalInfoTab";
import TokenTab from "./components/tabs/TokenTab";
import AdminTab from "./components/tabs/AdminTab";
import PaymentMethodsTab from "./components/tabs/PaymentMethodsTab";
import NotificationTab from "./components/tabs/NotificationTab";
import SecurityTab from "./components/tabs/SecurityTab";
import SettingsTab from "./components/tabs/SettingsTab";

const BASE_TABS = [
  { value: "profile",       label: "個人資料" },
  { value: "tokens",        label: "代幣帳戶" },
  { value: "payment",       label: "付款方式" },
  { value: "notifications", label: "通知偏好" },
  { value: "security",      label: "安全驗證" },
  { value: "settings",      label: "設定" },
];

function TabContent({ value, user, onChange }) {
  if (value === "profile")       return <PersonalInfoTab user={user} onChange={onChange} />
  if (value === "tokens")        return <TokenTab />
  if (value === "payment")       return <PaymentMethodsTab />
  if (value === "notifications") return <NotificationTab />
  if (value === "security")      return <SecurityTab />
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

  const TABS = isAdmin ? [...BASE_TABS, { value: "admin", label: "管理員" }] : BASE_TABS

  const subscriptions = useSubscriptionStore(s => s.subscriptions)
  const allSubs = subscriptions.filter(sub => sub.userId === user.id)
  const activeSubs = allSubs.filter(s => s.status === 'active')

  function handleUserChange(key, value) {
    setUser((prev) => ({ ...prev, [key]: value }));
    useAuthStore.getState().updateProfile({ [key]: value }).catch(console.error);
  }

  return (
    <div className="px-2 md:px-4 lg:px-8 lg:px-16">
      <PageHeader title="帳號中心" className="mb-6 text-center" />

      <ProfileHeaderCard user={user} activeSubs={activeSubs} totalSubs={allSubs.length} />

      {/* 桌面版：Tabs */}
      <div className="hidden md:block">
        <Tabs
          tabs={TABS}
          active={activeTab}
          onChange={setActiveTab}
          className="mb-4"
        />
        <TabContent value={activeTab} user={user} onChange={handleUserChange} />
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
                <span className="font-bold text-ink">{tab.label}</span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-ink-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <div className="border-t border-line px-4 py-4">
                  <TabContent value={tab.value} user={user} onChange={handleUserChange} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
}
