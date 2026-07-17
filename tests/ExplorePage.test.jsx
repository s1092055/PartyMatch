import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ExplorePage from '../src/features/explore/ExplorePage'
import { useGroupStore } from '../src/common/stores/useGroupStore'
import { useAuthStore } from '../src/common/stores/useAuthStore'
import { useApplicationStore } from '../src/common/stores/useApplicationStore'
import { useMemberStore } from '../src/common/stores/useMemberStore'
import { useFavoriteStore } from '../src/common/stores/useFavoriteStore'

function renderExplorePage() {
  return render(
    <MemoryRouter>
      <ExplorePage />
    </MemoryRouter>
  )
}

const RECRUITING_GROUP = {
  id: 'g1', hostId: 'host-1', hostName: '團主小明', serviceId: 'netflix', serviceName: 'Netflix',
  planName: '標準（月繳）', pricePerSeat: 190, billingCycle: 'monthly', status: 'recruiting',
  openSeats: 1, totalSeats: 2, usedSeats: 1, hostRating: 95, minCreditScore: 0,
  createdAt: '2026-01-01',
}

describe('ExplorePage', () => {
  beforeEach(() => {
    useGroupStore.setState({ groups: [], loading: false, error: null })
    useApplicationStore.setState({ applications: [] })
    useMemberStore.setState({ members: [] })
    useFavoriteStore.setState({ favorites: [] })
    useAuthStore.setState({ user: null, loggedIn: false })
  })

  it('顯示招募中且有名額的群組卡片', () => {
    useGroupStore.setState({ groups: [RECRUITING_GROUP] })
    renderExplorePage()
    expect(screen.getByText('Netflix')).toBeInTheDocument()
    expect(screen.getByText('團主小明')).toBeInTheDocument()
  })

  it('額滿的群組（自己不是成員）不會顯示', () => {
    useGroupStore.setState({ groups: [{ ...RECRUITING_GROUP, id: 'g2', status: 'full', openSeats: 0 }] })
    renderExplorePage()
    expect(screen.queryByText('Netflix')).not.toBeInTheDocument()
  })

  it('沒有符合條件的群組時顯示空狀態', () => {
    renderExplorePage()
    expect(screen.getByText(/尚無|沒有|找不到/)).toBeInTheDocument()
  })

  it('登入使用者自己主持的群組不會出現在探索列表', () => {
    useAuthStore.setState({ user: { id: 'host-1' }, loggedIn: true })
    useGroupStore.setState({ groups: [RECRUITING_GROUP] })
    renderExplorePage()
    expect(screen.queryByText('Netflix')).not.toBeInTheDocument()
  })
})
