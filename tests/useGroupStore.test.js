import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../src/common/api/groupsApi', () => ({
  readAllGroups:     vi.fn(),
  insertGroup:       vi.fn(),
  fetchGroupById:    vi.fn(),
  patchGroup:        vi.fn(),
  lockGroupApi:          vi.fn(),
  activateGroupApi:      vi.fn(),
  confirmGroupApi:       vi.fn(),
  cancelGroupApi:        vi.fn(),
  disputeGroupApi:       vi.fn(),
  adjudicateGroupApi:    vi.fn(),
  resolveDisputeApi:     vi.fn(),
  renewGroupApi:         vi.fn(),
  adjustBillingDateApi:  vi.fn(),
}))
vi.mock('../src/common/utils/toast', () => ({
  notifyError: vi.fn(),
}))

const { readAllGroups, insertGroup, patchGroup } = await import('../src/common/api/groupsApi')
const { notifyError } = await import('../src/common/utils/toast')
const { useGroupStore } = await import('../src/common/stores/useGroupStore')

const baseGroup = {
  id: 'group-1', hostId: 'host-1', serviceId: 'netflix', status: 'recruiting',
  maxMembers: 4, currentMembers: 1, monthlyFee: 300, billingCycle: 'monthly',
}

describe('useGroupStore', () => {
  beforeEach(() => {
    useGroupStore.setState({ groups: [], loading: false, error: null })
    vi.clearAllMocks()
  })

  it('init() 成功時把群組放進 state 並正規化', async () => {
    readAllGroups.mockResolvedValue([baseGroup])
    await useGroupStore.getState().init()
    expect(useGroupStore.getState().groups).toHaveLength(1)
    expect(useGroupStore.getState().groups[0].id).toBe('group-1')
    expect(readAllGroups).toHaveBeenCalledWith({ status: 'recruiting' })
  })

  it('init({ all: true }) 會用 status: all 呼叫 API', async () => {
    readAllGroups.mockResolvedValue([])
    await useGroupStore.getState().init({ all: true })
    expect(readAllGroups).toHaveBeenCalledWith({ status: 'all' })
  })

  it('init() 失敗時記錄 error', async () => {
    readAllGroups.mockRejectedValue(new Error('連線失敗'))
    await useGroupStore.getState().init()
    expect(useGroupStore.getState().error).toBe('連線失敗')
    expect(useGroupStore.getState().loading).toBe(false)
  })

  it('選取器：getById／getByHostId／getRecruiting', () => {
    useGroupStore.setState({
      groups: [
        { ...baseGroup, id: 'g1', hostId: 'host-a', status: 'recruiting' },
        { ...baseGroup, id: 'g2', hostId: 'host-a', status: 'active' },
        { ...baseGroup, id: 'g3', hostId: 'host-b', status: 'recruiting' },
      ],
    })
    expect(useGroupStore.getState().getById('g2').id).toBe('g2')
    expect(useGroupStore.getState().getById('missing')).toBeNull()
    expect(useGroupStore.getState().getByHostId('host-a')).toHaveLength(2)
    expect(useGroupStore.getState().getRecruiting().map(g => g.id).sort()).toEqual(['g1', 'g3'])
  })

  it('create() 樂觀新增群組到 state，未登入時丟錯誤', () => {
    expect(() => useGroupStore.getState().create({ serviceId: 'netflix' }, null)).toThrow('登入後才能建立群組')
  })

  it('create() 成功後用後端回傳的資料覆蓋本地暫存的群組', async () => {
    insertGroup.mockResolvedValue({ ...baseGroup, id: 'server-id' })
    const host = { id: 'host-1', displayName: '團主', creditScore: 100 }
    const created = useGroupStore.getState().create({ serviceId: 'netflix', totalSeats: 4 }, host)

    expect(useGroupStore.getState().groups).toHaveLength(1)
    expect(useGroupStore.getState().groups[0].id).toBe(created.id);

    await vi.waitFor(() => {
      expect(useGroupStore.getState().groups[0].id).toBe('server-id')
    })
  })

  it('create() 失敗時把樂觀新增的群組移除', async () => {
    insertGroup.mockRejectedValue(new Error('建立失敗'))
    const host = { id: 'host-1', displayName: '團主', creditScore: 100 }
    useGroupStore.getState().create({ serviceId: 'netflix', totalSeats: 4 }, host)

    expect(useGroupStore.getState().groups).toHaveLength(1)
    await vi.waitFor(() => {
      expect(useGroupStore.getState().groups).toHaveLength(0)
    })
    expect(notifyError).toHaveBeenCalled()
  })

  it('update() 樂觀更新，成功時維持新值', async () => {
    useGroupStore.setState({ groups: [baseGroup] })
    patchGroup.mockResolvedValue({})

    useGroupStore.getState().update('group-1', { billingCycle: 'yearly' })
    expect(useGroupStore.getState().getById('group-1').billingCycle).toBe('yearly')
    expect(patchGroup).toHaveBeenCalledWith('group-1', { billingCycle: 'yearly' })
  })

  it('update() 後端失敗時回滾成原本的值', async () => {
    useGroupStore.setState({ groups: [baseGroup] })
    let rejectFn
    patchGroup.mockReturnValue(new Promise((_, reject) => { rejectFn = reject }))

    useGroupStore.getState().update('group-1', { billingCycle: 'yearly' })
    expect(useGroupStore.getState().getById('group-1').billingCycle).toBe('yearly')

    rejectFn(new Error('更新失敗'))
    await vi.waitFor(() => {
      expect(useGroupStore.getState().getById('group-1').billingCycle).toBe('monthly')
    })
    expect(notifyError).toHaveBeenCalled()
  })
})
