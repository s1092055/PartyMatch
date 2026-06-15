import { useNavigate } from "react-router-dom";
import { CreditCard, LayoutDashboard, PlusCircle, Search, VideoOff, ArrowRight, Zap } from "lucide-react";
import RevealSection from "../../../shared/components/ui/RevealSection";

const FEATURES = [
  {
    icon: Search,
    title: "探索群組",
    desc: "依服務、價格、評分篩選，找到符合你需求的合購群組。支援關鍵字搜尋，快速縮小範圍。",
    videoSrc: null,
    badge: "探索",
    action: { type: "navigate", path: "/explore" },
    cta: "開始探索",
  },
  {
    icon: Zap,
    title: "快速配對",
    desc: "告訴我們你要什麼，系統自動篩出最適合的群組讓你挑。省去逐一比較的時間，幾秒內找到選項。",
    videoSrc: null,
    badge: "配對",
    action: { type: "event", event: "pm:open-match" },
    cta: "立即配對",
  },
  {
    icon: PlusCircle,
    title: "建立群組",
    desc: "自己當團主，設好方案和規則，等有興趣的人來申請。幾個步驟就能上架，開始招募成員。",
    videoSrc: null,
    badge: "建立",
    action: { type: "event", event: "pm:open-create" },
    cta: "建立群組",
  },
  {
    icon: LayoutDashboard,
    title: "群組管理",
    desc: "審核申請、確認付款、管理成員，所有群組操作集中在一頁。啟用、續訂、結束群組一手掌控。",
    videoSrc: null,
    badge: "管理",
    action: { type: "navigate", path: "/manage-groups" },
    cta: "前往管理",
  },
  {
    icon: CreditCard,
    title: "我的訂閱",
    desc: "查看所有加入的訂閱、付款狀態和繳費紀錄，可以直接標記付款或聯絡團主，再也不怕漏繳。",
    videoSrc: null,
    badge: "訂閱",
    action: { type: "navigate", path: "/my-subscriptions" },
    cta: "查看訂閱",
  },
];

function FeatureMedia({ icon: Icon, videoSrc }) {
  if (videoSrc) {
    return (
      <video className="h-full w-full object-cover" autoPlay muted loop playsInline>
        <source src={videoSrc} />
      </video>
    );
  }
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-raised">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-subtle">
        <Icon size={32} className="text-brand" />
      </div>
      <div className="flex items-center gap-1.5 text-ink-4">
        <VideoOff size={14} />
        <span className="text-xs font-medium">功能示範影片即將推出</span>
      </div>
    </div>
  );
}

export default function FeatureCards() {
  const navigate = useNavigate();

  function handleAction(action) {
    if (action.type === "navigate") {
      navigate(action.path);
    } else {
      window.dispatchEvent(new CustomEvent(action.event));
    }
  }

  return (
    <section>
      <div className="mb-10 text-center">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-ink-4">核心功能</p>
        <h2 className="text-3xl font-extrabold text-ink">PartyMatch 是？</h2>
        <p className="mt-3 text-base text-ink-3">
          從找群組到管理訂閱，五大功能覆蓋合購的每個環節。
        </p>
      </div>

      <div className="space-y-20">
        {FEATURES.map(({ icon: Icon, title, desc, videoSrc, badge, action, cta }, i) => {
          const isEven = i % 2 === 0;
          return (
            <RevealSection key={title}>
              <div
                className={`flex flex-col gap-8 md:flex-row md:items-center md:gap-12 ${
                  isEven ? "" : "md:flex-row-reverse"
                }`}
              >
                <div className="aspect-video w-full overflow-hidden rounded-2xl md:w-1/2 md:shrink-0">
                  <FeatureMedia icon={Icon} videoSrc={videoSrc} />
                </div>
                <div className="flex flex-col items-center md:w-1/2 md:items-start">
                  <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-subtle px-3 py-1 text-xs font-extrabold text-brand">
                    <Icon size={12} />
                    {badge}
                  </span>
                  <h3 className="text-center text-2xl font-extrabold text-ink md:text-left">{title}</h3>
                  <p className="mt-3 text-center text-base leading-relaxed text-ink-3 md:text-left">{desc}</p>
                  <button
                    onClick={() => handleAction(action)}
                    className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-hover"
                  >
                    {cta}
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </RevealSection>
          );
        })}
      </div>
    </section>
  );
}
