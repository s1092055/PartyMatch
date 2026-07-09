import { useCallback, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Info } from 'lucide-react'
import FlowLayout from '../../shared/layout/FlowLayout'
import Step1Service from './components/steps/Step1Service'
import Step2PlanSettings from './components/steps/Step2PlanSettings'
import Step3Preview from './components/steps/Step3Preview'
import Button from '../../shared/ui/Button'
import ServiceLogo from '../../shared/ui/ServiceLogo'
import TokenAmount from '../../shared/ui/TokenAmount'
import LivePreviewPanel from './components/LivePreviewPanel'
import { useGroupStore } from '../../shared/stores/useGroupStore'
import { useNotificationStore } from '../../shared/stores/useNotificationStore'
import { getServiceById } from '../../shared/utils/serviceUtils'
import { useAuthStore } from '../../shared/stores/useAuthStore'

const STEP_COMPONENTS = [Step1Service, Step2PlanSettings, Step3Preview]
const STEP_TITLES = ['選擇服務', '方案與設定', '最後確認']

const INITIAL_FORM = {
  serviceId: '',
  planName: '',
  pricePerSeat: 0,
  billingCycle: 'monthly',
  totalSeats: 2,
  minCreditScore: 0,
  requirements: '',
  rules: ['', '', ''],
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
      if (!form.serviceId) errors.push('請選擇一個訂閱服務')
      break
    case 2: {
      if (!form.planName) errors.push('請選擇方案')
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
  return [1, 2].find(step => getStepErrors(step, form).length > 0) ?? null
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
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [atBottom, setAtBottom] = useState(false)
  const [canScroll, setCanScroll] = useState(false)
  const scrollElRef = useRef(null)
  const resizeObserverRef = useRef(null)
  const mutationObserverRef = useRef(null)

  function updateScrollState(el) {
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    setAtBottom(scrollTop + clientHeight >= scrollHeight - 20)
    setCanScroll(scrollHeight > clientHeight + 20)
  }
  function handleContentScroll(e) { updateScrollState(e.currentTarget) }
  function scrollContentToTop() { scrollElRef.current?.scrollTo({ top: 0, behavior: 'smooth' }) }
  function scrollContentDown()  { scrollElRef.current?.scrollBy({ top: 200, behavior: 'smooth' }) }

  // 內容區第一層子元素固定 h-full（跟容器等高), ResizeObserver 盯著它偵測不到內部真正的
  // 內容溢出，所以改用 MutationObserver 監看整個子樹的異動，每次異動都重新讀取真實的
  // scrollHeight/clientHeight 來判斷是否 overflow
  const scrollRef = useCallback((el) => {
    scrollElRef.current = el
    resizeObserverRef.current?.disconnect()
    mutationObserverRef.current?.disconnect()
    if (!el) return
    const check = () => updateScrollState(el)
    const observer = new ResizeObserver(check)
    observer.observe(el)
    resizeObserverRef.current = observer
    const mutationObserver = new MutationObserver(check)
    mutationObserver.observe(el, { childList: true, subtree: true })
    mutationObserverRef.current = mutationObserver
    updateScrollState(el)
  }, [])

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
    if (canNext() && step < 3) {
      setStep(s => s + 1)
      scrollElRef.current?.scrollTo({ top: 0 })
    }
  }

  function handleBack() {
    if (step <= 1) return
    setStep(s => s - 1)
    scrollElRef.current?.scrollTo({ top: 0 })
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
    setStep(4)
    scrollElRef.current?.scrollTo({ top: 0 })
  }

  const footer = step <= 3 && (
    <>
      {step === 1 ? (
        <Button variant="secondary" size="md" className="min-w-0 flex-1" onClick={leaveFlow}>
          取消建立
        </Button>
      ) : (
        <Button variant="secondary" size="md" className="min-w-0 flex-1" onClick={handleBack}>
          <ChevronLeft size={15} />
          上一步
        </Button>
      )}
      {step < 3 ? (
        <Button variant="primary" size="md" className="min-w-0 flex-1" disabled={!canNext()} onClick={handleNext}>
          下一步
          <ChevronRight size={15} />
        </Button>
      ) : (
        <Button variant="success" size="md" className="min-w-0 flex-1" disabled={!agreedToTerms} onClick={handleSubmit}>
          確認建立
        </Button>
      )}
    </>
  )

  const service = getServiceById(form.serviceId)
  const desc = step === 2
    ? service?.plans.find(p => p.name === form.planName)?.description
    : null
  const hasEligiblePlans = (service?.plans ?? []).some(p => p.maxSeats > 1)
  const visibleStepErrors = stepErrors.filter(err =>
    err !== '請選擇一個訂閱服務' && (err !== '請選擇方案' || hasEligiblePlans)
  )
  const showErrors = visibleStepErrors.length > 0 && step < 3

  const errorBox = showErrors && (
    <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
      <AlertCircle size={13} className="shrink-0" />
      <span>{visibleStepErrors[0]}</span>
    </div>
  )
  const descBox = desc && (
    <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
      <Info size={14} className="mt-0.5 shrink-0 text-blue-400" />
      <p className="text-xs leading-relaxed text-blue-700">{desc}</p>
    </div>
  )
  const footerNote = step < 3 && (descBox || errorBox) && (
    <div className="lg:hidden">
      {descBox}
      {errorBox}
    </div>
  )

  const CurrentStep = STEP_COMPONENTS[step - 1]

  return (
    <FlowLayout
      progress={(Math.min(step, 3) / 3) * 100}
      title={step <= 3 ? STEP_TITLES[step - 1] : undefined}
      footerNote={footerNote || undefined}
      bottomNav={footer}
      maxWidth="max-w-xl md:max-w-2xl lg:max-w-3xl"
    >
      <div className="relative h-full">
        <div
          ref={scrollRef}
          onScroll={handleContentScroll}
          className="h-full overflow-y-auto pt-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div key={step} className="h-full animate-step-slide-up p-0.5">
            {step <= 3 ? (
              <>
                <div className={`flex h-full flex-col ${(step === 2 || step === 3) && !canScroll ? 'lg:justify-center' : ''}`}>
                  {step === 2 && (
                    <div className="mb-6 flex items-center gap-4 rounded-2xl border border-line bg-white px-6 py-5 shadow-sm">
                      <ServiceLogo serviceId={form.serviceId} size={56} className="shrink-0 rounded-logo border-line-strong" />
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-lg font-black text-ink">{service?.fullName ?? '尚未選擇服務'}</h2>
                        <p className="truncate text-sm text-ink-3">{form.planName || '尚未選擇方案'}</p>
                      </div>
                      <TokenAmount
                        amount={form.billingCycle === 'yearly' ? form.pricePerSeat * 12 : form.pricePerSeat}
                        cycle={form.billingCycle === 'yearly' ? 'yearly' : 'monthly'}
                        align="center"
                        className="shrink-0 text-2xl font-black text-ink"
                      />
                    </div>
                  )}
                  {step === 3 ? (
                    <Step3Preview form={form} agreedToTerms={agreedToTerms} onAgreeChange={setAgreedToTerms} onShowPreview={() => setShowPreview(true)} />
                  ) : (
                    <CurrentStep form={form} onChange={onChange} />
                  )}
                </div>
                {step !== 1 && (
                  <div className="mt-4 hidden space-y-2 lg:block">
                    {descBox}
                    {errorBox}
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
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
            )}
          </div>
        </div>

        {step <= 3 && canScroll && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 hidden justify-end lg:flex">
            <button
              onClick={atBottom ? scrollContentToTop : scrollContentDown}
              className="pointer-events-auto grid h-8 w-8 place-items-center rounded-full border border-line bg-canvas shadow-md text-ink-3 transition-colors hover:text-ink animate-bounce"
              title={atBottom ? '回到頂部' : '往下捲動'}
            >
              {atBottom ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        )}
      </div>

      {showPreview && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-4 md:px-8"
          onClick={() => setShowPreview(false)}
        >
          <div className="mx-auto w-full max-w-xs" onClick={e => e.stopPropagation()}>
            <LivePreviewPanel form={form} />
          </div>
        </div>
      )}
    </FlowLayout>
  )
}
