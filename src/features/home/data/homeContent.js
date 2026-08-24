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
import createGroupFlowVideo from '../../../assets/flow-videos/create-group-m.mp4'
import createGroupFlowVideoDesktop from '../../../assets/flow-videos/create-group-d.mp4'

export const HOME_INTRO_PILLARS = [
  {
    title: '尋找群組 & 建立群組',
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
];

export const HOME_HOST_JOURNEY = [
  {
    id: 'create',
    title: '建立群組',
    badge: 'CREATE',
    desc: '選服務、設定方案與名額即可開放申請，方案價格系統自動核實，免自己找人湊團。',
    video: createGroupFlowVideo,
    videoDesktop: createGroupFlowVideoDesktop,
  },
  {
    id: 'manage',
    title: '群組管理',
    badge: 'MANAGE',
    desc: '審核申請、額滿鎖定共用帳密，成員確認可用後正式啟用；有問題可一鍵回報，平台介入處理。',
  },
  {
    id: 'renew',
    title: '續訂管理',
    badge: 'RENEWAL',
    desc: '到期前系統主動提醒，重新確認服務資訊，成員確認後即完成續約，原班人馬繼續使用。',
  },
  {
    id: 'other',
    title: '其他情境',
    badge: 'OTHERS',
    desc: '站內直接溝通免交換聯絡方式，PM 幣收款/儲值/消費紀錄一次查看，交易結束雙方互評累積信用。',
  },
];

export const HOME_MEMBER_JOURNEY = [
  {
    id: 'create',
    title: '加入群組',
    badge: 'CREATE',
    desc: '設定預算條件讓系統自動配對推薦群組，送出申請等待審核，免私訊團主喬時間。',
  },
  {
    id: 'manage',
    title: '使用與確認',
    badge: 'MANAGE',
    desc: '費用自動代管，48 小時內確認服務可用即可啟用；有問題可一鍵回報，代管款項全程凍結。',
  },
  {
    id: 'renew',
    title: '續約確認',
    badge: 'RENEWAL',
    desc: '到期前主動收到提醒，確認服務狀態沒問題即完成續約，不想續約也能隨時申請退出。',
  },
  {
    id: 'other',
    title: '其他情境',
    badge: 'OTHERS',
    desc: '站內直接溝通免交換聯絡方式，先收藏心動群組之後再比較，交易結束雙方互評累積信用。',
  },
];

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
];

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
];

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
];

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
];
