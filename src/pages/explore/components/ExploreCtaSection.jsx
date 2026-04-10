import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  BellAlertIcon,
  ClipboardDocumentCheckIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import { SmartContainer } from "../../../shared/components/layout/SmartContainer.jsx";
import { ServiceIcon } from "../../../shared/components/ui/ServiceIcon.jsx";

function CtaMiniCard({ icon, title, description, className = "" }) {
  const IconComponent = icon;

  return (
    <div
      className={[
        "rounded-[26px] border border-white/10 bg-white/8 p-4 backdrop-blur-sm",
        className,
      ].join(" ")}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/12 text-white">
        <IconComponent className="h-5 w-5" />
      </div>
      <div className="mt-4 text-base font-semibold tracking-tight text-white">
        {title}
      </div>
      <p className="mt-2 text-sm leading-6 text-white/68">
        {description}
      </p>
    </div>
  );
}

export function ExploreCtaSection() {
  return (
    <section className="pt-8 pb-16 sm:pt-10 sm:pb-20">
      <SmartContainer size="wide" className="px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[36px] border border-black/8 bg-[#050816] text-white shadow-[0_26px_80px_rgba(15,23,42,0.22)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(59,130,246,0.28),transparent_28%),radial-gradient(circle_at_86%_82%,rgba(239,68,68,0.26),transparent_30%),radial-gradient(circle_at_76%_28%,rgba(168,85,247,0.18),transparent_24%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.78),rgba(15,23,42,0.42)_40%,rgba(2,6,23,0.92))]" />

          <div className="relative grid gap-6 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:px-10 lg:py-12">
            <div className="flex flex-col justify-between gap-8">
              <div>
                <div className="inline-flex rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs font-semibold tracking-[0.08em] text-white/72 backdrop-blur-sm">
                  自己建立群組
                </div>

                <h2 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  找不到剛好的群組，
                  <br />
                  那就自己發起一團。
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-7 text-white/70 sm:text-base">
                  設定名額、加入條件與付款提醒，一個流程完成建立與招募。
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/create-group"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/92"
                >
                  立即建立群組
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <Link
                  to="/manage-group"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/12"
                >
                  前往群組管理
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {["netflix", "spotify", "notion", "canva"].map((serviceId) => (
                  <div
                    key={serviceId}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/12 bg-white/10 backdrop-blur-sm"
                  >
                    <ServiceIcon
                      serviceId={serviceId}
                      platform={serviceId}
                      iconKey={serviceId}
                      alt={serviceId}
                      className="h-7 w-7 object-contain"
                    />
                  </div>
                ))}
                <div className="text-sm text-white/62">
                  從娛樂影音到工具協作，都能快速建立共享方案。
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm sm:col-span-2">
                <div className="text-xs font-semibold tracking-[0.08em] text-white/58">
                  為什麼要建立群組
                </div>
                <div className="mt-3 text-2xl font-semibold tracking-tight text-white">
                  一個流程，完成建立、設定、招募。
                </div>
                <p className="mt-3 max-w-md text-sm leading-6 text-white/68">
                  建立流程自動整理群組資訊，完成即可對外分享頁面。
                </p>
              </div>

              <CtaMiniCard
                icon={ClipboardDocumentCheckIcon}
                title="自訂加入規則"
                description="決定是否需要審核、設定申請須知，讓群組節奏更穩定。"
              />

              <CtaMiniCard
                icon={BellAlertIcon}
                title="付款提醒同步"
                description="把續訂節奏、聯絡方式與提醒時間一起整理好。"
              />

              <CtaMiniCard
                icon={UserPlusIcon}
                title="快速開始招募"
                description="建立完成後就能立刻回到管理頁，開始分享你的群組。"
                className="sm:col-span-2"
              />
            </div>
          </div>
        </div>
      </SmartContainer>
    </section>
  );
}
