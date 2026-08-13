import { listServiceTypes } from '../../../common/utils/serviceUtils'
import ServiceLogo from '../../../components/ui/ServiceLogo'

const ALL_SERVICES = listServiceTypes()

// 上下邊界用漸層遮罩淡出，避免泡泡飄到容器邊緣被 overflow-hidden 硬生生切一半
const EDGE_MASK = 'linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)'

// 用 index 當種子算出穩定但看起來隨機的浮動參數，避免每次重新渲染時泡泡位置跳動
function pseudoRandom(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

// 每個泡泡依照「左/右側 × 在該側裡是第幾個」分配到一個不重疊的垂直格子（indexInBand／bandCount），
// 格子內再用亂數做小幅抖動，兩側各自左右也錯開一點水平位置，這樣才不會疊在一起，
// 又不會排得太規矩
function bubbleStyle(i, indexInBand, bandCount) {
  const onLeft = i % 2 === 0
  const bandStart = onLeft ? 3 : 76
  const left = bandStart + pseudoRandom(i * 3.1) * 17 // 兩側都留邊界，icon 本身寬度才不會被容器邊緣裁掉
  const slot = 88 / bandCount
  const bottom = 4 + indexInBand * slot + pseudoRandom(i * 6.5) * (slot * 0.5)
  const duration = 10 + pseudoRandom(i * 7.7) * 8
  const delay = -pseudoRandom(i * 5.3) * duration // 負值讓每顆一開始就在動畫中段，不會全部同時從底部浮起
  const drift = (pseudoRandom(i * 2.3) - 0.5) * 30
  const float = 80 + pseudoRandom(i * 9.1) * 60
  return {
    left: `${left}%`,
    bottom: `${bottom}%`,
    animation: `bubble-float ${duration}s ease-in-out ${delay}s infinite`,
    '--bubble-drift': `${drift}px`,
    '--bubble-float': `-${float}px`,
  }
}

// 純裝飾的服務 icon 浮動泡泡背景，由下往上緩緩飄浮、淡入淡出，不代表任何真實統計數字；
// 鋪滿 absolute inset-0，放在需要的容器裡當背景層（容器本身要 relative + overflow-hidden）
export default function BubbleField({ count = 7, size = 32 }) {
  const services = ALL_SERVICES.slice(0, count)
  const leftCount = Math.ceil(count / 2)
  const rightCount = count - leftCount

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ maskImage: EDGE_MASK, WebkitMaskImage: EDGE_MASK }}
      aria-hidden="true"
    >
      {services.map((s, i) => {
        const onLeft = i % 2 === 0
        const indexInBand = Math.floor(i / 2)
        const bandCount = onLeft ? leftCount : rightCount
        return (
          <div key={s.id} className="absolute" style={bubbleStyle(i, indexInBand, bandCount)}>
            <ServiceLogo serviceId={s.id} size={size} className="shadow-card" />
          </div>
        )
      })}
    </div>
  )
}
