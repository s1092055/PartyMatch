import { clsx } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// index.css 的 @theme 還宣告了 --radius-card／--radius-inner／--radius-control／--radius-badge
// 這幾個自訂圓角 token（對應 rounded-card／rounded-inner／rounded-control／rounded-badge），
// tailwind-merge 預設不認得這些自訂 suffix，會誤判成不同 class group、兩個都保留，
// 實際套用哪個變成看 Tailwind 產出 CSS 的順序決定，不是看 className 傳入順序——
// 例如 <Button className="rounded-full"> 想蓋掉 Button 內建的 rounded-inner 會蓋不掉。
// 這裡把它們一併註冊進 tailwind-merge 內建的 rounded class group，才能正確互相覆蓋
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      rounded: ['rounded-card', 'rounded-inner', 'rounded-control', 'rounded-badge'],
    },
  },
})

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
