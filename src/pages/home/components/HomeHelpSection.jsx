import { useState } from "react";
import { motion } from "framer-motion";

// motion is used as JSX namespace (motion.div, motion.span) — this reference satisfies the lint rule
const _MotionRef = motion;
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { SmartContainer } from "../../../shared/components/layout/SmartContainer.jsx";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

function ScrollReveal({ children, className = "" }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={fadeUp}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerGroup({ children, className = "" }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerItem({ children, className = "" }) {
  return (
    <motion.div variants={fadeUp} className={className}>
      {children}
    </motion.div>
  );
}

const featureBlocks = [
  { title: "探索群組", description: "瀏覽平台與方案，透過搜尋、排序與分類快速找到適合的共享群組。" },
  { title: "群組管理", description: "集中查看你加入或建立的群組，掌握名額、申請與成員狀態。" },
  { title: "建立群組", description: "依服務與方案快速建立共享群組，設定名額與對外說明。" },
  { title: "追蹤群組", description: "把感興趣的群組加入追蹤，之後可在帳號或管理中心快速回來查看。" },
  { title: "通知中心", description: "整理申請結果、群組異動、追蹤提醒與系統消息。" },
  { title: "帳號中心", description: "管理個人資料、登入方式、通知與隱私設定。" },
];

const howToSteps = [
  { title: "如何探索群組", steps: ["前往探索群組頁", "使用搜尋與排序篩選平台", "點開群組卡片查看詳細資訊"] },
  { title: "如何申請加入", steps: ["確認剩餘名額與方案內容", "點擊申請加入", "等待團主審核後即可加入"] },
  { title: "如何建立群組", steps: ["前往建立群組", "選擇服務與方案", "設定名額與備註後送出建立"] },
  { title: "如何管理我建立的群組", steps: ["進入群組管理", "切換到團主管理模式", "查看已建立群組與目前招募狀態"] },
];

const faqs = [
  { question: "申請後會發生什麼事？", answer: "申請送出後會更新群組狀態，可在群組管理頁查看申請紀錄與審核結果。" },
  { question: "如何取消追蹤？", answer: "在群組卡片再次點擊追蹤按鈕即可取消，也可到追蹤群組頁檢視目前追蹤清單。" },
  { question: "如何切換模式？", answer: "在群組管理頁首的模式切換器中，可在探索者與團主管理兩種模式之間切換。" },
  { question: "如何建立群組？", answer: "使用全站底部導覽的建立群組入口，選擇服務與方案後即可開始建立。" },
  { question: "為什麼我看不到團主管理功能？", answer: "若你尚未建立任何群組，切換到團主管理模式時會看到建立第一個群組的引導畫面。" },
];

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div variants={fadeUp} className="border-b border-black/8 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-sm font-semibold text-black">{question}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="shrink-0 text-black/35"
        >
          <ChevronDownIcon className="h-4 w-4" />
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <p className="pb-5 text-sm leading-6 text-black/55">{answer}</p>
      </motion.div>
    </motion.div>
  );
}

function EyebrowLabel({ children }) {
  return (
    <p className="text-xs font-semibold tracking-[0.08em] text-black/38">{children}</p>
  );
}

export function HomeHelpSection() {
  return (
    <div className="border-t border-black/6">

      {/* ── Section 1：功能介紹 ── 白底，2欄，右側數字清單 */}
      <div className="bg-white">
        <SmartContainer size="wide" className="px-4 sm:px-6 lg:px-8">
          <div className="py-20 sm:py-28 lg:grid lg:grid-cols-[260px_1fr] lg:gap-20">

            <ScrollReveal>
              <EyebrowLabel>功能介紹</EyebrowLabel>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-black sm:text-3xl">
                快速掌握<br />每個功能
              </h2>
              <p className="mt-4 text-sm leading-6 text-black/48">
                了解各主要功能的用途與適用情境。
              </p>
            </ScrollReveal>

            <StaggerGroup className="mt-10 lg:mt-0">
              {featureBlocks.map((item, i) => (
                <StaggerItem key={item.title}>
                  <div className={[
                    "flex gap-5 py-5",
                    i < featureBlocks.length - 1 ? "border-b border-black/6" : "",
                  ].join(" ")}>
                    <span className="mt-0.5 w-6 shrink-0 text-xs font-medium tabular-nums text-black/22">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-black">{item.title}</h3>
                      <p className="mt-1.5 text-sm leading-6 text-black/52">{item.description}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGroup>

          </div>
        </SmartContainer>
      </div>

      {/* ── Section 2：操作步驟 ── 淺灰底，gap-px 分格 */}
      <div className="bg-[#f4f3f0]">
        <SmartContainer size="wide" className="px-4 sm:px-6 lg:px-8">
          <div className="py-20 sm:py-28">

            <ScrollReveal>
              <EyebrowLabel>操作步驟</EyebrowLabel>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-black sm:text-3xl">
                從探索到建立，步驟都很快
              </h2>
            </ScrollReveal>

            <StaggerGroup className="mt-10 grid gap-px overflow-hidden rounded-2xl bg-black/[0.07] sm:grid-cols-2">
              {howToSteps.map((item) => (
                <StaggerItem key={item.title}>
                  <div className="flex h-full flex-col bg-[#f4f3f0] p-6 sm:p-8">
                    <h3 className="text-sm font-semibold text-black">{item.title}</h3>
                    <ol className="mt-5 space-y-3">
                      {item.steps.map((step, index) => (
                        <li key={step} className="flex items-start gap-3 text-sm leading-6 text-black/55">
                          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/[0.06] text-[11px] font-semibold text-black/50">
                            {index + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGroup>

          </div>
        </SmartContainer>
      </div>

      {/* ── Section 3：常見問題 ── 白底，2欄 sticky 標題 + accordion */}
      <div className="bg-white">
        <SmartContainer size="wide" className="px-4 sm:px-6 lg:px-8">
          <div className="py-20 sm:py-28 lg:grid lg:grid-cols-[260px_1fr] lg:gap-20">

            <ScrollReveal className="lg:sticky lg:top-28 lg:self-start lg:pb-10">
              <EyebrowLabel>常見問題</EyebrowLabel>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-black sm:text-3xl">
                還有疑問？
              </h2>
              <p className="mt-4 text-sm leading-6 text-black/48">
                整理使用 PartyMatch 時最常遇到的問題與解答。
              </p>
            </ScrollReveal>

            <StaggerGroup className="mt-10 border-t border-black/8 lg:mt-0">
              {faqs.map((item) => (
                <FaqItem key={item.question} question={item.question} answer={item.answer} />
              ))}
            </StaggerGroup>

          </div>
        </SmartContainer>
      </div>

    </div>
  );
}
