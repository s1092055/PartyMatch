import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { ChevronDownIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleIconSolid } from "@heroicons/react/24/solid";
import {
  CREATE_GROUP_CONTACT_OPTIONS,
  CREATE_GROUP_JOIN_POLICY_OPTIONS,
  CREATE_GROUP_REMINDER_OPTIONS,
} from "../utils/createGroupDefaults.js";

const MotionDiv = motion.div;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function AccordionSection({
  title,
  open,
  onToggle,
  completed = false,
  optional = false,
  children,
}) {
  return (
    <section className="border-b border-black/8 pb-6 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-1 text-left"
      >
        <div className="flex items-center gap-3">
          {completed ? (
            <CheckCircleIconSolid className="h-5 w-5 text-emerald-500" />
          ) : (
            <CheckCircleIcon className="h-5 w-5 text-black/30" />
          )}
          <span className="text-base font-semibold text-black">
            {title}
          </span>
          {optional ? (
            <span className="rounded-full border border-black/10 px-2 py-0.5 text-[11px] font-medium text-black/40">
              選填
            </span>
          ) : null}
        </div>
        <ChevronDownIcon
          className={[
            "h-5 w-5 shrink-0 text-black/38 transition-transform duration-200",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <MotionDiv
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-4">{children}</div>
          </MotionDiv>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function SeatStepper({ value, min, max, onChange }) {
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="max-w-xl text-sm leading-6 text-black/48">
        先決定這次要對外招募幾個席次，系統會依方案上限自動限制範圍。
      </div>

      <div className="flex items-center justify-between rounded-[24px] bg-white px-4 py-4 lg:min-w-[300px]">
        <button
          type="button"
          onClick={() => canDecrease && onChange(value - 1)}
          disabled={!canDecrease}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-xl font-semibold text-black transition hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>

        <div className="text-center">
          <div className="text-3xl font-semibold tracking-tight text-black">
            {value}
          </div>
          <div className="mt-1 text-xs text-black/36">
            {min} – {max} 位可選
          </div>
        </div>

        <button
          type="button"
          onClick={() => canIncrease && onChange(value + 1)}
          disabled={!canIncrease}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-xl font-semibold text-black transition hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function CreateGroupStep3Settings({
  form,
  onChange,
  errors,
  plan,
  derived,
}) {
  const minAvailableSeats = derived.minSeats ?? plan?.minAvailableSeats ?? 1;
  const maxAvailableSeats =
    derived.maxSeats ?? plan?.maxAvailableSeats ?? minAvailableSeats;
  const availableSeats = derived.availableSeats ?? minAvailableSeats;
  const [openSection, setOpenSection] = useState("seats");

  const seatsComplete =
    Number.isFinite(Number(availableSeats)) &&
    availableSeats >= minAvailableSeats &&
    availableSeats <= maxAvailableSeats;
  const joinComplete = Boolean(String(form.joinPolicy ?? "").trim());
  const overviewComplete = Boolean(String(form.groupDescription ?? "").trim());
  const rulesComplete = Boolean(String(form.memberRule ?? "").trim());
  const reminderComplete = Boolean(String(form.paymentReminder ?? "").trim());
  const contactComplete = Boolean(String(form.contactMethod ?? "").trim());
  const completionMap = {
    seats: seatsComplete,
    join: joinComplete,
    overview: overviewComplete,
    rules: rulesComplete,
    reminder: reminderComplete,
    contact: contactComplete,
  };

  function setAvailableSeats(nextValue) {
    const clamped = clamp(nextValue, minAvailableSeats, maxAvailableSeats);
    onChange("availableSeats", String(clamped));
  }

  function toggleSection(sectionId) {
    setOpenSection((current) => (current === sectionId ? null : sectionId));
  }

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr] gap-5 overflow-hidden">
      <div className="space-y-2">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-black/34">
          步驟 3
        </div>
        <div className="text-3xl font-semibold tracking-tight text-black sm:text-4xl lg:text-[3rem]">
          群組設定
        </div>
      </div>

      <div className="min-h-0 overflow-y-auto scrollbar-none pr-1 mt-6">
        <div className="space-y-6 pb-4">
          <AccordionSection
            title="開放名額設定"
            open={openSection === "seats"}
            onToggle={() => toggleSection("seats")}
            completed={completionMap.seats}
          >
            <SeatStepper
              value={availableSeats}
              min={minAvailableSeats}
              max={maxAvailableSeats}
              onChange={setAvailableSeats}
            />
            {errors.availableSeats ? (
              <div className="pt-3 text-sm font-medium text-red-600">
                {errors.availableSeats}
              </div>
            ) : null}
          </AccordionSection>

          <AccordionSection
            title="申請條件"
            open={openSection === "join"}
            onToggle={() => toggleSection("join")}
            completed={completionMap.join}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {CREATE_GROUP_JOIN_POLICY_OPTIONS.map((option) => {
                const active = form.joinPolicy === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange("joinPolicy", option.value)}
                    className={[
                      "rounded-[22px] border px-4 py-4 text-left transition",
                      active
                        ? "border-black/28 bg-black text-white"
                        : "border-black/10 bg-white text-black hover:border-black/22 hover:bg-black/[0.02]",
                    ].join(" ")}
                  >
                    <div className="text-sm font-semibold">{option.label}</div>
                    <div
                      className={[
                        "mt-2 text-sm leading-6",
                        active ? "text-white/72" : "text-black/55",
                      ].join(" ")}
                    >
                      {option.description}
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.joinPolicy ? (
              <div className="pt-3 text-sm font-medium text-red-600">
                {errors.joinPolicy}
              </div>
            ) : null}
          </AccordionSection>

          <AccordionSection
            title="群組簡介"
            open={openSection === "overview"}
            onToggle={() => toggleSection("overview")}
            completed={completionMap.overview}
          >
            <textarea
              value={form.groupDescription}
              onChange={(event) => onChange("groupDescription", event.target.value)}
              rows={5}
              className="h-28 w-full resize-none rounded-[22px] border border-black/10 bg-black/[0.02] px-4 py-3 text-sm leading-7 text-black focus:outline-none focus:ring-2 focus:ring-black/10"
              placeholder="例如：這團偏長期穩定續用，習慣月初對帳、確認付款後才會送出新的共享資訊。"
            />
            {errors.groupDescription ? (
              <div className="pt-3 text-sm font-medium text-red-600">
                {errors.groupDescription}
              </div>
            ) : null}
          </AccordionSection>

          <AccordionSection
            title="申請須知"
            open={openSection === "rules"}
            onToggle={() => toggleSection("rules")}
            completed={completionMap.rules}
          >
            <textarea
              value={form.memberRule}
              onChange={(event) => onChange("memberRule", event.target.value)}
              rows={5}
              className="h-28 w-full resize-none rounded-[22px] border border-black/10 bg-black/[0.02] px-4 py-3 text-sm leading-7 text-black focus:outline-none focus:ring-2 focus:ring-black/10"
              placeholder="例如：付款確認後才會提供加入資訊；若 24 小時內未回覆，名額會依序遞補給下一位申請者。"
            />
            {errors.memberRule ? (
              <div className="pt-3 text-sm font-medium text-red-600">
                {errors.memberRule}
              </div>
            ) : null}
          </AccordionSection>

          <AccordionSection
            title="付款提醒時間"
            open={openSection === "reminder"}
            onToggle={() => toggleSection("reminder")}
            completed={completionMap.reminder}
            optional
          >
            <div className="grid gap-3 sm:grid-cols-3">
              {CREATE_GROUP_REMINDER_OPTIONS.map((option) => {
                const active = form.paymentReminder === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange("paymentReminder", option.value)}
                    className={[
                      "rounded-[22px] border px-4 py-4 text-left transition",
                      active
                        ? "border-black/28 bg-black text-white"
                        : "border-black/10 bg-white text-black hover:border-black/22 hover:bg-black/[0.02]",
                    ].join(" ")}
                  >
                    <div className="text-sm font-semibold">{option.label}</div>
                    <div
                      className={[
                        "mt-2 text-sm leading-6",
                        active ? "text-white/72" : "text-black/55",
                      ].join(" ")}
                    >
                      {option.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </AccordionSection>

          <AccordionSection
            title="聯絡方式"
            open={openSection === "contact"}
            onToggle={() => toggleSection("contact")}
            completed={completionMap.contact}
            optional
          >
            <div className="grid gap-3 sm:grid-cols-3">
              {CREATE_GROUP_CONTACT_OPTIONS.map((option) => {
                const active = form.contactMethod === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange("contactMethod", option.value)}
                    className={[
                      "rounded-[22px] border px-4 py-4 text-left transition",
                      active
                        ? "border-black/28 bg-black text-white"
                        : "border-black/10 bg-white text-black hover:border-black/22 hover:bg-black/[0.02]",
                    ].join(" ")}
                  >
                    <div className="text-sm font-semibold">{option.label}</div>
                    <div
                      className={[
                        "mt-2 text-sm leading-6",
                        active ? "text-white/72" : "text-black/55",
                      ].join(" ")}
                    >
                      {option.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </AccordionSection>
        </div>
      </div>
    </div>
  );
}
