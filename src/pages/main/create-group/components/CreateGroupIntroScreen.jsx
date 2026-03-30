import {
  CheckBadgeIcon,
  Squares2X2Icon,
  UsersIcon,
} from "@heroicons/react/24/outline";

const INTRO_STEPS = [
  {
    Icon: Squares2X2Icon,
    title: "選擇服務與方案",
    description: "挑選你想開團的服務類型，接著選一個適合的方案吧！",
  },
  {
    Icon: UsersIcon,
    title: "設定名額與加入條件",
    description: "規劃群組名額、加入條件以及成員申請須知與群組規範。",
  },
  {
    Icon: CheckBadgeIcon,
    title: "預覽並確認群組資訊",
    description: "預覽群組建立資訊，確認建立後就大功告成囉！",
  },
];

export function CreateGroupIntroScreen() {
  return (
    <div className="h-full bg-white px-4 py-5 sm:px-6 lg:px-10">
      <div className="mx-auto grid h-full max-w-[1480px] items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.88fr)] lg:gap-16">
        <section className="flex min-h-0 items-center">
          <div className="max-w-3xl">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-black/34">
              Create Group
            </div>
            <h1 className="mt-5 text-5xl font-semibold tracking-[-0.04em] text-black sm:text-6xl lg:text-[5.25rem] lg:leading-[0.94]">
              建立共享群組
            </h1>
          </div>
        </section>

        <section className="flex min-h-0 items-center">
          <div className="w-full border-l border-black/8 pl-8 lg:pl-10">
            <div className="space-y-7">
              {INTRO_STEPS.map((item, index) => (
                <div
                  key={item.title}
                  className={[
                    "grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)]",
                    index < INTRO_STEPS.length - 1
                      ? "border-b border-black/8"
                      : "",
                  ].join(" ")}
                >
                  <div>
                    <div className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-black">
                      <item.Icon className="h-6 w-6 shrink-0 text-black/70" />
                      <span>{item.title}</span>
                    </div>
                    <p className="mt-2 max-w-md text-sm leading-7 text-black/54 sm:text-base">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
