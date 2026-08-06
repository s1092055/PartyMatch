import { useState } from 'react'
import { LayoutGrid, Megaphone, ShieldAlert } from 'lucide-react'
import { useGroupStore } from '../../common/stores/useGroupStore'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs'
import { Badge } from '../../components/ui/badge'
import OverviewSection from './components/OverviewSection'
import SystemMessagesSection from './components/SystemMessagesSection'
import DisputeSection from './components/DisputeSection'

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const pendingDisputeCount = useGroupStore(s => s.groups.filter(g => g.status === 'disputed').length)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-ink">管理員後台</h1>
        <p className="mt-0.5 text-sm text-ink-3">PartyMatch 平台管理</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <LayoutGrid size={14} strokeWidth={1.5} />
            平台概覽
          </TabsTrigger>
          <TabsTrigger value="messages">
            <Megaphone size={14} strokeWidth={1.5} />
            系統訊息
          </TabsTrigger>
          <TabsTrigger value="disputes">
            <ShieldAlert size={14} strokeWidth={1.5} />
            申訴裁定
            {pendingDisputeCount > 0 && (
              <Badge variant="destructive" className="px-1.5">{pendingDisputeCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><OverviewSection /></TabsContent>
        <TabsContent value="messages"><SystemMessagesSection /></TabsContent>
        <TabsContent value="disputes"><DisputeSection /></TabsContent>
      </Tabs>
    </div>
  )
}
