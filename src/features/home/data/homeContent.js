import {
  Bell,
  Heart,
  MessageSquare,
  ShieldCheck,
  Star,
} from 'lucide-react'

export const HOME_FEATURES = [
  {
    title: '探索群組',
    desc: '依服務類型、價格區間與團主評分篩選，快速找到符合需求的合購群組，並支援關鍵字搜尋以縮小範圍。',
    screenshots: ['/screenshots/explore-01-grid.jpg', '/screenshots/explore-02-detail.jpg'],
    action: { type: 'navigate', path: '/explore' },
    cta: '開始探索',
  },
  {
    title: '快速搜尋',
    desc: '設定您的需求條件，系統將自動配對並排序最適合的群組，省去逐一比對的時間，數秒內即可完成篩選。',
    screenshots: ['/screenshots/quickmatch-01-services.jpg', '/screenshots/quickmatch-02-filters.jpg', '/screenshots/quickmatch-03-results.jpg'],
    action: { type: 'navigate', path: '/quick-match' },
    cta: '開始搜尋',
  },
  {
    title: '建立群組',
    desc: '擔任團主，設定方案內容與招募規則即可開放申請，僅需幾個步驟即可完成上架，開始招募成員。',
    screenshots: ['/screenshots/create-01-service.jpg', '/screenshots/create-02-plan.jpg', '/screenshots/create-03-settings.jpg', '/screenshots/create-04-confirm.jpg'],
    action: { type: 'navigate', path: '/create-group' },
    cta: '開始建立',
  },
  {
    title: '群組管理',
    desc: '審核申請、鎖定名額、啟用服務等操作皆集中於單一頁面，款項由平台自動代管與撥付，無須自行對帳。',
    screenshots: ['/screenshots/manage-01-list.jpg', '/screenshots/manage-02-applications.jpg'],
    action: { type: 'navigate', path: '/manage-groups' },
    cta: '查看管理',
  },
  {
    title: '我的訂閱',
    desc: '統一檢視所有已加入的訂閱與 PM 幣扣款紀錄。申請通過後款項將自動從餘額代管扣除，無須手動轉帳或上傳憑證截圖。',
    screenshots: ['/screenshots/subscriptions-01-list.jpg', '/screenshots/subscriptions-02-detail.jpg'],
    action: { type: 'navigate', path: '/my-subscriptions' },
    cta: '查看訂閱',
  },
]

export const HOME_EXTRA_FEATURES = [
  {
    icon: MessageSquare,
    title: '訊息中心',
    desc: '與同群組成員直接對話，溝通付款細節或其他問題，無須另尋聯絡方式。',
    screenshots: ['/screenshots/messages-02-list.jpg', '/screenshots/messages-01-chat.jpg'],
    color: 'text-brand',
    bg: 'bg-brand-subtle',
  },
  {
    icon: Bell,
    title: '通知中心',
    desc: '申請結果、付款提醒與成員動態即時送達，確保您不會遺漏任何重要事項。',
    screenshots: ['/screenshots/notifications-01-panel.jpg'],
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  {
    icon: Heart,
    title: '我的收藏',
    desc: '先將感興趣的群組加入收藏，日後再決定是否申請加入，可隨時回來查看。',
    screenshots: ['/screenshots/favorites-01-list.jpg'],
    color: 'text-danger',
    bg: 'bg-danger-subtle',
  },
  {
    icon: Star,
    title: '信用分數',
    desc: '準時完成流程、不隨意退出群組皆可累積信用分數，分數愈高，團主接受申請的意願也愈高。',
    screenshots: ['/screenshots/credit-01-modal.jpg'],
    color: 'text-success',
    bg: 'bg-success/10',
  },
  {
    icon: ShieldCheck,
    title: 'PM 幣代管保障',
    desc: '申請通過後即以 PM 幣（1:1 對應新台幣）自動代管款項，服務啟用後另有 48 小時確認期；如有爭議可向平台提出申訴，代管金額於審核期間全程凍結，確保交易安全與透明。',
    screenshots: ['/screenshots/tokens-01-topup.jpg', '/screenshots/tokens-02-history.jpg'],
    color: 'text-info',
    bg: 'bg-info-subtle',
  },
]

export const MEMBER_STEPS = [
  {
    step: 1,
    title: '選擇訂閱服務',
    desc: '從 28 種熱門訂閱服務中選擇，例如 Netflix、Spotify 或 ChatGPT。',
  },
  {
    step: 2,
    title: '瀏覽群組或快速搜尋',
    desc: '自行篩選合適的群組，或透過快速搜尋依預算與條件自動推薦。',
  },
  {
    step: 3,
    title: '送出加入申請',
    desc: '找到合適的群組後即可送出申請，並附上留言供團主參考，審核結果將以通知告知。',
  },
  {
    step: 4,
    title: '申請被接受，PM 幣自動代管',
    desc: '團主接受申請的同時，您的席位費用將自動從 PM 幣餘額轉入平台代管，無須另行轉帳或匯款。',
  },
  {
    step: 5,
    title: '填寫服務帳號',
    desc: '團主鎖定群組後，請填寫您於該服務使用的訂閱帳號資訊；團主啟用服務後即可開始使用。',
  },
  {
    step: 6,
    title: '確認服務正常，開始享用',
    desc: '服務啟用後進入 48 小時確認期，確認無誤即可提前結束等待，代管款項將立即撥付予團主；如遇問題可於期限內向平台申訴。後續可於「我的訂閱」追蹤扣款與續訂時間。',
  },
]

export const HOST_STEPS = [
  {
    step: 1,
    title: '建立群組',
    desc: '選擇服務與方案，設定名額、加入規則與費用，僅需 4 個步驟即可完成上架並開始接受申請。',
  },
  {
    step: 2,
    title: '審核申請',
    desc: '查看申請者的信用分數與留言，決定是否接受。接受後名額將自動減少，並通知申請者。',
  },
  {
    step: 3,
    title: '名額招滿，鎖定群組',
    desc: '所有名額接受後，點擊「鎖定群組」即可。全員席位費用已於接受申請時完成代管，系統將自動建立群組聊天室，並通知所有成員填寫服務帳號。',
  },
  {
    step: 4,
    title: '啟用服務',
    desc: '全員填寫服務帳號後，啟用按鈕將自動顯示。點擊後群組進入 48 小時確認期，期間成員可確認服務狀態或提出問題，期滿後代管款項將自動撥付予您。',
  },
  {
    step: 5,
    title: '續訂或結束',
    desc: '每個計費週期結束時，可選擇繼續招募下一輪或結束群組。若有成員提出申訴，平台客服將於 3 天內完成裁定，期間該筆代管金額將全程凍結。',
  },
]
