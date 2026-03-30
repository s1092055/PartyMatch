import { GroupDetailSection } from "./GroupDetailSection.jsx";

export function GroupDetailHostSection({
  hostName,
  serviceLabel,
  hostSummary,
  hostSignals,
}) {
  return (
    <GroupDetailSection eyebrow="團主簡介" headingClassName="">
      <div className="mt-[-0.5rem] flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#eef3ff] text-lg font-semibold text-[#1d4ed8]">
          {hostName.slice(0, 1)}
        </div>
        <div className="min-w-0">
          <div className="text-xl font-semibold tracking-tight text-black">{hostName}</div>
          <div className="mt-1 text-sm font-medium text-black/48">{serviceLabel} 共享團主</div>
          <p className="mt-3 text-sm leading-7 text-black/58">{hostSummary}</p>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-black/38">
            整體評價
          </div>
          <div className="mt-2 text-base font-semibold text-black">
            資訊完整、適合先評估後申請
          </div>
          <p className="mt-2 text-sm leading-7 text-black/54">
            目前頁面已公開方案說明、加入條件與常見問題，能先幫你判斷這團是否適合自己的共享節奏。
          </p>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-black/38">
            可參考重點
          </div>
          <ul className="mt-3 space-y-2">
            {hostSignals.length ? (
              hostSignals.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm leading-7 text-black/58"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563eb]" />
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li className="text-sm leading-7 text-black/54">
                目前已有基本群組資料，若你想進一步確認付款與加入細節，建議在申請前先與團主聯繫。
              </li>
            )}
          </ul>
        </div>
      </div>
    </GroupDetailSection>
  );
}
