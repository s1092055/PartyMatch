import { useState } from "react";
import { useAuthStore } from "../../shared/stores/useAuthStore";
import { useSubscriptionStore } from "../../shared/stores/useSubscriptionStore";
import Tabs from "../../shared/ui/Tabs";
import PageHeader from "../../shared/layout/PageHeader";
import ProfileHeaderCard from "./components/ProfileHeaderCard";
import AccountSidebar from "./components/AccountSidebar";
import PersonalInfoTab from "./components/tabs/PersonalInfoTab";
import PaymentMethodsTab from "./components/tabs/PaymentMethodsTab";
import NotificationTab from "./components/tabs/NotificationTab";
import SecurityTab from "./components/tabs/SecurityTab";
import SettingsTab from "./components/tabs/SettingsTab";

const TABS = [
  { value: "profile", label: "個人資料" },
  { value: "payment", label: "付款方式" },
  { value: "notifications", label: "通知偏好" },
  { value: "security", label: "安全驗證" },
  { value: "settings", label: "設定" },
];

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState(() => {
    const profile = useAuthStore.getState().getProfile();
    return {
      ...profile,
      phone: profile?.phone ?? "",
      bio: profile?.bio ?? "",
      lineId: profile?.lineId ?? "",
    };
  });

  const subscriptions = useSubscriptionStore(s => s.subscriptions)
  const allSubs = subscriptions.filter(sub => sub.userId === user.id)
  const activeSubs = allSubs.filter(s => s.status === 'active')

  function handleUserChange(key, value) {
    setUser((prev) => ({ ...prev, [key]: value }));
    useAuthStore.getState().updateProfile({ [key]: value }).catch(console.error);
  }

  return (
    <div>
      <PageHeader title="帳號中心" className="mb-6 text-center" />

      <ProfileHeaderCard user={user} />

      <div className="flex flex-col lg:flex-row gap-5 lg:items-start">
        <div className="flex-1 min-w-0">
          <Tabs
            tabs={TABS}
            active={activeTab}
            onChange={setActiveTab}
            className="mb-4"
          />

          {activeTab === "profile" && (
            <PersonalInfoTab user={user} onChange={handleUserChange} />
          )}
          {activeTab === "payment" && <PaymentMethodsTab />}
          {activeTab === "notifications" && <NotificationTab />}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "settings" && <SettingsTab />}
        </div>

        <div className="w-full lg:w-[18rem] shrink-0">
          <AccountSidebar user={user} activeSubs={activeSubs} totalSubs={allSubs.length} />
        </div>
      </div>
    </div>
  );
}
