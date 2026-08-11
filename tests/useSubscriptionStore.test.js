import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../src/common/api/subscriptionsApi', () => ({
  readAllSubscriptions:    vi.fn(),
  patchSubscription:       vi.fn(),
  deleteSubscriptionRecord: vi.fn(),
}))
vi.mock('../src/common/utils/toast', () => ({
  notifyError: vi.fn(),
}))

const { readAllSubscriptions, patchSubscription, deleteSubscriptionRecord } = await import('../src/common/api/subscriptionsApi')
const { notifyError } = await import('../src/common/utils/toast')
const { useSubscriptionStore } = await import('../src/common/stores/useSubscriptionStore')

const SUB = { id: 's1', groupId: 'g1', userId: 'u1', status: 'pending' }

describe('useSubscriptionStore', () => {
  beforeEach(() => {
    useSubscriptionStore.setState({ subscriptions: [], loading: false, error: null })
    vi.clearAllMocks()
  })

  it('init() 成功時把訂閱放進 state', async () => {
    readAllSubscriptions.mockResolvedValue([SUB])
    await useSubscriptionStore.getState().init()
    expect(useSubscriptionStore.getState().subscriptions).toHaveLength(1)
  })

  it('選取器：getByGroupId／getByUserId／getByUserAndGroup', () => {
    useSubscriptionStore.setState({ subscriptions: [SUB] })
    expect(useSubscriptionStore.getState().getByGroupId('g1')).toHaveLength(1)
    expect(useSubscriptionStore.getState().getByUserId('u1')).toHaveLength(1)
    expect(useSubscriptionStore.getState().getByUserAndGroup('u1', 'g1')?.id).toBe('s1')
    expect(useSubscriptionStore.getState().getByUserAndGroup('u2', 'g1')).toBeNull()
  })

  it('update() 樂觀更新，失敗時回滾', async () => {
    useSubscriptionStore.setState({ subscriptions: [SUB] })
    let rejectFn
    patchSubscription.mockReturnValue(new Promise((_, reject) => { rejectFn = reject }))

    useSubscriptionStore.getState().update('s1', { status: 'active' })
    expect(useSubscriptionStore.getState().getByUserAndGroup('u1', 'g1').status).toBe('active')

    rejectFn(new Error('更新失敗'))
    await vi.waitFor(() => {
      expect(useSubscriptionStore.getState().getByUserAndGroup('u1', 'g1').status).toBe('pending')
    })
    expect(notifyError).toHaveBeenCalled()
  })

  it('activateGroupSubscriptions() 把同群組所有訂閱都設成 active', () => {
    useSubscriptionStore.setState({
      subscriptions: [SUB, { id: 's2', groupId: 'g1', userId: 'u2', status: 'pending' }, { id: 's3', groupId: 'other', userId: 'u3', status: 'pending' }],
    })
    patchSubscription.mockResolvedValue({})

    useSubscriptionStore.getState().activateGroupSubscriptions('g1', '2026-09-01')
    const subs = useSubscriptionStore.getState().subscriptions
    expect(subs.find(s => s.id === 's1').status).toBe('active')
    expect(subs.find(s => s.id === 's2').status).toBe('active')
    expect(subs.find(s => s.id === 's3').status).toBe('pending') // 不同群組不受影響
  })

  it('remove() 樂觀移除，失敗時加回來', async () => {
    useSubscriptionStore.setState({ subscriptions: [SUB] })
    deleteSubscriptionRecord.mockRejectedValue(new Error('刪除失敗'))

    useSubscriptionStore.getState().remove('s1')
    expect(useSubscriptionStore.getState().subscriptions).toHaveLength(0)

    await vi.waitFor(() => {
      expect(useSubscriptionStore.getState().subscriptions).toHaveLength(1)
    })
    expect(notifyError).toHaveBeenCalled()
  })
})
