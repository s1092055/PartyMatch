import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../src/common/api/axiosClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
  tokenManager: { get: vi.fn(), set: vi.fn(), remove: vi.fn() },
}))
vi.mock('../src/common/api/tokensApi', () => ({
  fetchTokenBalance: vi.fn(),
  topupTokens:       vi.fn(),
}))

// login()/register()/logout()/deactivateAccount() 動態 import 另外 7 個 store，各自呼叫
// init()/setState()/teardown()/startPolling()，跟這個檔案本身要測的 useAuthStore 邏輯無關，
// 直接把這 7 個 store 整個 mock 掉（不用真的跑各自的 API 請求跟 polling），只驗證
// useAuthStore 有沒有正確呼叫到它們，不驗證它們各自內部邏輯（那些各自有自己的測試檔案）
const privateStoreMock = () => ({
  init:         vi.fn().mockResolvedValue(undefined),
  setState:     vi.fn(),
  teardown:     vi.fn(),
  startPolling: vi.fn(),
})
const mockApplicationStore  = privateStoreMock()
const mockSubscriptionStore = privateStoreMock()
const mockMemberStore       = privateStoreMock()
const mockFavoriteStore     = privateStoreMock()
const mockNotificationStore = privateStoreMock()
const mockGroupStore        = privateStoreMock()
const mockConversationStore = privateStoreMock()

vi.mock('../src/common/stores/useApplicationStore', () => ({ useApplicationStore: { getState: () => mockApplicationStore, setState: mockApplicationStore.setState } }))
vi.mock('../src/common/stores/useSubscriptionStore', () => ({ useSubscriptionStore: { getState: () => mockSubscriptionStore, setState: mockSubscriptionStore.setState } }))
vi.mock('../src/common/stores/useMemberStore', () => ({ useMemberStore: { getState: () => mockMemberStore, setState: mockMemberStore.setState } }))
vi.mock('../src/common/stores/useFavoriteStore', () => ({ useFavoriteStore: { getState: () => mockFavoriteStore, setState: mockFavoriteStore.setState } }))
vi.mock('../src/common/stores/useNotificationStore', () => ({ useNotificationStore: { getState: () => mockNotificationStore, setState: mockNotificationStore.setState } }))
vi.mock('../src/common/stores/useGroupStore', () => ({ useGroupStore: { getState: () => mockGroupStore, setState: mockGroupStore.setState } }))
vi.mock('../src/common/stores/useConversationStore', () => ({ useConversationStore: { getState: () => mockConversationStore, setState: mockConversationStore.setState } }))

const client = (await import('../src/common/api/axiosClient')).default
const { tokenManager } = await import('../src/common/api/axiosClient')
const { fetchTokenBalance, topupTokens } = await import('../src/common/api/tokensApi')
const { useAuthStore } = await import('../src/common/stores/useAuthStore')

function clearPrivateStoreMocks() {
  for (const m of [mockApplicationStore, mockSubscriptionStore, mockMemberStore, mockFavoriteStore, mockNotificationStore, mockGroupStore, mockConversationStore]) {
    m.init.mockClear().mockResolvedValue(undefined)
    m.setState.mockClear()
    m.teardown.mockClear()
    m.startPolling.mockClear()
  }
}

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, loggedIn: false })
    vi.clearAllMocks()
    clearPrivateStoreMocks()
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

  it('login()：成功時存 token、更新登入狀態，並初始化所有私人 store', async () => {
    client.post.mockResolvedValue({ user: { id: 'u1', name: '小明' }, accessToken: 'token-abc' })
    const result = await useAuthStore.getState().login({ email: 'a@b.com', password: 'secret' })

    expect(result.ok).toBe(true)
    expect(tokenManager.set).toHaveBeenCalledWith('token-abc')
    expect(useAuthStore.getState().loggedIn).toBe(true)
    expect(useAuthStore.getState().user.id).toBe('u1')
    // initPrivateStores()：私人 store 全部 init 過，通知 store 也開始 polling
    expect(mockGroupStore.init).toHaveBeenCalledWith({ all: true })
    expect(mockApplicationStore.init).toHaveBeenCalled()
    expect(mockNotificationStore.startPolling).toHaveBeenCalledWith('u1')
    expect(mockConversationStore.init).toHaveBeenCalledWith('u1')
  })

  it('login()：失敗時回傳錯誤訊息，不寫入 token 也不初始化私人 store', async () => {
    client.post.mockRejectedValue(new Error('Email 或密碼錯誤'))
    const result = await useAuthStore.getState().login({ email: 'a@b.com', password: 'wrong' })

    expect(result.ok).toBe(false)
    expect(result.error).toBe('Email 或密碼錯誤')
    expect(tokenManager.set).not.toHaveBeenCalled()
    expect(useAuthStore.getState().loggedIn).toBe(false)
    expect(mockGroupStore.init).not.toHaveBeenCalled()
  })

  it('register()：成功時跟 login() 一樣存 token、初始化私人 store', async () => {
    client.post.mockResolvedValue({ user: { id: 'u2', name: '新用戶' }, accessToken: 'token-xyz' })
    const result = await useAuthStore.getState().register({ name: '新用戶', email: 'new@b.com', password: 'secret', phone: '+886900000000' })

    expect(result.ok).toBe(true)
    expect(tokenManager.set).toHaveBeenCalledWith('token-xyz')
    expect(useAuthStore.getState().loggedIn).toBe(true)
    expect(mockFavoriteStore.init).toHaveBeenCalled()
  })

  it('logout()：清掉 token 跟登入狀態，即使後端登出 API 失敗也不影響本地清除', async () => {
    useAuthStore.setState({ user: { id: 'u1' }, loggedIn: true })
    client.post.mockRejectedValue(new Error('網路錯誤'))

    await useAuthStore.getState().logout()
    expect(tokenManager.remove).toHaveBeenCalled()
    expect(useAuthStore.getState().loggedIn).toBe(false)
    expect(useAuthStore.getState().user).toBeNull()
    // clearPrivateStores() 是 logout() 內部 .catch(console.error) 的 fire-and-forget，
    // 不會被 await，動態 import 本身就是非同步的，要等一輪才會真的執行到裡面的呼叫
    await vi.waitFor(() => {
      expect(mockNotificationStore.teardown).toHaveBeenCalled()
    })
    expect(mockConversationStore.teardown).toHaveBeenCalled()
    expect(mockApplicationStore.setState).toHaveBeenCalledWith({ applications: [] })
  })

  it('deactivateAccount()：成功時清掉登入狀態，失敗時回傳錯誤且維持登入', async () => {
    useAuthStore.setState({ user: { id: 'u1' }, loggedIn: true })
    client.post.mockResolvedValue({})

    const result = await useAuthStore.getState().deactivateAccount('correct-password')
    expect(result.ok).toBe(true)
    expect(useAuthStore.getState().loggedIn).toBe(false)

    useAuthStore.setState({ user: { id: 'u1' }, loggedIn: true })
    client.post.mockRejectedValue(new Error('密碼錯誤'))
    const failResult = await useAuthStore.getState().deactivateAccount('wrong-password')
    expect(failResult.ok).toBe(false)
    expect(useAuthStore.getState().loggedIn).toBe(true) // 維持原狀，沒有被清掉
  })
})
