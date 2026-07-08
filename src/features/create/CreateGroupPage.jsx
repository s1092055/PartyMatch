import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Eye, Info } from 'lucide-react'
import FlowLayout from '../../shared/layout/FlowLayout'
import SlideTrack, { SlidePanel } from '../../shared/ui/SlideTrack'
import LivePreviewPanel from './components/LivePreviewPanel'
import Step1Service from './components/steps/Step1Service'
import Step2Plan from './components/steps/Step2Plan'
import Step3Settings from './components/steps/Step3Settings'
import Step4Preview from './components/steps/Step4Preview'
import Button from '../../shared/ui/Button'
import { useGroupStore } from '../../shared/stores/useGroupStore'
import { useNotificationStore } from '../../shared/stores/useNotificationStore'
import { getServiceById } from '../../shared/utils/serviceUtils'
import { useAuthStore } from '../../shared/stores/useAuthStore'

const STEP_COMPONENTS = [Step1Service, Step2Plan, Step3Settings, Step4Preview]

const INITIAL_FORM = {
  serviceId: '',
  planName: '',
  pricePerSeat: 0,
  billingCycle: 'monthly',
  totalSeats: 2,
  requirements: '',
  rules: [''],
}

function mapFormToGroup(form) {
  const service = getServiceById(form.serviceId)
  const plan = service?.plans.find(p => p.name === form.planName)
  const totalSeats = form.totalSeats
  const rules = form.rules.map(r => r.trim()).filter(Boolean)
  const tags = [...new Set([...(plan?.tags ?? []), service?.category].filter(Boolean))]

  return {
    serviceId: form.serviceId,
    serviceName: service?.fullName ?? service?.name ?? form.serviceId,
    planName: form.planName,
    pricePerSeat: form.pricePerSeat || 0,
    billingCycle: form.billingCycle,
    totalSeats,
    usedSeats: 1,
    openSeats: totalSeats - 1,
    joinMode: 'approval',
    requirements: form.requirements.trim(),
    rules,
    tags,
    status: 'recruiting',
  }
}

function getStepErrors(step, form) {
  const errors = []
  const rules = form.rules.map(rule => rule.trim()).filter(Boolean)

  switch (step) {
    case 1:
      if (!form.serviceId) errors.push('請選擇一個訂閱服務')
      break
    case 2:
      if (!form.planName) errors.push('請選擇方案')
      break
    case 3: {
      const service = getServiceById(form.serviceId)
      const plan = service?.plans.find(p => p.name === form.planName)
      const maxSeats = plan?.maxSeats ?? 10
      if (!Number.isInteger(form.totalSeats) || form.totalSeats < 2 || form.totalSeats > maxSeats) {
        errors.push(`開放名額需介於 1 至 ${maxSeats - 1} 位`)
      }
      if (rules.length > 5) errors.push('群組規則最多 5 條')
      if (rules.some(rule => rule.length > 80)) errors.push('每條群組規則最多 80 字')
      break
    }
    default:
      break
  }

  return errors
}

function getFirstInvalidStep(form) {
  return [1, 2, 3].find(step => getStepErrors(step, form).length > 0) ?? null
}

function calcPricePerSeat(plan, seats, billingCycle) {
  if (billingCycle === 'yearly' && plan.yearlyPrice) {
    return Math.ceil(plan.yearlyPrice / seats / 12)
  }
  return Math.ceil(plan.monthlyPrice / seats)
}

export default function CreateGroupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  function leaveFlow() {
    if (location.key === 'default') navigate('/')
    else navigate(-1)
  }
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(INITIAL_FORM)
  const [showPreview, setShowPreview] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  function onChange(key, value) {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'serviceId') {
        next.planName = ''
        next.pricePerSeat = 0
        next.totalSeats = 2
      }
      if (key === 'planName') {
        const service = getServiceById(next.serviceId)
        const plan = service?.plans.find(p => p.name === value)
        if (plan) {
          next.totalSeats = plan.maxSeats
          next.pricePerSeat = calcPricePerSeat(plan, plan.maxSeats, next.billingCycle)
        }
      }
      if (key === 'totalSeats') {
        const service = getServiceById(next.serviceId)
        const plan = service?.plans.find(p => p.name === next.planName)
        if (plan) next.pricePerSeat = calcPricePerSeat(plan, value, next.billingCycle)
      }
      if (key === 'billingCycle') {
        const service = getServiceById(next.serviceId)
        const plan = service?.plans.find(p => p.name === next.planName)
        if (plan) next.pricePerSeat = calcPricePerSeat(plan, next.totalSeats, value)
      }
      return next
    })
  }

  const stepErrors = getStepErrors(step, form)
  function canNext() {
    return stepErrors.length === 0
  }

  function handleNext() {
    if (canNext() && step < 4) { setStep(s => s + 1); setShowPreview(false) }
  }

  function handleBack() {
    if (step > 1) { setStep(s => s - 1); setShowPreview(false) }
    else leaveFlow()
  }

  function handleSubmit() {
    const firstInvalidStep = getFirstInvalidStep(form)
    if (firstInvalidStep) {
      setStep(firstInvalidStep)
      return
    }

    const groupData = mapFormToGroup(form)
    const host = useAuthStore.getState().getProfile()
    const group = useGroupStore.getState().create(groupData, host)
    if (host) {
      useNotificationStore.getState().create({
        userId:  host.id,
        type:    'group_created',
        title:   '群組已成功建立',
        message: `「${group.serviceName}」群組已上架，開始招募成員中！`,
        meta:    { groupId: group.id },
      })
    }
    window.dispatchEvent(new CustomEvent('pm:group-created', { detail: { groupId: group.id } }))
    setStep(5)
  }

  const footer = step <= 4 && (
    <>
      <Button variant="secondary" size="md" className="flex-1" onClick={handleBack}>
        <ChevronLeft size={15} />
        {step === 1 ? '取消' : '上一步'}
      </Button>
      {step < 4 ? (
        <Button variant="primary" size="md" className="flex-1" disabled={!canNext()} onClick={handleNext}>
          下一步
          <ChevronRight size={15} />
        </Button>
      ) : (
        <Button variant="success" size="md" className="flex-1" disabled={!agreedToTerms} onClick={handleSubmit}>
          確認建立
        </Button>
      )}
    </>
  )

  const service = getServiceById(form.serviceId)
  const desc = step === 1
    ? service?.description
    : step === 2
      ? service?.plans.find(p => p.name === form.planName)?.description
      : null
  const showErrors = stepErrors.length > 0 && step < 4

  return (
    <FlowLayout onBack={leaveFlow} progress={(Math.min(step, 4) / 4) * 100} bottomNav={footer}>
      <SlideTrack activeIndex={step - 1} count={5}>
        {STEP_COMPONENTS.map((StepN, i) => {
          const n = i + 1
          return (
            <SlidePanel key={n} count={5}>
              <div className="relative flex flex-col gap-4 py-4 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1">
                  <StepN form={form} onChange={onChange} agreedToTerms={agreedToTerms} onAgreeChange={setAgreedToTerms} />
                  <div className="mt-4 space-y-2">
                    {n === step && desc && (
                      <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                        <Info size={14} className="mt-0.5 shrink-0 text-blue-400" />
                        <p className="text-xs leading-relaxed text-blue-700">{desc}</p>
                      </div>
                    )}
                    {n === step && showErrors && (
                      <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
                        <AlertCircle size={13} className="shrink-0" />
                        <span>{stepErrors[0]}</span>
                      </div>
                    )}
                  </div>
                </div>
                {n < 4 && (
                  <div className="hidden shrink-0 lg:block lg:w-72">
                    <LivePreviewPanel form={form} />
                  </div>
                )}
                {n < 4 && (
                  <button
                    onClick={() => setShowPreview(true)}
                    className="absolute right-0 top-4 flex items-center gap-1.5 rounded-full border border-line px-3 h-8 text-xs font-bold text-ink-2 transition-colors hover:bg-raised hover:text-ink lg:hidden"
                    aria-label="顯示預覽"
                  >
                    <Eye size={14} />
                    顯示預覽
                  </button>
                )}
              </div>
            </SlidePanel>
          )
        })}

        <SlidePanel count={5}>
          <div className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
            <h3 className="mb-1 text-lg font-extrabold text-ink">群組已成功上架！</h3>
            <p className="text-sm leading-relaxed text-ink-3">你的群組現在已開放招募成員</p>
            <div className="mt-6 flex w-full max-w-xs gap-3">
              <Button variant="secondary" size="md" className="flex-1" onClick={() => navigate('/')}>
                返回首頁
              </Button>
              <Button variant="success" size="md" className="flex-1" onClick={() => navigate('/my-groups?view=host')}>
                前往群組管理
              </Button>
            </div>
          </div>
        </SlidePanel>
      </SlideTrack>

      {showPreview && step < 4 && (
        <div
          className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 lg:hidden"
          onClick={() => setShowPreview(false)}
        >
          <div className="mx-6 w-full max-w-xs" onClick={e => e.stopPropagation()}>
            <LivePreviewPanel form={form} />
          </div>
        </div>
      )}
    </FlowLayout>
  )
}
