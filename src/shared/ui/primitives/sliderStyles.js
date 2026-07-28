// Slider / RangeSlider 共用的把手樣式：實心圓點，取代瀏覽器預設樣式，
// 讓使用者一眼就看得出可以拖動
export const SLIDER_THUMB_DOT =
  'appearance-none bg-transparent ' +
  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 ' +
  '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand ' +
  '[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:cursor-pointer ' +
  '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full ' +
  '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-brand [&::-moz-range-thumb]:bg-white ' +
  '[&::-moz-range-thumb]:shadow [&::-moz-range-thumb]:cursor-pointer'

// 父層會加 pt-1 讓視覺軌道往下推了 4px，absolute 定位是相對於父層邊框（不含 padding），
// 用 inset-0 會讓 input 對齊到父層最頂端、跟往下推的軌道對不齊，圓點看起來會偏高，
// 所以統一用 top-1 明確對齊軌道實際的垂直位置
export const SLIDER_INPUT_POSITION = 'absolute left-0 right-0 top-1 h-1.5 w-full cursor-pointer'
