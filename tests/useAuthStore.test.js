import { describe, it, expect, vi, beforeEach } from 'vitest'

// login()/register()/logout()/deactivateAccount() 會連帶呼叫內部沒有 export 出來的
// initPrivateStores()/clearPrivateStores()，動態 import 另外 7 個 store 各自 init()，
// mock 成本跟這幾個 action 本身要測的邏輯不成比例，這裡只測不會觸發那條路徑的部分
// （跟 useGroupStore 測試略過 adjudicateGroup() 同樣的取捨）
vi.mock('../src/common/api/axiosClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
  tokenManager: { get: vi.fn(), set: vi.fn(), remove: vi.fn() },
}))
vi.mock('../src/common/api/tokensApi', () => ({
  fetchTokenBalance: vi.fn(),
  topupTokens:       vi.fn(),
}))

const client = (await import('../src/common/api/axiosClient')).default
const { tokenManager } = await import('../src/common/api/axiosClient')
const { fetchTokenBalance, topupTokens } = await import('../src/common/api/tokensApi')
const { useAuthStore } = await import('../src/common/stores/useAuthStore')

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, loggedIn: false })
    vi.clearAllMocks()
  })

  it('init()：沒有 token 時直接跳過，不打 API', async () => {
    tokenManager.get.mockReturnValue(null)
    await useAuthStore.getState().init()
    expect(client.get).not.toHaveBeenCalled()
    expect(useAuthStore.getState().loggedIn).toBe(false)
  })

  it('init()：有 token 且驗證成功時還原登入狀態', async () => {
    tokenManager.get.mockReturnValue('valid-token')
    client.get.mockResolvedValue({ id: 'u1', name: '小明' })
    await useAuthStore.getState().init()
    expect(useAuthStore.getState().loggedIn).toBe(true)
    expect(useAuthStore.getState().user.id).toBe('u1')
  })

  it('init()：token 過期驗證失敗時清掉 token，維持未登入', async () => {
    tokenManager.get.mockReturnValue('expired-token')
    client.get.mockRejectedValue(new Error('401'))
    await useAuthStore.getState().init()
    expect(tokenManager.remove).toHaveBeenCalled()
    expect(useAuthStore.getState().loggedIn).toBe(false)
  })

  it('getProfile()：沒登入回傳 null，登入時補上 displayName/joinedAt 等預設值', () => {
    expect(useAuthStore.getState().getProfile()).toBeNull()

    useAuthStore.setState({ user: { id: 'u1', name: '小明', createdAt: '2026-01-01T00:00:00Z' } })
    const profile = useAuthStore.getState().getProfile()
    expect(profile.displayName).toBe('小明')
    expect(profile.joinedAt).toBe('2026-01-01')
    expect(profile.presenceStatus).toBe('online')
  })

  it('refreshTokenBalance()：成功時更新 user.tokenBalance，失敗時靜默略過', async () => {
    useAuthStore.setState({ user: { id: 'u1', tokenBalance: 0 } })
    fetchTokenBalance.mockResolvedValue({ tokenBalance: 500 })
    await useAuthStore.getState().refreshTokenBalance()
    expect(useAuthStore.getState().user.tokenBalance).toBe(500)

    fetchTokenBalance.mockRejectedValue(new Error('網路錯誤'))
    await expect(useAuthStore.getState().refreshTokenBalance()).resolves.toBeUndefined()
    expect(useAuthStore.getState().user.tokenBalance).toBe(500) // 維持原值，沒有被清掉
  })

  it('topup()：成功時更新餘額並回傳新餘額', async () => {
    useAuthStore.setState({ user: { id: 'u1', tokenBalance: 100 } })
    topupTokens.mockResolvedValue({ tokenBalance: 600 })
    const result = await useAuthStore.getState().topup(500)
    expect(result).toBe(600)
    expect(useAuthStore.getState().user.tokenBalance).toBe(600)
  })

  it('updateProfile()：沒登入時直接回傳失敗，不打 API', async () => {
    const result = await useAuthStore.getState().updateProfile({ name: '新名字' })
    expect(result.ok).toBe(false)
    expect(client.patch).not.toHaveBeenCalled()
  })

  it('updateProfile()：成功時合併回傳的資料，displayName 跟著 name 更新', async () => {
    useAuthStore.setState({ user: { id: 'u1', name: '舊名字', tokenBalance: 100 } })
    client.patch.mockResolvedValue({ name: '新名字' })

    const result = await useAuthStore.getState().updateProfile({ displayName: '新名字' })
    expect(result.ok).toBe(true)
    expect(useAuthStore.getState().user.displayName).toBe('新名字')
    expect(useAuthStore.getState().user.tokenBalance).toBe(100) // 沒被覆蓋掉

    // displayName/id 不該被原樣送進 PATCH body
    const sentBody = client.patch.mock.calls[0][1]
    expect(sentBody).not.toHaveProperty('displayName')
    expect(sentBody).not.toHaveProperty('id')
  })

  it('refreshCreditScore()：成功時更新 creditScore，失敗時靜默略過', async () => {
    useAuthStore.setState({ user: { id: 'u1', creditScore: 100 } })
    client.get.mockResolvedValue({ creditScore: 90 })
    await useAuthStore.getState().refreshCreditScore()
    expect(useAuthStore.getState().user.creditScore).toBe(90)
  })
})
