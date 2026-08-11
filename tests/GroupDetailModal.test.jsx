import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import GroupDetailModal from '../src/features/group/GroupDetailModal'
import { useGroupStore } from '../src/common/stores/useGroupStore'
import { useAuthStore } from '../src/common/stores/useAuthStore'
import { useApplicationStore } from '../src/common/stores/useApplicationStore'
import { useMemberStore } from '../src/common/stores/useMemberStore'
import { useFavoriteStore } from '../src/common/stores/useFavoriteStore'

// 固定成手機版位（false），避免測試結果隨 jsdom 預設視窗寬度（跟桌機門檻 1024px 太接近）飄動；
// 桌機分欄版面是另一組更複雜的排版分支，不在這份測試的範圍內
vi.mock('../src/common/utils/hooks', async (importOriginal) => ({
  ...(await importOriginal()),
  useIsDesktop: () => false,
}))

function renderModal() {
  return render(
    <MemoryRouter>
      <GroupDetailModal />
    </MemoryRouter>
  )
}

function openGroup(groupId) {
  fireEvent(window, new CustomEvent('pm:open-group', { detail: { groupId } }))
}

const GROUP = {
  id: 'g1', hostId: 'host-1', hostName: '團主小明', serviceId: 'netflix', serviceName: 'Netflix',
  planName: '標準（月繳）', pricePerSeat: 190, billingCycle: 'monthly', status: 'recruiting',
  openSeats: 1, totalSeats: 2, usedSeats: 1, hostRating: 95, minCreditScore: 0,
  createdAt: '2026-01-01',
}

describe('GroupDetailModal', () => {
  beforeEach(() => {
    useGroupStore.setState({ groups: [], loading: false, error: null })
    useApplicationStore.setState({ applications: [] })
    useMemberStore.setState({ members: [] })
    useFavoriteStore.setState({ favorites: [] })
    useAuthStore.setState({ user: null, loggedIn: false })
  })

  it('沒有開啟任何群組時不渲染任何內容', () => {
    const { container } = renderModal()
    expect(container).toBeEmptyDOMElement()
  })

  it('收到 pm:open-group 事件後開啟對應群組的詳情', () => {
    useGroupStore.setState({ groups: [GROUP] })
    renderModal()
    openGroup('g1')
    // 服務名稱在同一個 dialog 裡會出現三次（sr-only 的 title/description + 可見的表頭），
    // 用 getAllByText 才不會因為「找到多個符合的元素」報錯
    expect(screen.getAllByText('Netflix').length).toBeGreaterThan(0)
  })

  it('未登入訪客看到的是「登入以加入群組」而不是「申請加入」', () => {
    useGroupStore.setState({ groups: [GROUP] })
    renderModal()
    openGroup('g1')
    expect(screen.getByText('登入以加入群組')).toBeInTheDocument()
    expect(screen.queryByText('申請加入')).not.toBeInTheDocument()
  })

  it('已登入且符合資格的使用者看到「申請加入」', () => {
    useAuthStore.setState({ user: { id: 'user-1', tokenBalance: 1000 }, loggedIn: true })
    useGroupStore.setState({ groups: [GROUP] })
    renderModal()
    openGroup('g1')
    expect(screen.getByText('申請加入')).toBeInTheDocument()
  })

  it('已經是成員時改渲染 MemberGroupView，不是一般訪客版的群組詳情', () => {
    const user = { id: 'user-1' }
    useAuthStore.setState({ user, loggedIn: true })
    // 退出群組只在 recruiting/full（還沒鎖定）時可以，用這個狀態同時驗證兩件事
    useGroupStore.setState({ groups: [{ ...GROUP, status: 'recruiting' }] })
    useMemberStore.setState({ members: [{ id: 'm1', userId: user.id, groupId: 'g1' }] })

    renderModal()
    openGroup('g1')
    expect(screen.getByText('退出群組')).toBeInTheDocument()
    expect(screen.queryByText('申請加入')).not.toBeInTheDocument()
  })

  it('團主看自己的群組不會顯示「申請加入」（不能申請自己的群組）', () => {
    const host = { id: 'host-1' }
    useAuthStore.setState({ user: host, loggedIn: true })
    useGroupStore.setState({ groups: [GROUP] })
    renderModal()
    openGroup('g1')
    expect(screen.queryByText('申請加入')).not.toBeInTheDocument()
    expect(screen.queryByText('登入以加入群組')).not.toBeInTheDocument()
  })

  it('點擊收藏愛心會切換 useFavoriteStore 的收藏狀態', () => {
    const user = { id: 'user-1', tokenBalance: 1000 }
    useAuthStore.setState({ user, loggedIn: true })
    useGroupStore.setState({ groups: [GROUP] })
    renderModal()
    openGroup('g1')

    expect(useFavoriteStore.getState().isFavorited(user.id, 'g1')).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: '加入收藏' }))
    expect(useFavoriteStore.getState().isFavorited(user.id, 'g1')).toBe(true)
  })

  it('點擊關閉按鈕會關閉 modal', () => {
    useGroupStore.setState({ groups: [GROUP] })
    renderModal()
    openGroup('g1')
    expect(screen.getAllByText('Netflix').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: '關閉' }))
    expect(screen.queryAllByText('Netflix')).toHaveLength(0)
  })

  it('已登入使用者看到額滿的群組時不會顯示「申請加入」', () => {
    // 未登入訪客一律看到「登入以加入群組」，不管群組滿不滿——這是刻意設計（訪客要先登入
    // 才會知道實際名額狀態），額滿真正該擋下的是已登入、原本符合資格的使用者
    useAuthStore.setState({ user: { id: 'user-1', tokenBalance: 1000 }, loggedIn: true })
    useGroupStore.setState({ groups: [{ ...GROUP, openSeats: 0, status: 'full' }] })
    renderModal()
    openGroup('g1')
    expect(screen.queryByText('申請加入')).not.toBeInTheDocument()
  })
})
