import 'dotenv/config'
import prisma from '../src/lib/prisma.js'

const SERVICES = [
  { id: 'spotify',        name: 'Spotify',        category: '音樂',   plans: [{ id: 'spotify-family', name: '家庭方案', maxMembers: 6, monthlyFee: 298, currency: 'TWD' }, { id: 'spotify-duo', name: 'Duo', maxMembers: 2, monthlyFee: 228, currency: 'TWD' }] },
  { id: 'youtube',        name: 'YouTube',         category: '影音',   plans: [{ id: 'youtube-family', name: '家庭方案', maxMembers: 6, monthlyFee: 479, currency: 'TWD' }] },
  { id: 'netflix',        name: 'Netflix',         category: '影音',   plans: [{ id: 'netflix-ad', name: '廣告支援標準', maxMembers: 2, monthlyFee: 270, currency: 'TWD' }, { id: 'netflix-std', name: '標準', maxMembers: 2, monthlyFee: 380, currency: 'TWD' }, { id: 'netflix-4k', name: '高級（4K）', maxMembers: 4, monthlyFee: 460, currency: 'TWD' }] },
  { id: 'disney',         name: 'Disney+',         category: '影音',   plans: [{ id: 'disney-std', name: '標準', maxMembers: 2, monthlyFee: 270, currency: 'TWD' }, { id: 'disney-premium', name: '高級', maxMembers: 4, monthlyFee: 320, currency: 'TWD' }] },
  { id: 'google-one',     name: 'Google One',      category: '套組',   plans: [{ id: 'google-one-100', name: '100 GB', maxMembers: 5, monthlyFee: 65, currency: 'TWD' }, { id: 'google-one-ai-plus', name: 'AI Plus（2 TB）', maxMembers: 5, monthlyFee: 330, currency: 'TWD' }, { id: 'google-one-ai-pro', name: 'AI Pro（5 TB）', maxMembers: 5, monthlyFee: 650, currency: 'TWD' }] },
  { id: 'chatgpt',        name: 'ChatGPT',         category: 'AI工具', plans: [{ id: 'chatgpt-team', name: 'Team', maxMembers: 2, monthlyFee: 1920, currency: 'TWD' }] },
  { id: 'apple-tv',       name: 'Apple TV+',       category: '影音',   plans: [{ id: 'apple-tv-family', name: '家庭共享', maxMembers: 6, monthlyFee: 150, currency: 'TWD' }] },
  { id: 'hbo',            name: 'HBO Max',          category: '影音',   plans: [{ id: 'hbo-std', name: '標準方案', maxMembers: 3, monthlyFee: 270, currency: 'TWD' }, { id: 'hbo-ultimate', name: '終極方案', maxMembers: 4, monthlyFee: 380, currency: 'TWD' }] },
  { id: 'discord',        name: 'Discord',          category: '通訊',   plans: [{ id: 'discord-family', name: '家庭方案', maxMembers: 5, monthlyFee: 325, currency: 'TWD' }] },
  { id: 'crunchyroll',    name: 'Crunchyroll',      category: '影音',   plans: [{ id: 'crunchyroll-mega', name: 'Mega Fan', maxMembers: 4, monthlyFee: 390, currency: 'TWD' }, { id: 'crunchyroll-ultimate', name: 'Ultimate Fan', maxMembers: 6, monthlyFee: 520, currency: 'TWD' }] },
  { id: 'apple-music',    name: 'Apple Music',      category: '音樂',   plans: [{ id: 'apple-music-family', name: '家庭方案（6人）', maxMembers: 6, monthlyFee: 249, currency: 'TWD' }] },
  { id: 'kkbox',          name: 'KKBOX',            category: '音樂',   plans: [{ id: 'kkbox-family', name: '家庭方案', maxMembers: 5, monthlyFee: 249, currency: 'TWD' }] },
  { id: 'claude',         name: 'Claude',           category: 'AI工具', plans: [{ id: 'claude-pro', name: 'Pro', maxMembers: 2, monthlyFee: 649, currency: 'TWD' }] },
  { id: 'midjourney',     name: 'Midjourney',       category: 'AI工具', plans: [{ id: 'midjourney-std', name: 'Standard', maxMembers: 3, monthlyFee: 975, currency: 'TWD' }, { id: 'midjourney-pro', name: 'Pro', maxMembers: 4, monthlyFee: 1950, currency: 'TWD' }] },
  { id: 'perplexity',     name: 'Perplexity',       category: 'AI工具', plans: [{ id: 'perplexity-pro', name: 'Pro', maxMembers: 2, monthlyFee: 649, currency: 'TWD' }] },
  { id: 'cursor',         name: 'Cursor',           category: 'AI工具', plans: [{ id: 'cursor-pro', name: 'Pro', maxMembers: 2, monthlyFee: 649, currency: 'TWD' }, { id: 'cursor-business', name: 'Business', maxMembers: 4, monthlyFee: 1300, currency: 'TWD' }] },
  { id: 'microsoft-365',  name: 'Microsoft 365',    category: '辦公',   plans: [{ id: 'microsoft-365-family', name: '家庭版（6人）', maxMembers: 6, monthlyFee: 329, currency: 'TWD' }] },
  { id: 'adobe-cc',       name: 'Adobe CC',         category: '辦公',   plans: [{ id: 'adobe-cc-all', name: '全應用程式', maxMembers: 2, monthlyFee: 1800, currency: 'TWD' }, { id: 'adobe-cc-single', name: '單一應用程式', maxMembers: 2, monthlyFee: 715, currency: 'TWD' }] },
  { id: 'canva',          name: 'Canva Pro',        category: '辦公',   plans: [{ id: 'canva-team', name: '團隊版', maxMembers: 5, monthlyFee: 1600, currency: 'TWD' }] },
  { id: 'notion',         name: 'Notion',           category: '辦公',   plans: [{ id: 'notion-business', name: 'Business', maxMembers: 3, monthlyFee: 1920, currency: 'TWD' }] },
  { id: 'icloud',         name: 'iCloud+',          category: '雲端',   plans: [{ id: 'icloud-200', name: '200GB', maxMembers: 5, monthlyFee: 90, currency: 'TWD' }, { id: 'icloud-2tb', name: '2TB', maxMembers: 5, monthlyFee: 300, currency: 'TWD' }] },
  { id: 'dropbox',        name: 'Dropbox',          category: '雲端',   plans: [{ id: 'dropbox-family', name: 'Family', maxMembers: 6, monthlyFee: 650, currency: 'TWD' }] },
  { id: 'duolingo',       name: 'Duolingo',         category: '學習',   plans: [{ id: 'duolingo-family', name: 'Family', maxMembers: 6, monthlyFee: 499, currency: 'TWD' }] },
  { id: 'masterclass',    name: 'MasterClass',      category: '學習',   plans: [{ id: 'masterclass-2', name: '家庭方案（2人）', maxMembers: 2, monthlyFee: 488, currency: 'TWD' }, { id: 'masterclass-6', name: '家庭方案（6人）', maxMembers: 6, monthlyFee: 650, currency: 'TWD' }] },
  { id: 'nintendo-online', name: 'Nintendo',        category: '遊戲',   plans: [{ id: 'nintendo-basic', name: '家庭方案（無擴充包）', maxMembers: 8, monthlyFee: 98, currency: 'TWD' }, { id: 'nintendo-expand', name: '家庭方案（含擴充包）', maxMembers: 8, monthlyFee: 200, currency: 'TWD' }] },
  { id: 'nordvpn',        name: 'NordVPN',          category: 'VPN',    plans: [{ id: 'nordvpn-basic', name: 'Basic', maxMembers: 6, monthlyFee: 375, currency: 'TWD' }, { id: 'nordvpn-plus', name: 'Plus', maxMembers: 6, monthlyFee: 487, currency: 'TWD' }, { id: 'nordvpn-ultimate', name: 'Ultimate', maxMembers: 6, monthlyFee: 650, currency: 'TWD' }] },
  { id: 'expressvpn',     name: 'ExpressVPN',       category: 'VPN',    plans: [{ id: 'expressvpn-monthly', name: '月繳', maxMembers: 5, monthlyFee: 390, currency: 'TWD' }, { id: 'expressvpn-yearly', name: '年繳', maxMembers: 5, monthlyFee: 260, currency: 'TWD' }] },
  { id: 'apple-one',      name: 'Apple One',        category: '套組',   plans: [{ id: 'apple-one-individual', name: '個人方案', maxMembers: 1, monthlyFee: 245, currency: 'TWD' }, { id: 'apple-one-family', name: '家庭方案', maxMembers: 6, monthlyFee: 375, currency: 'TWD' }] },
]

async function main() {
  console.log('🌱 開始寫入服務資料...')
  let count = 0
  for (const service of SERVICES) {
    await prisma.service.upsert({
      where:  { id: service.id },
      update: { name: service.name, category: service.category, plans: service.plans },
      create: { id: service.id, name: service.name, category: service.category, plans: service.plans },
    })
    count++
  }
  console.log(`✅ 完成，共寫入 ${count} 筆服務資料`)
}

main()
  .catch(err => { console.error('❌ Seed 失敗:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
