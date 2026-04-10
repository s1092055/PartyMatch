import { PageContainer } from "../../../shared/components/layout/PageContainer.jsx";
import { PageHeader } from "../../../shared/components/layout/PageHeader.jsx";
import { SectionPanel } from "../../../shared/components/layout/SectionPanel.jsx";

const featureBlocks = [
  {
    title: "探索群組",
    description: "瀏覽平台與方案，透過搜尋、排序與分類快速找到適合的共享群組。",
  },
  {
    title: "群組管理",
    description: "集中查看你加入或建立的群組，掌握名額、申請與成員狀態。",
  },
  {
    title: "建立群組",
    description: "依服務與方案快速建立共享群組，設定名額與對外說明。",
  },
  {
    title: "追蹤群組",
    description: "把感興趣的群組加入追蹤，之後可在帳號或管理中心快速回來查看。",
  },
  {
    title: "通知中心",
    description: "整理申請結果、群組異動、追蹤提醒與系統消息。",
  },
  {
    title: "帳號中心",
    description: "管理個人資料、登入方式、通知與隱私設定。",
  },
];

const howToSteps = [
  {
    title: "如何探索群組",
    steps: ["前往探索群組頁", "使用搜尋與排序篩選平台", "點開群組卡片查看詳細資訊"],
  },
  {
    title: "如何申請加入",
    steps: ["確認剩餘名額與方案內容", "點擊申請加入", "等待團主審核後即可加入"],
  },
  {
    title: "如何建立群組",
    steps: ["前往建立群組", "選擇服務與方案", "設定名額與備註後送出建立"],
  },
  {
    title: "如何管理我建立的群組",
    steps: ["進入群組管理", "切換到團主管理模式", "查看已建立群組與目前招募狀態"],
  },
];

const modeGuides = [
  {
    title: "探索者可以做什麼",
    description: "探索群組、申請加入、追蹤感興趣的群組，管理加入紀錄。",
  },
  {
    title: "團主管理可以做什麼",
    description: "查看你建立的群組與招募狀態，審核申請並管理成員。",
  },
];

const faqs = [
  {
    question: "申請後會發生什麼事？",
    answer: "申請送出後會更新群組狀態，可在群組管理頁查看申請紀錄與審核結果。",
  },
  {
    question: "如何取消追蹤？",
    answer: "在群組卡片再次點擊追蹤按鈕即可取消，也可到追蹤群組頁檢視目前追蹤清單。",
  },
  {
    question: "如何切換模式？",
    answer: "在群組管理頁首的模式切換器中，可在探索者與團主管理兩種模式之間切換。",
  },
  {
    question: "如何建立群組？",
    answer: "使用全站底部導覽的建立群組入口，選擇服務與方案後即可開始建立。",
  },
  {
    question: "為什麼我看不到團主管理功能？",
    answer: "若你尚未建立任何群組，切換到團主管理模式時會看到建立第一個群組的引導畫面。",
  },
];

export function HelpPage() {
  return (
    <PageContainer>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="PartyMatch"
          title="說明中心"
          description="了解主要功能、操作步驟與常見問題"
        />

        <div className="mx-auto max-w-5xl space-y-6">
          <SectionPanel title="功能介紹" description="快速掌握 PartyMatch 各個主要功能的用途與適用情境。">
            <div className="grid gap-4 md:grid-cols-2">
              {featureBlocks.map((item) => (
                <div key={item.title} className="rounded-2xl border border-black/10 px-5 py-5">
                  <h3 className="text-lg font-semibold text-black">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-black/60">{item.description}</p>
                </div>
              ))}
            </div>
          </SectionPanel>

          <SectionPanel title="操作步驟" description="從探索、加入到建立與管理群組，都能依照這些步驟快速完成。">
            <div className="space-y-5">
              {howToSteps.map((item) => (
                <div key={item.title} className="border-b border-black/10 pb-5 last:border-b-0 last:pb-0">
                  <h3 className="text-lg font-semibold text-black">{item.title}</h3>
                  <ol className="mt-3 space-y-2 text-sm leading-6 text-black/65">
                    {item.steps.map((step, index) => (
                      <li key={`${item.title}-${step}`} className="flex gap-3">
                        <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/[0.04] text-xs font-semibold text-black/70">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </SectionPanel>

          <SectionPanel title="使用模式 / 身份說明" description="依目前角色切換不同的管理視角，操作會更聚焦。">
            <div className="grid gap-4 md:grid-cols-2">
              {modeGuides.map((item) => (
                <div key={item.title} className="rounded-2xl border border-black/10 px-5 py-5">
                  <h3 className="text-lg font-semibold text-black">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-black/60">{item.description}</p>
                </div>
              ))}
            </div>
          </SectionPanel>

          <SectionPanel title="FAQ" description="整理使用 PartyMatch 時最常遇到的問題與解答。">
            <div className="space-y-5">
              {faqs.map((item) => (
                <div key={item.question} className="border-b border-black/10 pb-5 last:border-b-0 last:pb-0">
                  <h3 className="text-base font-semibold text-black">{item.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-black/60">{item.answer}</p>
                </div>
              ))}
            </div>
          </SectionPanel>
        </div>
      </div>
    </PageContainer>
  );
}
