import { cn } from "../../lib/utils"

// 邊框／背景／focus 樣式都放在外層 wrapper、用 :focus-within 觸發，不是直接在
// <input>/<textarea> 本身用 :focus——全站有一條「滑鼠操作一律不顯示 focus 外框」
// 的規則（index.css 的 html.using-mouse *:focus 那段），它只會壓掉「元素自己
// 被 :focus 匹配」的樣式，wrapper 是靠子元素觸發的 :focus-within，不會被那條
// 規則壓掉，滑鼠點擊也能穩定看到同一圈 focus ring，跟 AuthInput／PhoneInput
// 用的是同一套做法
const WRAPPER_BASE = 'flex items-center rounded-control border border-line bg-surface px-3.5 py-2.5 transition-[box-shadow] focus-within:ring-4 focus-within:ring-brand-subtle has-[:disabled]:cursor-not-allowed has-[:disabled]:bg-raised'
const FIELD_BASE = 'w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-ink-4 disabled:cursor-not-allowed disabled:text-ink-3'

export function Input({ className, endAdornment, ...props }) {
  return (
    <span className={cn(WRAPPER_BASE, className)}>
      <input className={FIELD_BASE} {...props} />
      {endAdornment}
    </span>
  )
}

export function Textarea({ className, ...props }) {
  return (
    // items-stretch：外層 span 的高度由呼叫端的 className（flex-1、min-h-* 等）決定，
    // 內層 textarea 要撐滿整個 span，不能卡在自己的 intrinsic height
    <span className={cn(WRAPPER_BASE, 'items-stretch', className)}>
      <textarea className={cn(FIELD_BASE, 'resize-none')} {...props} />
    </span>
  )
}
