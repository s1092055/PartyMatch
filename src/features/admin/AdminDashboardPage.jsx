import { useOutletContext } from 'react-router-dom'
import { Tabs, TabsContent } from '../../components/ui/tabs'
import OverviewSection from './components/OverviewSection'
import SystemMessagesSection from './components/SystemMessagesSection'
import DisputeSection from './components/DisputeSection'
import UserAccountsSection from './components/UserAccountsSection'
import PlatformReportsSection from './components/PlatformReportsSection'

export default function AdminDashboardPage() {
  const { activeTab } = useOutletContext()

  return (
    <Tabs value={activeTab}>
      <TabsContent value="overview"><OverviewSection /></TabsContent>
      <TabsContent value="messages"><SystemMessagesSection /></TabsContent>
      <TabsContent value="disputes"><DisputeSection /></TabsContent>
      <TabsContent value="accounts"><UserAccountsSection /></TabsContent>
      <TabsContent value="platformReports"><PlatformReportsSection /></TabsContent>
    </Tabs>
  )
}
