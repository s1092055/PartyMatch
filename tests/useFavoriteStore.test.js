import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../src/common/api/favoritesApi', () => ({
  readAllFavorites: vi.fn(),
  toggleFavorite:    vi.fn(),
}))
vi.mock('../src/common/utils/toast', () => ({
  notifyError: vi.fn(),
}))

const { readAllFavorites, toggleFavorite } = await import('../src/common/api/favoritesApi')
const { notifyError } = await import('../src/common/utils/toast')
const { useFavoriteStore } = await import('../src/common/stores/useFavoriteStore')

const USER_ID  = 'user-1'
const GROUP_ID = 'group-1'

describe('useFavoriteStore', () => {
  beforeEach(() => {
    useFavoriteStore.setState({ favorites: [], loading: false, error: null })
    vi.clearAllMocks()
  })

  it('init() 成功時把 API 回傳的資料放進 favorites', async () => {
    readAllFavorites.mockResolvedValue([{ id: 'fav-1', userId: USER_ID, groupId: GROUP_ID }])
    await useFavoriteStore.getState().init()
    expect(useFavoriteStore.getState().favorites).toHaveLength(1)
    expect(useFavoriteStore.getState().loading).toBe(false)
  })

  it('init() 失敗時記錄 error，不會讓 loading 卡住', async () => {
    readAllFavorites.mockRejectedValue(new Error('網路錯誤'))
    await useFavoriteStore.getState().init()
    expect(useFavoriteStore.getState().error).toBe('網路錯誤')
    expect(useFavoriteStore.getState().loading).toBe(false)
  })

  it('toggle() 樂觀新增收藏，回傳 true，isFavorited 立刻反映新狀態', () => {
    toggleFavorite.mockResolvedValue({})
    const result = useFavoriteStore.getState().toggle(USER_ID, GROUP_ID)
    expect(result).toBe(true)
    expect(useFavoriteStore.getState().isFavorited(USER_ID, GROUP_ID)).toBe(true)
    expect(toggleFavorite).toHaveBeenCalledWith(GROUP_ID)
  })

  it('toggle() 對已收藏的項目樂觀移除，回傳 false', () => {
    useFavoriteStore.setState({
      favorites: [{ id: 'fav-1', userId: USER_ID, groupId: GROUP_ID, createdAt: '2026-01-01' }],
    })
    toggleFavorite.mockResolvedValue({})
    const result = useFavoriteStore.getState().toggle(USER_ID, GROUP_ID)
    expect(result).toBe(false)
    expect(useFavoriteStore.getState().isFavorited(USER_ID, GROUP_ID)).toBe(false)
  })

  it('新增收藏但後端同步失敗時，樂觀更新要回滾成沒收藏，並跳錯誤提示', async () => {
    let rejectFn
    toggleFavorite.mockReturnValue(new Promise((_, reject) => { rejectFn = reject }))

    useFavoriteStore.getState().toggle(USER_ID, GROUP_ID)
    expect(useFavoriteStore.getState().isFavorited(USER_ID, GROUP_ID)).toBe(true)

    rejectFn(new Error('伺服器錯誤'))
    await vi.waitFor(() => {
      expect(useFavoriteStore.getState().isFavorited(USER_ID, GROUP_ID)).toBe(false)
    })
    expect(notifyError).toHaveBeenCalled()
  })

  it('getByUserId 只回傳指定使用者的收藏', () => {
    useFavoriteStore.setState({
      favorites: [
        { id: 'fav-1', userId: USER_ID, groupId: 'g1' },
        { id: 'fav-2', userId: 'other-user', groupId: 'g2' },
      ],
    })
    expect(useFavoriteStore.getState().getByUserId(USER_ID)).toHaveLength(1)
  })
})
