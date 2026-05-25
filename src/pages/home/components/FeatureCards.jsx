import { useState, useRef, useEffect } from "react";
import { Search, Users, PlusCircle, CreditCard } from "lucide-react";

const FEATURES = [
  {
    icon: Search,
    title: "探索共享群組",
    desc: "依照服務類型、價格與剩餘名額篩選，快速找到最適合你的訂閱群組，支援關鍵字搜尋與多維度排序。",
    videoSrc: null,
  },
  {
    icon: Users,
    title: "快速配對",
    desc: "告訴我們你的需求與預算，系統自動推薦最符合條件的群組，省去逐一比較的時間。",
    videoSrc: null,
  },
  {
    icon: PlusCircle,
    title: "建立群組",
    desc: "幾個步驟就能成為團主，自訂方案、名額與加入條件，輕鬆招募成員一起分攤費用。",
    videoSrc: null,
  },
  {
    icon: CreditCard,
    title: "管理訂閱",
    desc: "集中查看所有訂閱的付款狀態、下次續訂日期與完整付款紀錄，再也不怕漏繳。",
    videoSrc: null,
  },
];

export default function FeatureCards() {
  const [active, setActive] = useState(0);
  const videoRef = useRef(null);
  const { icon: Icon, title, desc, videoSrc } = FEATURES[active];

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [active]);

  return (
    <section>
      <div className="mb-6">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-ink-4 text-center">核心功能</p>
        <h2 className="text-3xl font-extrabold text-ink text-center">
          PartyMatch 的核心功能
        </h2>
        <p className="mt-3 text-base text-ink-3 text-center">
          探索、配對、建立群組、管理訂閱，四大功能一次掌握。
        </p>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-card)] bg-surface">
        <div className="relative h-52 w-full md:h-60">
          {videoSrc ? (
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            >
              <source src={videoSrc} />
            </video>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-raised">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-subtle">
                  <Icon size={32} className="text-brand" />
                </div>
                <span className="text-sm font-bold text-ink-3">
                  功能示範影片 placeholder
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="p-5">
          <h3 className="text-xl font-extrabold text-ink text-center">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-3 text-center">
            {desc}
          </p>
        </div>

        <div className="flex gap-1 px-3 pb-3">
          {FEATURES.map((f, i) => {
            const TabIcon = f.icon;
            return (
              <button
                key={f.title}
                onClick={() => setActive(i)}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-3 text-2xs font-bold transition-colors ${
                  i === active
                    ? "bg-raised text-brand"
                    : "text-ink-3 hover:bg-raised hover:text-ink"
                }`}
              >
                <TabIcon size={16} />
                <span className="hidden md:block">{f.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
