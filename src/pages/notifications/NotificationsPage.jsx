import { PageContainer } from "../../shared/components/layout/PageContainer.jsx";
import { PageHeader } from "../../shared/components/layout/PageHeader.jsx";
import { SectionPanel } from "../../shared/components/layout/SectionPanel.jsx";
import { SettingsRow } from "../../shared/components/layout/SettingsRow.jsx";
import { NOTIFICATIONS_MOCK } from "../../data/notifications.mock.js";

export function NotificationsPage() {
  return (
    <PageContainer>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="PartyMatch"
          title="通知中心"
          description="查看與群組、申請、追蹤、帳號相關的最新通知"
        />

        <div className="mx-auto max-w-4xl">
          <SectionPanel
            title="最新通知"
            description="你的通知清單。"
          >
            {!NOTIFICATIONS_MOCK.length ? (
              <div className="rounded-2xl border border-dashed border-black/10 px-6 py-12 text-center">
                <div className="text-lg font-semibold text-black">目前沒有新的通知</div>
                <p className="mt-2 text-sm text-black/55">
                  當有申請結果、群組更新或系統提醒時，會顯示在這裡。
                </p>
              </div>
            ) : (
              <div className="divide-y divide-black/10">
                {NOTIFICATIONS_MOCK.map((item) => (
                  <SettingsRow
                    key={item.id}
                    label={item.category}
                    value={item.title}
                    description={`${item.description} · ${item.time}`}
                    actionLabel="標記已讀"
                  />
                ))}
              </div>
            )}
          </SectionPanel>
        </div>
      </div>
    </PageContainer>
  );
}
