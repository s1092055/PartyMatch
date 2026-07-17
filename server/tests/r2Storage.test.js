import { describe, it, expect } from 'vitest'
import { getSignedDownloadUrl } from '../src/lib/r2Storage.js'

describe('r2Storage.getSignedDownloadUrl', () => {
  it('已經是完整網址時原樣回傳，不簽章', async () => {
    const url = 'https://picsum.photos/seed/dispute1/600/400'
    await expect(getSignedDownloadUrl(url)).resolves.toBe(url)
  })

  it('null/undefined 回傳 null', async () => {
    await expect(getSignedDownloadUrl(null)).resolves.toBeNull()
    await expect(getSignedDownloadUrl(undefined)).resolves.toBeNull()
  })

  it('純 key（不含 http 前綴）會被簽成一個帶有 X-Amz-Signature 的網址', async () => {
    const signed = await getSignedDownloadUrl('partymatch/dispute-evidence/test.png')
    expect(signed).toContain('partymatch/dispute-evidence/test.png')
    expect(signed).toContain('X-Amz-Signature')
  })
});
