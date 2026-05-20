import { useState } from 'react'
import { getActiveUserProfile } from '../../shared/stores/userStore'
import Tabs from '../../shared/components/ui/Tabs'
import PageHeader from '../../shared/components/layout/PageHeader'
import ProfileHeaderCard  from './components/ProfileHeaderCard'
import AccountSidebar     from './components/AccountSidebar'
import PersonalInfoTab    from './components/tabs/PersonalInfoTab'
import PaymentMethodsTab  from './components/tabs/PaymentMethodsTab'
import NotificationTab    from './components/tabs/NotificationTab'
import SecurityTab        from './components/tabs/SecurityTab'
import SettingsTab        from './components/tabs/SettingsTab'

const TABS = [
  { value: 'profile',       label: '個人資料' },
  { value: 'payment',       label: '付款方式' },
  { value: 'notifications', label: '通知偏好' },
  { value: 'security',      label: '安全驗證' },
  { value: 'settings',      label: '設定'     },
]

export default function AccountCenterPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [user, setUser] = useState({
    ...getActiveUserProfile(),
    phone:  '+886-912-345-678',
    bio:    '熱愛音樂與影音內容，長期使用共享訂閱服務。',
    lineId: '@partymatch_user',
  })

  function handleUserChange(key, value) {
    setUser(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div>
      <PageHeader
        title="帳號中心"
        className="mb-6 text-center"
      />

      <ProfileHeaderCard user={user} onEdit={() => setActiveTab('profile')} />

      <div className="flex flex-col lg:flex-row gap-5 lg:items-start">
        {/* Left — tabs */}
        <div className="flex-1 min-w-0">
          <Tabs
            tabs={TABS}
            active={activeTab}
            onChange={setActiveTab}
            className="mb-4"
          />

          {activeTab === 'profile'       && <PersonalInfoTab   user={user} onChange={handleUserChange} />}
          {activeTab === 'payment'       && <PaymentMethodsTab />}
          {activeTab === 'notifications' && <NotificationTab />}
          {activeTab === 'security'      && <SecurityTab />}
          {activeTab === 'settings'      && <SettingsTab />}
        </div>

        {/* Right — sidebar */}
        <div className="w-full lg:w-[18rem] shrink-0">
          <AccountSidebar user={user} />
        </div>
      </div>
    </div>
  )
}
