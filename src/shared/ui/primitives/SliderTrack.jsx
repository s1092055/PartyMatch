// Slider / RangeSlider 共用的外層容器與軌道：負責 disabled 淡化樣式、灰色底軌，
// 以及依 fillStyle 定位的品牌色填色區塊；實際的 <input type="range"> 由呼叫端當 children 傳入
export default function SliderTrack({ disabled = false, className = '', fillStyle, children }) {
  return (
    <div className={`relative pt-1 ${disabled ? 'opacity-40' : ''} ${className}`}>
      <div className="relative h-1.5 rounded-full bg-line">
        <div className="absolute h-full rounded-full bg-brand" style={fillStyle} />
      </div>
      {children}
    </div>
  )
}
