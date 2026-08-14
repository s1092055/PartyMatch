import {
  Wallet,
  MessageCircleQuestion,
  MessageCircle,
  LayoutGrid,
  Heart,
  ClipboardList,
  Users,
  RefreshCw,
} from 'lucide-react'
import securityPhoto from '../../../assets/Security.png'
import creditPhoto from '../../../assets/Credit.png'
import studentsPhoto from '../../../assets/Students.png'
import couplesPhoto from '../../../assets/Couples.png'
import friendsPhoto from '../../../assets/Friends.png'
import familyPhoto from '../../../assets/Family.png'
import freelancerPhoto from '../../../assets/freelance worker.png'

// 「自己開團，一切變得更簡單」區塊：團主視角的完整流程，分成三個大階段（頂層底線 Tab），
// 每個階段底下再列出更細的子流程（垂直 Tab）。順序對應 Group 狀態機：
// 建立群組 → recruiting；群組管理涵蓋 recruiting → full → pending_confirmation →
// pending_activation → confirming → active；續訂管理對應 active → pending_confirmation
// 的續約流程（重新走一輪填服務資訊 → 啟用 → 確認），細節見 CLAUDE.md「重要慣例」
export const HOME_HOST_JOURNEY = [
  {
    id: 'create',
    title: '建立群組',
    icon: ClipboardList,
    steps: [
      {
        title: '選服務、挑方案',
        desc: '從 28 種訂閱服務裡選一個，方案價格系統會自動核實，不用自己上網查。',
      },
      {
        title: '設定名額，開放申請',
        desc: '填好名額跟簡介就能送出，馬上開放其他人申請加入，不用手動找人湊團。',
      },
    ],
  },
  {
    id: 'manage',
    title: '群組管理',
    icon: Users,
    steps: [
      {
        title: '審核申請，信用把關',
        desc: '看得到每位申請者的信用評價，篩選放心的夥伴，不用自己一個個私訊確認。',
      },
      {
        title: '額滿鎖定，共用帳密',
        desc: '人數到齊後鎖定群組，共用帳密加密保存，只有團主跟成員本人看得到。',
      },
      {
        title: '成員確認，正式啟用',
        desc: '等成員一一回報服務可正常使用，確認期一過群組就會正式啟用、開始收費。',
      },
      {
        title: '有問題，一鍵回報',
        desc: '服務出狀況時成員可以直接回報，不用私訊團主吵成一團，由平台介入處理。',
      },
    ],
  },
  {
    id: 'renew',
    title: '續訂管理',
    icon: RefreshCw,
    steps: [
      {
        title: '到期前主動提醒',
        desc: '快到期時系統會通知團主跟成員，不用自己在行事曆上排提醒。',
      },
      {
        title: '重新確認服務資訊',
        desc: '團主重新填一次服務資訊，流程跟當初開團一樣簡單，不用重新招募一輪。',
      },
      {
        title: '成員確認，正式續約',
        desc: '成員逐一確認服務仍可使用後，群組直接續約啟用，原班人馬接著用下去。',
      },
    ],
  },
]

// 「為什麼選擇 PartyMatch？」區塊
export const HOME_WHY_US = [
  {
    image: securityPhoto,
    title: '安全可靠',
    desc: '交易由平台代管。',
  },
  {
    image: creditPhoto,
    title: '真實信用機制',
    desc: '信用評分打造可信環境。',
  },
  {
    icon: Wallet,
    title: 'PM 幣支付',
    desc: '安全又方便的付款方式。',
  },
  {
    icon: MessageCircleQuestion,
    title: '問題回報機制',
    desc: '48 小時內完成處理。',
  },
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

// 「適合每一種共享生活」區塊；photo 是 assets 資料夾裡的實際素材
export const HOME_AUDIENCES = [
  {
    photo: studentsPhoto,
    title: '學生族群',
    desc: '一起分擔娛樂訂閱費用，降低生活開銷。',
  },
  {
    photo: couplesPhoto,
    title: '情侶伴侶',
    desc: '共享串流服務更划算，讓追劇時光更豐富。',
  },
  {
    photo: familyPhoto,
    title: '家庭使用',
    desc: '家庭方案更划算，讓全家都能享受服務。',
  },
  {
    photo: friendsPhoto,
    title: '朋友同事',
    desc: '揪團一起訂閱，共享更划算。',
  },
  {
    photo: freelancerPhoto,
    title: '自由工作者',
    desc: '工作提效訂閱不孤單，一起管理更划算。',
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
