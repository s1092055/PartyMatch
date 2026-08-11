import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ManageGroupsPage from '../src/features/manage-groups/ManageGroupsPage'
import { useGroupStore } from '../src/common/stores/useGroupStore'
import { useAuthStore } from '../src/common/stores/useAuthStore'
import { useApplicationStore } from '../src/common/stores/useApplicationStore'
import { useMemberStore } from '../src/common/stores/useMemberStore'

function renderManageGroupsPage() {
  return render(
    <MemoryRouter>
      <ManageGroupsPage />
    </MemoryRouter>
  )
}

const HOST = { id: 'host-1' }

function hostedGroup(overrides) {
  return {
    hostId: HOST.id, planName: '標準（月繳）', pricePerSeat: 190, billingCycle: 'monthly',
    maxMembers: 4, currentMembers: 1, usedSeats: 1, openSeats: 3, createdAt: '2026-01-01',
    ...overrides,
  }
}

describe('ManageGroupsPage', () => {
  beforeEach(() => {
    useGroupStore.setState({ groups: [], loading: false, error: null })
    useApplicationStore.setState({ applications: [] })
    useMemberStore.setState({ members: [] })
    useAuthStore.setState({ user: HOST, loggedIn: true })
  })

  it('團主還沒建立任何群組時顯示對應空狀態', () => {
    renderManageGroupsPage()
    expect(screen.getByText('你還沒有建立任何群組')).toBeInTheDocument()
  })

  it('預設顯示「招募中」分頁，招募中的群組會出現', () => {
    useGroupStore.setState({ groups: [hostedGroup({ id: 'g1', serviceId: 'netflix', serviceName: 'Netflix', status: 'recruiting' })] })
    renderManageGroupsPage()
    expect(screen.getByText('Netflix')).toBeInTheDocument()
  })

  it('有群組但當前分頁沒有符合的群組時，顯示「此分類目前沒有群組」', () => {
    useGroupStore.setState({ groups: [hostedGroup({ id: 'g1', serviceId: 'netflix', serviceName: 'Netflix', status: 'active' })] })
    renderManageGroupsPage()
    expect(screen.getByText('此分類目前沒有群組')).toBeInTheDocument()
  })

  it('切到「處理中」分頁，只顯示 processing 狀態的群組', () => {
    useGroupStore.setState({
      groups: [
        hostedGroup({ id: 'g1', serviceId: 'netflix', serviceName: 'Netflix', status: 'recruiting' }),
        hostedGroup({ id: 'g2', serviceId: 'spotify', serviceName: 'Spotify', status: 'pending_confirmation' }),
      ],
    })
    renderManageGroupsPage()
    fireEvent.click(screen.getByRole('button', { name: /處理中/ }))

    expect(screen.getByText('Spotify')).toBeInTheDocument()
    expect(screen.queryByText('Netflix')).not.toBeInTheDocument()
  })

  it('已解散/已結束的群組不會出現在任何分頁（要透過群組紀錄查看）', () => {
    useGroupStore.setState({
      groups: [
        hostedGroup({ id: 'g1', serviceId: 'netflix', serviceName: 'Netflix', status: 'recruiting' }),
        hostedGroup({ id: 'g2', serviceId: 'spotify', serviceName: 'Spotify', status: 'cancelled' }),
      ],
    })
    renderManageGroupsPage()

    expect(screen.getByText('Netflix')).toBeInTheDocument()
    expect(screen.queryByText('Spotify')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /處理中/ }))
    expect(screen.queryByText('Spotify')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /服務中/ }))
    expect(screen.queryByText('Spotify')).not.toBeInTheDocument()
  })

  it('別人主持的群組不會出現在自己的群組管理列表', () => {
    useGroupStore.setState({
      groups: [hostedGroup({ id: 'g1', hostId: 'other-host', serviceId: 'netflix', serviceName: 'Netflix', status: 'recruiting' })],
    })
    renderManageGroupsPage()
    expect(screen.getByText('你還沒有建立任何群組')).toBeInTheDocument()
  })
})
