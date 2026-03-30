import { useAuth } from "../../../shared/modules/auth/hooks/useAuth.js";
import { PageContainer } from "../../../shared/components/layout/PageContainer.jsx";
import { PageHeader } from "../../../shared/components/layout/PageHeader.jsx";
import { SectionPanel } from "../../../shared/components/layout/SectionPanel.jsx";
import { SettingsRow } from "../../../shared/components/layout/SettingsRow.jsx";

export function AccountCenterPage() {
  const { user } = useAuth();

  return (
    <PageContainer>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="PartyMatch"
          title="帳號中心"
          description="管理你的個人資料與帳號設定"
        />

        <div className="mx-auto max-w-4xl space-y-6">
          <SectionPanel
            title="個人資料"
            description="維護你的公開識別資訊，讓團主與成員更容易辨識你。"
          >
            <div className="divide-y divide-black/10">
              <SettingsRow
                label="顯示名稱"
                value={user?.displayName ?? "尚未設定"}
                description="顯示在群組與申請紀錄中的名稱。"
              />
              <SettingsRow
                label="Email"
                value={user?.email ?? "尚未登入"}
                description="用於登入與接收重要通知。"
              />
              <SettingsRow
                label="頭像"
                value="尚未設定"
                description="加入個人頭像，讓你的帳號識別度更高。"
                actionLabel="新增"
              />
              <SettingsRow
                label="自我介紹"
                value="喜歡找長期穩定分攤團。"
                description="可選填，幫助其他使用者快速了解你的使用習慣。"
              />
            </div>
          </SectionPanel>

          <SectionPanel
            title="帳號設定"
            description="調整登入、安全與通知偏好，確保 PartyMatch 的使用體驗符合你的習慣。"
          >
            <div className="divide-y divide-black/10">
              <SettingsRow
                label="密碼"
                value="••••••••"
                description="建議定期更新密碼以提升安全性。"
                actionLabel="更新"
              />
              <SettingsRow
                label="登入方式"
                value="Email / 密碼"
                description="後續可擴充第三方登入與兩步驟驗證。"
                actionLabel="管理"
              />
              <SettingsRow
                label="通知設定"
                value="Email + 站內通知"
                description="控制申請結果、群組更新與付款提醒的通知方式。"
                actionLabel="調整"
              />
              <SettingsRow
                label="隱私設定"
                value="公開顯示暱稱，隱藏 Email"
                description="決定哪些資訊會在群組與申請流程中被看見。"
                actionLabel="檢視"
              />
            </div>
          </SectionPanel>
        </div>
      </div>
    </PageContainer>
  );
}
