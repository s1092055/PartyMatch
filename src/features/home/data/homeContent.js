import {
  MessageCircleQuestion,
  MessageCircle,
  LayoutGrid,
  Heart,
} from 'lucide-react'
import securityPhoto from '../../../assets/Security.png'
import creditPhoto from '../../../assets/Credit.png'
import pmCoinPhoto from '../../../assets/PMCoin.svg'
import studentsPhoto from '../../../assets/Students.png'
import couplesPhoto from '../../../assets/Couples.png'
import friendsPhoto from '../../../assets/Friends.png'
import familyPhoto from '../../../assets/Family.png'
import freelancerPhoto from '../../../assets/freelance worker.png'
import createGroupFlowVideo from '../../../assets/flow-videos/create-group.mov'

// 「PartyMatch 是什麼？」區塊：首頁第一個內容區塊（Hero 之後），讓還不認識 PartyMatch 的
// 使用者快速看懂服務內容，走編號列表呈現三個核心環節，跟「為什麼選擇 PartyMatch？」的
// Tab 卡片版面刻意做出區隔；不重複「我想成為？」的細節流程跟「為什麼選擇 PartyMatch？」
// 的信任機制說明
export const HOME_INTRO_PILLARS = [
  {
    title: '尋找 & 建立群組',
    desc: '瀏覽現有群組直接申請，或自己開團設定服務、方案與名額。',
  },
  {
    title: '安全加入 x 安心共享',
    desc: '費用由平台代管，服務啟用後仍有確認期，不怕收錢不出貨。',
  },
  {
    title: '所有流程一站管理',
    desc: '續約提醒、站內溝通、信用評價，所有都在同一個平台完成。',
  },
]

// 「不同身份，各有各的任務」區塊：團主／成員各自的完整流程，分成四個大階段（頂層底線
// Tab，id 兩邊一一對應方便切換身份時 Tab 位置不跳動），每個階段底下再列出更細的子流程
// （垂直 Tab）。前三個順序對應 Group 狀態機：建立/加入群組 → recruiting；群組管理涵蓋
// recruiting → full → pending_confirmation → pending_activation → confirming → active；
// 續訂管理對應 active → pending_confirmation 的續約流程（重新走一輪填服務資訊 → 啟用 →
// 確認），細節見 CLAUDE.md「重要慣例」；最後的「其他」不屬於狀態機流程，是平時會用到的
// 其他功能（站內溝通／PM 幣／信用評價／收藏）
export const HOME_HOST_JOURNEY = [
  {
    id: 'create',
    title: '建立群組',
    badge: 'CREATE',
    steps: [
      {
        title: '選服務、挑方案',
        desc: '方案價格系統自動核實，免自己上網查。',
        // 手機版實拍畫面（直式螢幕錄影），桌機沒有 hover 能力的裝置一起共用；其餘步驟
        // 還沒有對應影片，維持原本的 Play icon 佔位
        video: createGroupFlowVideo,
      },
      {
        title: '設定名額，開放申請',
        desc: '填好名額即可送出，開放申請免找人湊團。',
      },
    ],
  },
  {
    id: 'manage',
    title: '群組管理',
    badge: 'MANAGE',
    steps: [
      {
        title: '審核申請，信用把關',
        desc: '看信用評價篩選夥伴，免逐一私訊確認。',
      },
      {
        title: '額滿鎖定，共用帳密',
        desc: '鎖定後加密保存帳密，只有成員看得到。',
      },
      {
        title: '成員確認，正式啟用',
        desc: '成員確認可用後正式啟用、開始收費。',
      },
      {
        title: '有問題，一鍵回報',
        desc: '成員能直接回報問題，平台介入處理。',
      },
    ],
  },
  {
    id: 'renew',
    title: '續訂管理',
    badge: 'RENEWAL',
    steps: [
      {
        title: '到期前主動提醒',
        desc: '快到期時系統主動通知，免自己排提醒。',
      },
      {
        title: '重新確認服務資訊',
        desc: '重新填寫服務資訊，跟開團一樣簡單。',
      },
      {
        title: '成員確認，正式續約',
        desc: '成員確認後直接續約，原班人馬續用。',
      },
    ],
  },
  {
    id: 'other',
    title: '其他情境',
    badge: 'OTHERS',
    steps: [
      {
        title: '站內溝通',
        desc: '站內直接傳訊，免交換聯絡方式。',
      },
      {
        title: 'PM 幣管理',
        desc: '收款、儲值、消費紀錄一次查看。',
      },
      {
        title: '信用評價',
        desc: '交易結束雙方互評，累積信用紀錄。',
      },
    ],
  },
]

// 成員視角的完整流程，id 對應 HOME_HOST_JOURNEY，同一個階段徽章（CREATE／MANAGE／
// RENEWAL／OTHERS）在切換身份時位置不變，只換底下的標題跟內容
export const HOME_MEMBER_JOURNEY = [
  {
    id: 'create',
    title: '加入群組',
    badge: 'CREATE',
    steps: [
      {
        title: '搜尋或快速配對',
        desc: '設定預算條件，系統自動配對推薦群組。',
      },
      {
        title: '送出申請，等待審核',
        desc: '送出申請等審核，免私訊團主喬時間。',
      },
    ],
  },
  {
    id: 'manage',
    title: '使用與確認',
    badge: 'MANAGE',
    steps: [
      {
        title: '費用自動代管',
        desc: '費用自動代管，安心不怕收錢不出貨。',
      },
      {
        title: '確認服務可用',
        desc: '48 小時內確認服務可用，即可啟用。',
      },
      {
        title: '有問題，一鍵回報',
        desc: '直接向平台回報，代管款項全程凍結。',
      },
    ],
  },
  {
    id: 'renew',
    title: '續約確認',
    badge: 'RENEWAL',
    steps: [
      {
        title: '到期前收到提醒',
        desc: '快到期時主動通知，決定要不要續約。',
      },
      {
        title: '確認服務仍可用',
        desc: '確認服務狀態沒問題，即完成續約。',
      },
      {
        title: '也能隨時退出',
        desc: '不想續約可直接申請退出，免勉強續用。',
      },
    ],
  },
  {
    id: 'other',
    title: '其他情境',
    badge: 'OTHERS',
    steps: [
      {
        title: '站內溝通',
        desc: '站內直接傳訊，免交換聯絡方式。',
      },
      {
        title: '收藏與追蹤',
        desc: '先收藏心動群組，之後再慢慢比較。',
      },
      {
        title: '信用評價',
        desc: '交易結束雙方互評，累積信用紀錄。',
      },
    ],
  },
]

// 「為什麼選擇 PartyMatch？」區塊：主要機制走 Tab 切換（中央放大插畫 + 完整說明文案），
// image 沒有的項目（問題回報機制）先用 icon 佔位，之後補上對應插畫時直接補 image 欄位即可，
// 元件端已經有處理 icon/image 兩種呈現方式
export const HOME_WHY_US_TABS = [
  {
    id: 'security',
    tab: '安全可靠',
    image: securityPhoto,
    title: '安全可靠',
    desc: '合購款項由平台代管，服務啟用後另設有 48 小時確認期，交易過程全程留有紀錄可查，保障雙方權益。',
  },
  {
    id: 'credit',
    tab: '信用機制',
    image: creditPhoto,
    title: '真實信用機制',
    desc: '每次合作結束後，雙方將互相評價並累積為個人信用紀錄；申請加入前即可參考對方過往表現，降低合作風險。',
  },
  {
    id: 'pm-coin',
    tab: 'PM 幣支付',
    image: pmCoinPhoto,
    title: 'PM 幣支付',
    desc: '站內交易統一以 PM 幣完成，儲值、扣款與退款皆留有完整紀錄；如遇爭議，亦有明確依據可供查核與處理。',
  },
  {
    id: 'issue-report',
    tab: '問題回報',
    icon: MessageCircleQuestion,
    title: '問題回報機制',
    desc: '服務使用期間如有疑慮，可直接向平台提出回報；代管款項將於處理期間全數凍結，並於 48 小時內完成處理。',
  },
]

// 次要補充項目：跟主要機制 Tab 相關但份量較輕，維持小條列呈現在 Tab 內容下方
export const HOME_WHY_US_EXTRAS = [
  {
    icon: MessageCircle,
    title: '站內即時溝通',
    desc: '免交換聯絡方式，直接傳訊。',
  },
  {
    icon: LayoutGrid,
    title: '多元服務類型',
    desc: '28 種訂閱服務一站找齊。',
  },
  {
    icon: Heart,
    title: '收藏與追蹤',
    desc: '先收藏，回頭再慢慢比較。',
  },
]

// 「適合每一種共享生活」區塊；photo 是 assets 資料夾裡的實際素材，services 是這個族群
// 常見會揪團共享的服務（對應 serviceCatalog.js 的 id），首頁點開放大圖時底下會列出來
export const HOME_AUDIENCES = [
  {
    photo: studentsPhoto,
    title: '學生族群',
    desc: '一起分擔娛樂訂閱費用，降低生活開銷。',
    services: ['spotify', 'netflix', 'chatgpt', 'discord'],
  },
  {
    photo: couplesPhoto,
    title: '情侶伴侶',
    desc: '共享串流服務更划算，讓追劇時光更豐富。',
    services: ['netflix', 'disney', 'spotify', 'apple-music'],
  },
  {
    photo: familyPhoto,
    title: '家庭使用',
    desc: '家庭方案更划算，讓全家都能享受服務。',
    services: ['disney', 'netflix', 'apple-one', 'icloud'],
  },
  {
    photo: friendsPhoto,
    title: '朋友同事',
    desc: '揪團一起訂閱，共享更划算。',
    services: ['nintendo-online', 'discord', 'crunchyroll', 'youtube'],
  },
  {
    photo: freelancerPhoto,
    title: '自由工作者',
    desc: '工作提效訂閱不孤單，一起管理更划算。',
    services: ['chatgpt', 'notion', 'canva', 'adobe-cc'],
  },
]

// 首頁常見問題預覽，涵蓋成員與團主都會遇到的一般性問題
export const HOME_FAQS = [
  {
    q: 'PartyMatch 是什麼服務？',
    a: 'PartyMatch 是訂閱共享媒合平台，協助您找到願意共享 Netflix、Spotify、ChatGPT 等熱門訂閱服務的夥伴，共同分攤費用。從尋找群組、送出申請、款項代管到成員溝通，皆可於同一平台完成。',
  },
  {
    q: 'PM 幣如何保障交易安全？',
    a: '申請通過的同時，您的席位費用將自動從 PM 幣餘額轉入平台代管，服務啟用後另有 48 小時確認期。期間如有爭議可向平台回報問題，代管款項會全程凍結，確認無誤才會撥付給團主。',
  },
  {
    q: '如果找不到適合的共享群組怎麼辦？',
    a: '可以使用「快速搜尋」設定預算與需求條件，系統會自動配對並排序最適合的群組；也可以自己建立群組，開放讓其他人申請加入。',
  },
  {
    q: '可以自己建立群組嗎？',
    a: '可以。登入後點擊「建立群組」，選擇服務、方案、設定名額與規則即可上架並開始招募，僅需幾個步驟即可完成。',
  },
  {
    q: '如何退出共享群組？',
    a: '可於「我的訂閱」查看目前加入的群組並提出退出申請；若服務有問題，也可以在確認期內向平台回報，由客服協助處理。',
  },
]
