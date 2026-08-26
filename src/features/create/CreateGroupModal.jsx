import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ChevronLeft, ChevronRight, Info, PlusCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogCloseButton } from '../../components/ui/dialog'
import Step1Service from './components/steps/Step1Service'
import Step2Plan from './components/steps/Step2Plan'
import Step3Settings from './components/steps/Step3Settings'
import Step4Preview from './components/steps/Step4Preview'
import { Button } from '../../components/ui/button'
import ServiceLogo from '../../components/ui/ServiceLogo'
import TokenAmount from '../../components/ui/TokenAmount'
import LivePreviewPanel from './components/LivePreviewPanel'
import { useGroupStore } from '../../common/stores/useGroupStore'
import { getServiceById } from '../../common/utils/serviceUtils'
import { calcPricePerSeat, calcDisplayPrice } from '../../common/utils/pricingUtils'
import { useAuthStore } from '../../common/stores/useAuthStore'
import { toast } from '../../common/utils/toast'

const STEP_COMPONENTS = [Step1Service, Step2Plan, Step3Settings, Step4Preview]
const STEP_TITLES = ['選擇服務', '選擇方案', '群組設定', '最後確認']

const INITIAL_FORM = {
  serviceId: '',
  planName: '',
  pricePerSeat: 0,
  billingCycle: 'monthly',
  totalSeats: 2,
  minCreditScore: 0,
  requirements: '',
  rules: ['', '', '', '', ''],
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
    maxMembers: totalSeats,
    usedSeats: 1,
    openSeats: totalSeats - 1,
    joinMode: 'approval',
    minCreditScore: form.minCreditScore || 0,
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
      if (!form.serviceId) errors.push('請選擇一項訂閱服務')
      break
    case 2:
      if (!form.planName) errors.push('請選擇一項訂閱方案')
      break
    case 3: {
      const service = getServiceById(form.serviceId)
      const plan = service?.plans.find(p => p.name === form.planName)
      const maxSeats = plan?.maxSeats ?? 10
      if (!Number.isInteger(form.totalSeats) || form.totalSeats < 2 || form.totalSeats > maxSeats) {
        errors.push(`開放名額需介於 2 至 ${maxSeats} 人`)
      }
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

export default function CreateGroupModal() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(INITIAL_FORM)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const bodyRef = useRef(null)

  useEffect(() => {
    function onOpen() {
      setStep(1)
      setForm(INITIAL_FORM)
      setAgreedToTerms(false)
      setShowPreview(false)
      setShowSuccessModal(false)
      setOpen(true)
    }
    window.addEventListener('pm:open-create-group', onOpen)
    return () => window.removeEventListener('pm:open-create-group', onOpen)
  }, [])

  const isPlanOrSettingsStep = step === 2 || step === 3

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
          next.billingCycle = plan.billingCycle
          next.pricePerSeat = calcPricePerSeat(plan, plan.maxSeats)
        }
      }
      if (key === 'totalSeats') {
        const service = getServiceById(next.serviceId)
        const plan = service?.plans.find(p => p.name === next.planName)
        if (plan) next.pricePerSeat = calcPricePerSeat(plan, value)
      }
      return next
    })
  }

  const stepErrors = getStepErrors(step, form)
  function canNext() {
    return stepErrors.length === 0
  }

  function handleNext() {
    if (canNext() && step < 4) {
      setStep(s => s + 1)
      bodyRef.current?.scrollTo({ top: 0 })
    }
  }

  function handleBack() {
    if (step <= 1) {
      setOpen(false)
      return
    }
    setStep(s => s - 1)
    bodyRef.current?.scrollTo({ top: 0 })
  }

  function handleSubmit() {
    const firstInvalidStep = getFirstInvalidStep(form)
    if (firstInvalidStep) {
      setStep(firstInvalidStep)
      return
    }

    const groupData = mapFormToGroup(form)
    const host = useAuthStore.getState().getProfile()
    useGroupStore.getState().create(groupData, host)
    toast('群組已成功上架！');
    setShowSuccessModal(true)
  }

  function handleSuccessClose(destination) {
    setShowSuccessModal(false)
    setOpen(false)
    navigate(destination)
  }

  const service = getServiceById(form.serviceId)
  const hasEligiblePlans = (service?.plans ?? []).some(p => p.maxSeats > 1)
  const visibleStepErrors = stepErrors.filter(err =>
    err !== '請選擇一項訂閱服務' && (err !== '請選擇一項訂閱方案' || hasEligiblePlans)
  )

  const banner = (() => {
    if (step === 1) {
      return { Icon: form.serviceId ? Info : AlertCircle, text: '請選擇一項訂閱服務' }
    }
    if (step === 2) {
      if (!hasEligiblePlans) return { Icon: AlertCircle, text: '此服務無合購方案，請返回上一步選擇其他服務' }
      if (visibleStepErrors.length > 0) return { Icon: AlertCircle, text: visibleStepErrors[0] }
      return { Icon: Info, text: '請選擇一項訂閱方案' }
    }
    if (step === 3) {
      if (visibleStepErrors.length > 0) return { Icon: AlertCircle, text: visibleStepErrors[0] }
      return { Icon: Info, text: '請設定群組資訊' }
    }
    if (step === 4) return { Icon: Info, text: '請確認以下資訊正確無誤，並詳閱服務條款' }
    return null
  })()

  const CurrentStep = STEP_COMPONENTS[step - 1]

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent maxWidth="max-w-4xl" height="min(90dvh, 820px)">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle size={18} className="shrink-0 text-brand" strokeWidth={1.5} />
              建立群組
            </DialogTitle>
            <DialogDescription>選擇服務、方案並設定群組資訊以建立共享群組</DialogDescription>
            <DialogCloseButton />
          </DialogHeader>

          <div className="shrink-0 border-b border-line bg-raised/70 px-6 py-3">
            <div className="mb-2 flex items-center gap-1.5">
              {STEP_TITLES.map((label, i) => (
                <div
                  key={label}
                  className={`h-1 flex-1 rounded-full transition-colors ${i < step ? 'bg-brand' : 'bg-line'}`}
                />
              ))}
            </div>
            <div className="mb-2 flex gap-1">
              {STEP_TITLES.map((label, i) => (
                <span
                  key={label}
                  className={`flex-1 truncate text-center text-xs font-bold ${i + 1 === step ? 'text-brand' : 'text-ink-3'}`}
                >
                  {label}
                </span>
              ))}
            </div>
            {banner && (
              <div className="flex items-center justify-center gap-2 text-xs font-medium text-brand">
                <banner.Icon size={14} />
                {banner.text}
              </div>
            )}
          </div>

          <div
            ref={bodyRef}
            className="min-h-0 flex-1 overflow-y-auto px-6 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div key={step} className="animate-step-slide-up">
              {isPlanOrSettingsStep && (
                <div className="mb-5 flex shrink-0 items-center gap-4 rounded-2xl border border-line bg-surface px-6 py-5 shadow-card">
                  <ServiceLogo serviceId={form.serviceId} size={56} className="shrink-0 border-line-strong" />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-black text-ink">{service?.fullName ?? '尚未選擇服務'}</h2>
                    <p className="truncate text-sm text-ink-3">{form.planName || '尚未選擇方案'}</p>
                  </div>
                  {form.planName && (
                    <div className="shrink-0 text-right">
                      <p className="mb-0.5 text-xs font-medium text-ink-4">每位</p>
                      <TokenAmount
                        amount={calcDisplayPrice(form.pricePerSeat, form.billingCycle)}
                        cycle={form.billingCycle}
                        align="center"
                        badgeSize="!h-6 !w-6"
                        unitClassName="!text-xl"
                        className="text-2xl font-black text-ink"
                      />
                    </div>
                  )}
                </div>
              )}
              {step === 4 ? (
                <Step4Preview form={form} agreedToTerms={agreedToTerms} onAgreeChange={setAgreedToTerms} onShowPreview={() => setShowPreview(true)} />
              ) : (
                <CurrentStep form={form} onChange={onChange} />
              )}
            </div>
          </div>

          <DialogFooter className="justify-between">
            <Button variant="secondary" size="md" className="w-36" onClick={handleBack}>
              <ChevronLeft size={15} strokeWidth={1.5} />
              {step === 1 ? '取消' : '上一步'}
            </Button>
            {step < 4 ? (
              <Button variant="default" size="md" className="w-36" disabled={!canNext()} onClick={handleNext}>
                下一步
                <ChevronRight size={15} strokeWidth={1.5} />
              </Button>
            ) : (
              <Button variant="default" size="md" className="w-36" disabled={!agreedToTerms} onClick={handleSubmit}>
                確認建立
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showPreview && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 px-4 md:px-8"
          onClick={() => setShowPreview(false)}
        >
          <div className="mx-auto w-full max-w-xs" onClick={e => e.stopPropagation()}>
            <LivePreviewPanel form={form} />
          </div>
        </div>
      )}

      <Dialog open={showSuccessModal} onOpenChange={() => {}}>
        <DialogContent maxWidth="max-w-sm">
          <DialogTitle className="sr-only">群組已成功上架</DialogTitle>
          <DialogDescription>群組已成功上架</DialogDescription>
          <div className="flex flex-col items-center px-6 py-8 text-center">
            <ServiceLogo serviceId={form.serviceId} size={56} className="mb-4 border-line-strong" />
            <p className="text-sm font-bold text-ink">{service?.fullName ?? service?.name}</p>
            <p className="text-sm text-ink-3">{form.planName}</p>
            <h3 className="mt-3 text-lg font-extrabold text-ink">群組已成功上架！</h3>
            <div className="mt-6 flex w-full gap-3">
              <Button variant="secondary" size="md" className="flex-1" onClick={() => handleSuccessClose('/')}>
                返回首頁
              </Button>
              <Button variant="default" size="md" className="flex-1" onClick={() => handleSuccessClose('/manage-groups')}>
                前往群組管理
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
