import { calcDisplayPrice, calcDisplayCycle } from './pricingUtils';
import { canReportServiceIssue } from './groupStatus';

export function getInfoRows(group) {
  if (!group) return []
  const displayPrice = calcDisplayPrice(group.pricePerSeat, group.billingCycle)
  return [
    { label: '群組狀態', badge: group.status },
    { label: '建立日期', value: group.createdAt?.slice(0, 10).replace(/-/g, '/') ?? '—' },
    ...(group.nextBillingDate ? [{
      label: '下次扣款',
      value: `${group.nextBillingDate.slice(0, 10).replace(/-/g, '/')}${canReportServiceIssue(group.status) ? '（預估）' : ''}`,
    }] : []),
    {
      label: '每位價格',
      priceInfo: Number.isFinite(displayPrice)
        ? { amount: displayPrice, cycle: calcDisplayCycle(group.billingCycle) }
        : null,
    },
    { label: '帳號需求', value: group.requirements || '無' },
    { label: '信用分數', creditScore: group.minCreditScore },
  ];
}
