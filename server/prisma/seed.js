import 'dotenv/config'
import prisma from '../src/lib/prisma.js'

export const SERVICES = [
  { id: 'spotify',          name: 'Spotify',        category: '音樂', plans: [{ id: 'spotify-family', name: '家庭方案（月繳）', maxMembers: 6, monthlyFee: 298, currency: 'TWD' }, { id: 'spotify-duo', name: 'Duo（月繳）', maxMembers: 2, monthlyFee: 228, currency: 'TWD' }] },
  { id: 'youtube',          name: 'YouTube',        category: '影音', plans: [{ id: 'youtube-family', name: '家庭方案（月繳）', maxMembers: 6, monthlyFee: 479, currency: 'TWD' }] },
  { id: 'netflix',          name: 'Netflix',        category: '影音', plans: [{ id: 'netflix-std', name: '標準（月繳）', maxMembers: 2, monthlyFee: 380, currency: 'TWD' }, { id: 'netflix-4k', name: '高級（4K）（月繳）', maxMembers: 4, monthlyFee: 460, currency: 'TWD' }] },
  { id: 'disney',           name: 'Disney+',        category: '影音', plans: [{ id: 'disney-std-monthly', name: '標準（月繳）', maxMembers: 2, monthlyFee: 285, currency: 'TWD' }, { id: 'disney-std-yearly', name: '標準（年繳）', maxMembers: 2, monthlyFee: 233, currency: 'TWD' }, { id: 'disney-premium-monthly', name: '高級（月繳）', maxMembers: 4, monthlyFee: 335, currency: 'TWD' }, { id: 'disney-premium-yearly', name: '高級（年繳）', maxMembers: 4, monthlyFee: 273, currency: 'TWD' }] },
  { id: 'google-one',       name: 'Google One',     category: '套組', plans: [{ id: 'google-one-100-monthly', name: '100 GB（月繳）', maxMembers: 5, monthlyFee: 65, currency: 'TWD' }, { id: 'google-one-100-yearly', name: '100 GB（年繳）', maxMembers: 5, monthlyFee: 55, currency: 'TWD' }, { id: 'google-one-ai-plus-monthly', name: 'AI Plus（400GB）（月繳）', maxMembers: 5, monthlyFee: 165, currency: 'TWD' }, { id: 'google-one-ai-plus-yearly', name: 'AI Plus（400GB）（年繳）', maxMembers: 5, monthlyFee: 165, currency: 'TWD' }, { id: 'google-one-ai-plus-2tb-monthly', name: 'AI Plus（2 TB）（月繳）', maxMembers: 5, monthlyFee: 330, currency: 'TWD' }, { id: 'google-one-ai-plus-2tb-yearly', name: 'AI Plus（2 TB）（年繳）', maxMembers: 5, monthlyFee: 277, currency: 'TWD' }, { id: 'google-one-ai-pro-monthly', name: 'AI Pro（5 TB）（月繳）', maxMembers: 5, monthlyFee: 650, currency: 'TWD' }, { id: 'google-one-ai-pro-yearly', name: 'AI Pro（5 TB）（年繳）', maxMembers: 5, monthlyFee: 546, currency: 'TWD' }] },
  { id: 'chatgpt',          name: 'ChatGPT',        category: 'AI工具', plans: [{ id: 'chatgpt-team-monthly', name: 'Business（月繳）', maxMembers: 2, monthlyFee: 1600, currency: 'TWD' }, { id: 'chatgpt-team-yearly', name: 'Business（年繳）', maxMembers: 2, monthlyFee: 1280, currency: 'TWD' }] },
  { id: 'apple-tv',         name: 'Apple TV+',      category: '影音', plans: [{ id: 'apple-tv-family-monthly', name: '家庭共享（月繳）', maxMembers: 6, monthlyFee: 250, currency: 'TWD' }, { id: 'apple-tv-family-yearly', name: '家庭共享（年繳）', maxMembers: 6, monthlyFee: 208, currency: 'TWD' }] },
  { id: 'hbo',              name: 'HBO Max',        category: '影音', plans: [{ id: 'hbo-std-monthly', name: '標準方案（月繳）', maxMembers: 3, monthlyFee: 220, currency: 'TWD' }, { id: 'hbo-std-yearly', name: '標準方案（年繳）', maxMembers: 3, monthlyFee: 183, currency: 'TWD' }, { id: 'hbo-ultimate-monthly', name: '高級方案（月繳）', maxMembers: 4, monthlyFee: 299, currency: 'TWD' }, { id: 'hbo-ultimate-yearly', name: '高級方案（年繳）', maxMembers: 4, monthlyFee: 249, currency: 'TWD' }] },
  { id: 'discord',          name: 'Discord',        category: '通訊', plans: [{ id: 'discord-family-monthly', name: '個人方案（帳號共享）（月繳）', maxMembers: 5, monthlyFee: 320, currency: 'TWD' }, { id: 'discord-family-yearly', name: '個人方案（帳號共享）（年繳）', maxMembers: 5, monthlyFee: 267, currency: 'TWD' }] },
  { id: 'friday-video',     name: 'friDay影音',       category: '影音', plans: [{ id: 'friday-video-plan', name: '影劇暢看方案（月繳）', maxMembers: 2, monthlyFee: 199, currency: 'TWD' }] },
  { id: 'crunchyroll',      name: 'Crunchyroll',    category: '影音', plans: [{ id: 'crunchyroll-mega', name: 'Mega Fan（月繳）', maxMembers: 4, monthlyFee: 390, currency: 'TWD' }, { id: 'crunchyroll-ultimate', name: 'Ultimate Fan（月繳）', maxMembers: 6, monthlyFee: 520, currency: 'TWD' }] },
  { id: 'apple-music',      name: 'Apple Music',    category: '音樂', plans: [{ id: 'apple-music-family-monthly', name: '家庭方案（6人）（月繳）', maxMembers: 6, monthlyFee: 265, currency: 'TWD' }, { id: 'apple-music-family-yearly', name: '家庭方案（6人）（年繳）', maxMembers: 6, monthlyFee: 265, currency: 'TWD' }] },
  { id: 'kkbox',            name: 'KKBOX',          category: '音樂', plans: [{ id: 'kkbox-3', name: '3人家庭方案（月繳）', maxMembers: 3, monthlyFee: 229, currency: 'TWD' }, { id: 'kkbox-6', name: '6人家庭方案（月繳）', maxMembers: 6, monthlyFee: 260, currency: 'TWD' }] },
  { id: 'claude',           name: 'Claude',         category: 'AI工具', plans: [{ id: 'claude-pro', name: 'Pro（月繳）', maxMembers: 2, monthlyFee: 649, currency: 'TWD' }] },
  { id: 'midjourney',       name: 'Midjourney',     category: 'AI工具', plans: [{ id: 'midjourney-std-monthly', name: 'Standard（月繳）', maxMembers: 3, monthlyFee: 975, currency: 'TWD' }, { id: 'midjourney-std-yearly', name: 'Standard（年繳）', maxMembers: 3, monthlyFee: 780, currency: 'TWD' }, { id: 'midjourney-pro-monthly', name: 'Pro（月繳）', maxMembers: 4, monthlyFee: 1950, currency: 'TWD' }, { id: 'midjourney-pro-yearly', name: 'Pro（年繳）', maxMembers: 4, monthlyFee: 1560, currency: 'TWD' }] },
  { id: 'cursor',           name: 'Cursor',         category: 'AI工具', plans: [{ id: 'cursor-business-monthly', name: 'Teams（月繳）', maxMembers: 4, monthlyFee: 5120, currency: 'TWD' }, { id: 'cursor-business-yearly', name: 'Teams（年繳）', maxMembers: 4, monthlyFee: 4096, currency: 'TWD' }] },
  { id: 'microsoft-365',    name: 'Microsoft 365',  category: '辦公', plans: [{ id: 'microsoft-365-family-monthly', name: '家庭版（6人）（月繳）', maxMembers: 6, monthlyFee: 419, currency: 'TWD' }, { id: 'microsoft-365-family-yearly', name: '家庭版（6人）（年繳）', maxMembers: 6, monthlyFee: 349, currency: 'TWD' }] },
  { id: 'adobe-cc',         name: 'Adobe CC',       category: '辦公', plans: [{ id: 'adobe-cc-all-monthly', name: '全應用程式（月繳）', maxMembers: 2, monthlyFee: 3150, currency: 'TWD' }, { id: 'adobe-cc-all-yearly', name: '全應用程式（年繳）', maxMembers: 2, monthlyFee: 2310, currency: 'TWD' }] },
  { id: 'canva',            name: 'Canva Pro',      category: '辦公', plans: [{ id: 'canva-team-monthly', name: '團隊版（月繳）', maxMembers: 5, monthlyFee: 1600, currency: 'TWD' }, { id: 'canva-team-yearly', name: '團隊版（年繳）', maxMembers: 5, monthlyFee: 1333, currency: 'TWD' }] },
  { id: 'notion',           name: 'Notion',         category: '辦公', plans: [{ id: 'notion-business-monthly', name: 'Business（月繳）', maxMembers: 3, monthlyFee: 1920, currency: 'TWD' }, { id: 'notion-business-yearly', name: 'Business（年繳）', maxMembers: 3, monthlyFee: 1536, currency: 'TWD' }] },
  { id: 'icloud',           name: 'iCloud+',        category: '雲端', plans: [{ id: 'icloud-200', name: '200GB（月繳）', maxMembers: 5, monthlyFee: 90, currency: 'TWD' }, { id: 'icloud-2tb', name: '2TB（月繳）', maxMembers: 5, monthlyFee: 300, currency: 'TWD' }] },
  { id: 'dropbox',          name: 'Dropbox',        category: '雲端', plans: [{ id: 'dropbox-family', name: 'Family（月繳）', maxMembers: 6, monthlyFee: 650, currency: 'TWD' }] },
  { id: 'duolingo',         name: 'Duolingo',       category: '學習', plans: [{ id: 'duolingo-family', name: 'Family（年繳）', maxMembers: 6, monthlyFee: 199, currency: 'TWD' }] },
  { id: 'masterclass',      name: 'MasterClass',    category: '學習', plans: [{ id: 'masterclass-2', name: '家庭方案（2人）（年繳）', maxMembers: 2, monthlyFee: 480, currency: 'TWD' }, { id: 'masterclass-6', name: '家庭方案（6人）（年繳）', maxMembers: 6, monthlyFee: 640, currency: 'TWD' }] },
  { id: 'nintendo-online',  name: 'Nintendo',       category: '遊戲', plans: [{ id: 'nintendo-basic-monthly', name: '家庭方案（無擴充包）（月繳）', maxMembers: 8, monthlyFee: 98, currency: 'TWD' }, { id: 'nintendo-basic-yearly', name: '家庭方案（無擴充包）（年繳）', maxMembers: 8, monthlyFee: 98, currency: 'TWD' }, { id: 'nintendo-expand-monthly', name: '家庭方案（含擴充包）（月繳）', maxMembers: 8, monthlyFee: 200, currency: 'TWD' }, { id: 'nintendo-expand-yearly', name: '家庭方案（含擴充包）（年繳）', maxMembers: 8, monthlyFee: 200, currency: 'TWD' }] },
  { id: 'nordvpn',          name: 'NordVPN',        category: 'VPN', plans: [{ id: 'nordvpn-basic', name: 'Standard（月繳）', maxMembers: 6, monthlyFee: 375, currency: 'TWD' }, { id: 'nordvpn-plus', name: 'Plus（月繳）', maxMembers: 6, monthlyFee: 487, currency: 'TWD' }, { id: 'nordvpn-ultimate', name: 'Complete（月繳）', maxMembers: 6, monthlyFee: 650, currency: 'TWD' }] },
  { id: 'expressvpn',       name: 'ExpressVPN',     category: 'VPN', plans: [{ id: 'expressvpn-monthly', name: '月繳', maxMembers: 5, monthlyFee: 390, currency: 'TWD' }, { id: 'expressvpn-yearly', name: '年繳', maxMembers: 5, monthlyFee: 260, currency: 'TWD' }] },
  { id: 'apple-one',        name: 'Apple One',      category: '套組', plans: [{ id: 'apple-one-individual', name: '個人方案（月繳）', maxMembers: 1, monthlyFee: 390, currency: 'TWD' }, { id: 'apple-one-family', name: '家庭方案（月繳）', maxMembers: 6, monthlyFee: 490, currency: 'TWD' }] },
]

async function main() {
  console.log('開始寫入服務資料...')
  for (const service of SERVICES) {
    await prisma.service.upsert({
      where:  { id: service.id },
      update: { name: service.name, category: service.category, plans: service.plans },
      create: { id: service.id, name: service.name, category: service.category, plans: service.plans },
    })
  }

  // 清掉不在上面清單裡的舊服務（例如從目錄移除的服務），避免殘留資料跟前端目錄脫節
  const { count: removed } = await prisma.service.deleteMany({
    where: { id: { notIn: SERVICES.map(s => s.id) } },
  })

  console.log(`完成，共寫入 ${SERVICES.length} 筆服務資料${removed > 0 ? `，移除 ${removed} 筆已下架服務` : ''}`)
}

main()
  .catch(err => { console.error('Seed 失敗:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
