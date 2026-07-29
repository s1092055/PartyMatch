import { useState } from 'react'
import { Monitor, Tablet, Smartphone } from 'lucide-react'
import Modal from '../../../shared/ui/primitives/Modal'
import { MacFrame, IPadFrame, IPhoneFrame } from '../../../shared/ui/DeviceFrame'

const DEVICES = [
  { key: 'mac', icon: Monitor, label: '桌機' },
  { key: 'tablet', icon: Tablet, label: '平板' },
  { key: 'phone', icon: Smartphone, label: '手機' },
]

// 同一張截圖依選取的裝置切換外框比例顯示，右下角小切換鈕控制；配合下方步驟點
// 循環切換不同畫面，呈現「這個流程從頭到尾長怎樣」；截圖來源見 DeviceFrame.jsx 註解
export default function DeviceShowcase({ screenshots, title }) {
  const [step, setStep] = useState(0)
  const [device, setDevice] = useState('mac')
  const [zoomed, setZoomed] = useState(false)
  const src = screenshots[step]
  const stepLabel = `${title} 第 ${step + 1} 步`

  return (
    <div className="w-full">
      <div className="relative">
        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-label={`放大查看：${stepLabel}`}
          className="block w-full cursor-zoom-in"
        >
          {device === 'mac' && <MacFrame src={src} alt={stepLabel} className="w-full" />}
          {device === 'tablet' && <IPadFrame src={src} alt={stepLabel} className="mx-auto w-52 md:w-60" />}
          {device === 'phone' && <IPhoneFrame src={src} alt={stepLabel} className="mx-auto w-40 md:w-48" />}
        </button>

        <div className="absolute bottom-2.5 right-2.5 flex gap-0.5 rounded-full border border-line bg-white/95 p-1 shadow-sm backdrop-blur">
          {DEVICES.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setDevice(key)}
              aria-label={`切換為${label}畫面`}
              aria-pressed={device === key}
              className={`grid h-7 w-7 place-items-center rounded-full transition-colors ${
                device === key ? 'bg-brand text-white' : 'text-ink-3 hover:bg-raised'
              }`}
            >
              <Icon size={14} strokeWidth={1.5} />
            </button>
          ))}
        </div>
      </div>

      {screenshots.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-1.5 md:justify-start">
          {screenshots.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i)}
              aria-label={`查看第 ${i + 1} 步`}
              className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-brand' : 'w-1.5 bg-line'}`}
            />
          ))}
        </div>
      )}

      <Modal isOpen={zoomed} onClose={() => setZoomed(false)} title={stepLabel} maxWidth="max-w-4xl">
        <img src={src} alt={stepLabel} className="w-full" />
      </Modal>
    </div>
  )
}
