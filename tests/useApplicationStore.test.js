import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../src/common/api/applicationsApi', () => ({
  readAllApplications: vi.fn(),
  insertApplication:   vi.fn(),
  patchApplication:    vi.fn(),
  deleteApplication:   vi.fn(),
}))
vi.mock('../src/common/api/tokensApi', () => ({
  fetchTokenBalance: vi.fn().mockResolvedValue({ tokenBalance: 0 }),
  topupTokens:       vi.fn(),
}));

const { insertApplication, deleteApplication } = await import('../src/common/api/applicationsApi')
const { useApplicationStore } = await import('../src/common/stores/useApplicationStore')
const { useMemberStore } = await import('../src/common/stores/useMemberStore')
const { useSubscriptionStore } = await import('../src/common/stores/useSubscriptionStore')

const USER_ID  = 'user-1'
const GROUP_ID = 'group-1'
const HOST_ID  = 'host-1'

describe('useApplicationStore', () => {
  beforeEach(() => {
    useApplicationStore.setState({ applications: [], loading: false, error: null })
    useMemberStore.setState({ members: [] })
    useSubscriptionStore.setState({ subscriptions: [] })
    vi.clearAllMocks()
  })

  it('選取器：getByGroupId／getByUserId／getByUserAndGroup／getByHostId', () => {
    useApplicationStore.setState({
      applications: [
        { id: 'a1', groupId: GROUP_ID, userId: USER_ID, hostId: HOST_ID, createdAt: '2026-01-01' },
        { id: 'a2', groupId: 'other-group', userId: USER_ID, hostId: 'other-host', createdAt: '2026-01-02' },
      ],
    })
    expect(useApplicationStore.getState().getByGroupId(GROUP_ID)).toHaveLength(1)
    expect(useApplicationStore.getState().getByUserId(USER_ID)).toHaveLength(2)
    expect(useApplicationStore.getState().getByUserAndGroup(USER_ID, GROUP_ID)?.id).toBe('a1')
    expect(useApplicationStore.getState().getByUserAndGroup('nobody', GROUP_ID)).toBeNull()

    const groups = [{ id: GROUP_ID, hostId: HOST_ID }, { id: 'other-group', hostId: 'other-host' }]
    expect(useApplicationStore.getState().getByHostId(HOST_ID, groups)).toHaveLength(1)
  })

  it('create() 未登入時丟錯誤，不會呼叫 API', async () => {
    await expect(useApplicationStore.getState().create({ groupId: GROUP_ID }, null))
      .rejects.toThrow('登入後才能申請加入群組')
    expect(insertApplication).not.toHaveBeenCalled()
  })

  it('create() 成功後把申請加進 state，用後端回傳的真實 id', async () => {
    insertApplication.mockResolvedValue({ id: 'server-app-id' })
    const activeUser = { id: USER_ID, displayName: '小明', creditScore: 90 }

    const app = await useApplicationStore.getState().create({ groupId: GROUP_ID, message: '請多指教' }, activeUser)
    expect(app.id).toBe('server-app-id')
    expect(useApplicationStore.getState().applications).toHaveLength(1)
    expect(useApplicationStore.getState().applications[0].status).toBe('pending')
    expect(insertApplication).toHaveBeenCalledWith({ groupId: GROUP_ID, message: '請多指教' })
  })

  it('create() 失敗時完全不寫入 state（不像 group/favorite store 有樂觀新增）', async () => {
    insertApplication.mockRejectedValue(new Error('餘額不足'))
    const activeUser = { id: USER_ID, displayName: '小明' }

    await expect(useApplicationStore.getState().create({ groupId: GROUP_ID }, activeUser))
      .rejects.toThrow('餘額不足')
    expect(useApplicationStore.getState().applications).toHaveLength(0)
  })

  it('cancel() 樂觀把狀態改成 cancelled，成功後維持', async () => {
    useApplicationStore.setState({ applications: [{ id: 'a1', groupId: GROUP_ID, userId: USER_ID, status: 'pending' }] })
    deleteApplication.mockResolvedValue({})

    await useApplicationStore.getState().cancel('a1')
    expect(useApplicationStore.getState().applications[0].status).toBe('cancelled')
  })
})
