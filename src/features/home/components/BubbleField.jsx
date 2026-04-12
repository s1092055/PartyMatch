import ServiceLogo from '../../../components/ui/ServiceLogo'
import { ALL_SERVICES } from '../data/allServices'

const EDGE_MASK = 'linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)';

function pseudoRandom(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

function bubbleStyle(i, indexInBand, bandCount) {
  const onLeft = i % 2 === 0
  const bandStart = onLeft ? 3 : 76
  const left = bandStart + pseudoRandom(i * 3.1) * 17;
  const slot = 88 / bandCount
  const bottom = 4 + indexInBand * slot + pseudoRandom(i * 6.5) * (slot * 0.5)
  const duration = 6 + pseudoRandom(i * 7.7) * 5
  const delay = -pseudoRandom(i * 5.3) * duration;
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
