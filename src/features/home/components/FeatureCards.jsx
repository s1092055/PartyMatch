import { useNavigate } from "react-router-dom";
import { Search, Users, PlusCircle, CreditCard, VideoOff, ArrowRight } from "lucide-react";
import RevealSection from "../../../shared/components/ui/RevealSection";

const FEATURES = [
  {
    icon: Search,
    title: "探索共享群組",
    desc: "依照服務類型、價格與剩餘名額篩選，快速找到最適合你的訂閱群組，支援關鍵字搜尋與多維度排序。",
    videoSrc: null,
    badge: "探索",
    action: { type: "navigate", path: "/explore" },
    cta: "開始探索",
  },
  {
    icon: Users,
    title: "快速配對",
    desc: "告訴我們你的需求與預算，系統自動推薦最符合條件的群組，省去逐一比較的時間。",
    videoSrc: null,
    badge: "配對",
    action: { type: "event", event: "pm:open-match" },
    cta: "立即配對",
  },
  {
    icon: PlusCircle,
    title: "建立群組",
    desc: "幾個步驟就能成為團主，自訂方案、名額與加入條件，輕鬆招募成員一起分攤費用。",
    videoSrc: null,
    badge: "建立",
    action: { type: "event", event: "pm:open-create" },
    cta: "建立群組",
  },
  {
    icon: CreditCard,
    title: "管理訂閱",
    desc: "集中查看所有訂閱的付款狀態、下次續訂日期與完整付款紀錄，再也不怕漏繳。",
    videoSrc: null,
    badge: "管理",
    action: { type: "navigate", path: "/my-subscriptions" },
    cta: "查看訂閱",
  },
];

function FeatureMedia({ icon: Icon, videoSrc }) {
  if (videoSrc) {
    return (
      <video
        className="h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
      >
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
      <div className="mb-10">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-ink-4 text-center">核心功能</p>
        <h2 className="text-3xl font-extrabold text-ink text-center">
          PartyMatch 核心功能
        </h2>
        <p className="mt-3 text-base text-ink-3 text-center">
          探索、配對、建立群組、管理訂閱，四大功能一次掌握。
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
