import { getPlanChips } from '../../utils/groupDisplay'
import { ServiceIntro } from './GroupOverviewContent'

// 團主/成員視角群組詳情 Modal 的「服務內容」分頁，內容跟原本群組概覽裡的服務介紹完全一樣，只是搬進獨立分頁
export default function ServiceContentPanel({ group, service, plan }) {
  const planChips = getPlanChips(group, plan)
  return (
    <div className="p-5">
      <p className="mb-4 text-lg font-black text-brand">服務介紹</p>
      <ServiceIntro service={service} plan={plan} planChips={planChips} />
    </div>
  )
}
