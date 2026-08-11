import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import FavoritesPage from '../src/features/favorites/FavoritesPage'
import { useGroupStore } from '../src/common/stores/useGroupStore'
import { useAuthStore } from '../src/common/stores/useAuthStore'
import { useFavoriteStore } from '../src/common/stores/useFavoriteStore'
import { useMemberStore } from '../src/common/stores/useMemberStore'

function renderFavoritesPage() {
  return render(
    <MemoryRouter>
      <FavoritesPage />
    </MemoryRouter>
  )
}

const USER = { id: 'user-1' }
const GROUP = {
  id: 'g1', hostId: 'host-1', hostName: '團主小明', serviceId: 'netflix', serviceName: 'Netflix',
  planName: '標準（月繳）', pricePerSeat: 190, billingCycle: 'monthly', status: 'recruiting',
  openSeats: 1, totalSeats: 2, usedSeats: 1, hostRating: 95, minCreditScore: 0,
  createdAt: '2026-01-01',
}

describe('FavoritesPage', () => {
  beforeEach(() => {
    useGroupStore.setState({ groups: [], loading: false, error: null })
    useFavoriteStore.setState({ favorites: [] })
    useMemberStore.setState({ members: [] })
    useAuthStore.setState({ user: null, loggedIn: false })
  })

  it('未登入時顯示空狀態', () => {
    renderFavoritesPage()
    expect(screen.getByText('尚無收藏群組')).toBeInTheDocument()
  })

  it('已收藏且招募中有名額的群組會顯示卡片', () => {
    useAuthStore.setState({ user: USER, loggedIn: true })
    useGroupStore.setState({ groups: [GROUP] })
    useFavoriteStore.setState({ favorites: [{ id: 'f1', userId: USER.id, groupId: GROUP.id }] })

    renderFavoritesPage()
    expect(screen.getByText('Netflix')).toBeInTheDocument()
    expect(screen.queryByText('尚無收藏群組')).not.toBeInTheDocument()
  })

  it('收藏的群組已經額滿時不顯示（即使還在收藏清單裡）', () => {
    useAuthStore.setState({ user: USER, loggedIn: true })
    useGroupStore.setState({ groups: [{ ...GROUP, status: 'full', openSeats: 0 }] })
    useFavoriteStore.setState({ favorites: [{ id: 'f1', userId: USER.id, groupId: GROUP.id }] })

    renderFavoritesPage()
    expect(screen.getByText('尚無收藏群組')).toBeInTheDocument()
  })

  it('只顯示目前登入使用者自己的收藏，不會顯示別人的', () => {
    useAuthStore.setState({ user: USER, loggedIn: true })
    useGroupStore.setState({ groups: [GROUP] })
    useFavoriteStore.setState({ favorites: [{ id: 'f1', userId: 'other-user', groupId: GROUP.id }] })

    renderFavoritesPage()
    expect(screen.getByText('尚無收藏群組')).toBeInTheDocument()
  })
})
