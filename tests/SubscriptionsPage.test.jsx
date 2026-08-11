import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SubscriptionsPage from '../src/features/subscriptions/SubscriptionsPage'
import { useSubscriptionStore } from '../src/common/stores/useSubscriptionStore'
import { useGroupStore } from '../src/common/stores/useGroupStore'
import { useApplicationStore } from '../src/common/stores/useApplicationStore'
import { useMemberStore } from '../src/common/stores/useMemberStore'
import { useAuthStore } from '../src/common/stores/useAuthStore'

function renderSubscriptionsPage() {
  return render(
    <MemoryRouter>
      <SubscriptionsPage />
    </MemoryRouter>
  )
}

const USER = { id: 'user-1' }

function group(overrides) {
  return {
    id: overrides.id, hostId: 'host-1', hostName: '團主小明', pricePerSeat: 190,
    billingCycle: 'monthly', usedSeats: 1, totalSeats: 2, createdAt: '2026-01-01',
    ...overrides,
  }
}

function sub(overrides) {
  return { id: overrides.id, userId: USER.id, groupId: overrides.groupId, createdAt: '2026-01-01', ...overrides }
}

describe('SubscriptionsPage', () => {
  beforeEach(() => {
    useSubscriptionStore.setState({ subscriptions: [] })
    useGroupStore.setState({ groups: [] })
    useApplicationStore.setState({ applications: [] })
    useMemberStore.setState({ members: [] })
    useAuthStore.setState({ user: USER, loggedIn: true })
  })

  it('沒有任何訂閱或申請時顯示「還沒有加入任何群組」', () => {
    renderSubscriptionsPage()
    expect(screen.getByText('你還沒有加入任何群組')).toBeInTheDocument()
  })

  it('預設顯示「招募中」分頁，groupStatus 為 recruiting 的訂閱會出現', () => {
    useGroupStore.setState({ groups: [group({ id: 'g1', serviceId: 'netflix', serviceName: 'Netflix', planName: '標準（月繳）', status: 'recruiting' })] })
    useSubscriptionStore.setState({ subscriptions: [sub({ id: 's1', groupId: 'g1' })] })

    renderSubscriptionsPage()
    expect(screen.getByText('Netflix')).toBeInTheDocument()
  })

  it('切到「處理中」分頁：顯示 processing 狀態的訂閱，也顯示還沒被審核的申請', () => {
    useGroupStore.setState({
      groups: [
        group({ id: 'g1', serviceId: 'netflix', serviceName: 'Netflix', planName: '標準（月繳）', status: 'recruiting' }),
        group({ id: 'g2', serviceId: 'spotify', serviceName: 'Spotify', planName: 'Duo（月繳）', status: 'confirming' }),
        // ApplicationCard 拿 group.pricePerSeat/billingCycle 顯示金額，找不到對應的群組會直接
        // 整張卡 return null（見 SubscriptionsPage.jsx 的 ApplicationCard 內部邏輯）
        group({ id: 'g3', serviceId: 'disney', serviceName: 'Disney+', planName: '標準（月繳）', status: 'recruiting' }),
      ],
    })
    useSubscriptionStore.setState({
      subscriptions: [
        sub({ id: 's1', groupId: 'g1' }),
        sub({ id: 's2', groupId: 'g2' }), // confirming 且未確認 → processing
      ],
    })
    useApplicationStore.setState({
      applications: [{ id: 'a1', userId: USER.id, groupId: 'g3', status: 'pending', hostName: '團主阿花', createdAt: '2026-01-01' }],
    })

    renderSubscriptionsPage()
    fireEvent.click(screen.getByRole('button', { name: /處理中/ }))

    expect(screen.getByText('Spotify')).toBeInTheDocument()
    expect(screen.getByText('團主審核中')).toBeInTheDocument() // ApplicationCard 的狀態徽章
    expect(screen.queryByText('Netflix')).not.toBeInTheDocument() // 招募中的不該出現在處理中分頁
  })

  it('切到「服務中」分頁：active 狀態、以及自己已確認的 confirming 訂閱都算服務中', () => {
    useGroupStore.setState({
      groups: [
        group({ id: 'g1', serviceId: 'netflix', serviceName: 'Netflix', planName: '標準（月繳）', status: 'active' }),
        group({ id: 'g2', serviceId: 'spotify', serviceName: 'Spotify', planName: 'Duo（月繳）', status: 'confirming' }),
      ],
    })
    useSubscriptionStore.setState({
      subscriptions: [
        sub({ id: 's1', groupId: 'g1' }),
        sub({ id: 's2', groupId: 'g2' }),
      ],
    })
    useMemberStore.setState({
      members: [{ id: 'm1', userId: USER.id, groupId: 'g2', confirmedAt: '2026-01-05' }],
    })

    renderSubscriptionsPage()
    fireEvent.click(screen.getByRole('button', { name: /服務中/ }))

    expect(screen.getByText('Netflix')).toBeInTheDocument()
    expect(screen.getByText('Spotify')).toBeInTheDocument() // 自己已確認，提前算服務中
  })

  it('已加入群組但當前分頁沒有項目時，顯示「此分類目前沒有項目」而不是「還沒加入任何群組」', () => {
    useGroupStore.setState({ groups: [group({ id: 'g1', serviceId: 'netflix', serviceName: 'Netflix', planName: '標準（月繳）', status: 'recruiting' })] })
    useSubscriptionStore.setState({ subscriptions: [sub({ id: 's1', groupId: 'g1' })] })

    renderSubscriptionsPage()
    fireEvent.click(screen.getByRole('button', { name: /服務中/ }))

    expect(screen.getByText('此分類目前沒有項目')).toBeInTheDocument()
  })

  it('已解散/已結束（history 狀態）的訂閱不會出現在任何分頁', () => {
    useGroupStore.setState({
      groups: [
        group({ id: 'g1', serviceId: 'netflix', serviceName: 'Netflix', planName: '標準（月繳）', status: 'recruiting' }),
        group({ id: 'g2', serviceId: 'spotify', serviceName: 'Spotify', planName: 'Duo（月繳）', status: 'cancelled' }),
      ],
    })
    useSubscriptionStore.setState({
      subscriptions: [
        sub({ id: 's1', groupId: 'g1' }),
        sub({ id: 's2', groupId: 'g2' }),
      ],
    })

    renderSubscriptionsPage()
    expect(screen.getByText('Netflix')).toBeInTheDocument()
    expect(screen.queryByText('Spotify')).not.toBeInTheDocument()
  })
})
