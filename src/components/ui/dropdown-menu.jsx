import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui'
import { Check, Circle, MoreVertical } from 'lucide-react'
import { cn } from '../../lib/utils'

export function DropdownMenu(props) {
  return <DropdownMenuPrimitive.Root {...props} />
}

export function DropdownMenuTrigger(props) {
  return <DropdownMenuPrimitive.Trigger {...props} />
}

// 訊息中心／通知中心的篩選按鈕共用同一顆「三個點」觸發鈕：有篩選條件生效時亮品牌色，
// 沒有就是預設灰階，兩邊呼叫端只要算好自己的 active 布林值丟進來，不用各自重寫一次樣式
export function DropdownMenuFilterTrigger({ active, ariaLabel = '篩選' }) {
  return (
    <DropdownMenuTrigger asChild>
      <button
        type="button"
        aria-label={ariaLabel}
        className={cn(
          'grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition-colors',
          active
            ? 'border-brand-border bg-brand-subtle text-brand'
            : 'border-line text-ink-3 hover:bg-raised hover:text-ink'
        )}
      >
        <MoreVertical size={16} strokeWidth={1.5} />
      </button>
    </DropdownMenuTrigger>
  )
}

export function DropdownMenuContent({ className, sideOffset = 6, align = 'end', ...props }) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        align={align}
        className={cn(
          // Dialog（panel 版）是 z-[65]，這個選單常常從 Dialog 內部的觸發點開，
          // 要比所有現有 Dialog variant 都高才不會被蓋住；max-h-72 跟 FilterSelect 的下拉
          // 清單同一個高度慣例，選項一多就用捲動而不是把選單整個拉得很長
          'z-[80] min-w-40 max-h-72 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden animate-select-in rounded-lg border border-line bg-surface p-1 outline-none',
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

export function DropdownMenuLabel({ className, ...props }) {
  return <DropdownMenuPrimitive.Label className={cn('px-2 py-1 text-xs font-semibold text-ink-4', className)} {...props} />
}

export function DropdownMenuItem({ className, ...props }) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        'flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold text-ink-2 outline-none data-[highlighted]:bg-raised data-[highlighted]:text-ink',
        className
      )}
      {...props}
    />
  )
}

export function DropdownMenuSeparator({ className, ...props }) {
  return <DropdownMenuPrimitive.Separator className={cn('my-1 h-px bg-line-subtle', className)} {...props} />
}

export function DropdownMenuRadioGroup(props) {
  return <DropdownMenuPrimitive.RadioGroup {...props} />
}

export function DropdownMenuRadioItem({ className, children, ...props }) {
  return (
    <DropdownMenuPrimitive.RadioItem
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-md py-1.5 pl-7 pr-2 text-sm text-ink-2 outline-none data-[highlighted]:bg-raised data-[highlighted]:text-ink',
        className
      )}
      {...props}
    >
      <DropdownMenuPrimitive.ItemIndicator className="absolute left-1.5 inline-flex items-center">
        <Circle size={8} strokeWidth={0} className="fill-brand" />
      </DropdownMenuPrimitive.ItemIndicator>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

// 「標題 + 一組單選項 + 分隔線」是訊息/通知篩選選單裡重複最多次的結構（顯示範圍／身分／
// 群組狀態／排序都是同一個形狀），包成一個小元件讓呼叫端一行搞定一個篩選區塊
export function DropdownMenuRadioSection({ label, options, value, onValueChange }) {
  return (
    <>
      <DropdownMenuLabel>{label}</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
        {options.map(opt => (
          <DropdownMenuRadioItem key={opt.id} value={opt.id}>
            {opt.label}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
      <DropdownMenuSeparator />
    </>
  )
}

export function DropdownMenuCheckboxItem({ className, children, checked, ...props }) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      checked={checked}
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-md py-1.5 pl-7 pr-2 text-sm text-ink-2 outline-none data-[highlighted]:bg-raised data-[highlighted]:text-ink',
        className
      )}
      {...props}
    >
      <DropdownMenuPrimitive.ItemIndicator className="absolute left-1.5 inline-flex items-center">
        <Check size={14} strokeWidth={2.5} className="text-brand" />
      </DropdownMenuPrimitive.ItemIndicator>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}
