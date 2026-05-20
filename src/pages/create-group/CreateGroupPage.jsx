import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Rocket, AlertCircle, X } from 'lucide-react'
import CreateGroupStepper from './components/CreateGroupStepper'
import LivePreviewPanel   from './components/LivePreviewPanel'
import Step1Service       from './components/steps/Step1Service'
import Step2Plan          from './components/steps/Step2Plan'
import Step3Settings      from './components/steps/Step3Settings'
import Step4Preview       from './components/steps/Step4Preview'
import Button from '../../shared/components/ui/Button'
import { createGroup, getGroupsByHostId } from '../../shared/stores/groupStore'
import { getServiceById } from '../../shared/services/serviceTypes'
import { computeNextBillingDate } from '../../shared/utils/date'
import { getActiveUser } from '../../shared/stores/userStore'

const STEPS = [Step1Service, Step2Plan, Step3Settings, Step4Preview]

const INITIAL_FORM = {
  serviceId:      '',
  planName:       '',
  pricePerSeat:   0,
  billingCycle:   'monthly',
  nextBillingDay: '',
  totalSeats:     2,
  rules:          [''],
  joinMode:       'approval',
}

function mapFormToGroup(form) {
  const service = getServiceById(form.serviceId)
  const totalSeats = form.totalSeats
  const rules = form.rules.map(r => r.trim()).filter(Boolean)
  const tags = [
    service?.category,
    form.joinMode === 'instant' ? '立即加入' : '需要審核',
  ].filter(Boolean)

  return {
    serviceId:       form.serviceId,
    serviceName:     service?.fullName ?? service?.name ?? form.serviceId,
    planName:        form.planName,
    pricePerSeat:    form.pricePerSeat || 0,
    billingCycle:    form.billingCycle,
    nextBillingDate: computeNextBillingDate(form.nextBillingDay),
    totalSeats,
    usedSeats:       1,
    openSeats:       totalSeats - 1,
    joinMode:        form.joinMode,
    rules,
    tags,
    status:          'recruiting',
  }
}

function getStepErrors(step, form) {
  const errors = []
  const billingDay = Number.parseInt(form.nextBillingDay, 10)
  const rules = form.rules.map(rule => rule.trim()).filter(Boolean)

  switch (step) {
    case 1:
      if (!form.serviceId) errors.push('請選擇一個訂閱服務')
      break
    case 2: {
      if (!form.planName) errors.push('請選擇方案')
      if (!Number.isInteger(billingDay) || billingDay < 1 || billingDay > 31) {
        errors.push('每月扣款日需介於 1 至 31 日')
      }
      const activeUser = getActiveUser()
      const duplicate = activeUser && form.serviceId && form.planName && getGroupsByHostId(activeUser.id).some(group =>
        group.status === 'recruiting' &&
        group.serviceId === form.serviceId &&
        group.planName === form.planName
      )
      if (duplicate) errors.push('你已經有相同服務與方案的招募中群組')
      break
    }
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

export default function CreateGroupPage() {
  const navigate = useNavigate()
  const [step, setStep]               = useState(1)
  const [form, setForm]               = useState(INITIAL_FORM)
  const [submitted, setSubmitted]     = useState(false)
  const [newGroupId, setNewGroupId]   = useState(null)

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
          next.pricePerSeat = Math.ceil(plan.monthlyPrice / plan.maxSeats)
        }
      }
      if (key === 'totalSeats') {
        const service = getServiceById(next.serviceId)
        const plan = service?.plans.find(p => p.name === next.planName)
        if (plan) next.pricePerSeat = Math.ceil(plan.monthlyPrice / value)
      }
      return next
    })
  }

  const stepErrors = getStepErrors(step, form)
  function canNext() { return stepErrors.length === 0 }

  function handleClose() { navigate(-1) }

  function handleNext() {
    if (canNext() && step < 4) setStep(s => s + 1)
  }

  function handleBack() {
    if (step > 1) setStep(s => s - 1)
    else handleClose()
  }

  function handleSubmit() {
    const firstInvalidStep = getFirstInvalidStep(form)
    if (firstInvalidStep) { setStep(firstInvalidStep); return }
    const groupData = mapFormToGroup(form)
    const group = createGroup(groupData)
    setNewGroupId(group.id)
    setSubmitted(true)
    setTimeout(() => navigate('/manage-groups'), 2500)
  }

useEffect(() => {
    function onKeyDown(e) { if (e.key === 'Escape') navigate(-1) }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [navigate])

useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const StepComponent = STEPS[step - 1]

  return (
    <>
      
      <div
        className="fixed inset-0 z-[55] cursor-pointer bg-black/50 backdrop-blur-[2px]"
        onClick={handleClose}
      />

<div className="fixed inset-0 z-[56] flex items-center justify-center p-4 md:p-8 pointer-events-none">
        <div className="pointer-events-auto relative flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" style={{ maxHeight: 'min(88vh, 820px)' }}>

<div className="flex shrink-0 items-center justify-between border-b border-line px-6 py-4">
            <div>
              <h2 className="text-lg font-extrabold text-ink">建立群組</h2>
              <p className="mt-0.5 text-xs text-ink-3">快速建立你專屬的共享群組，找到合適夥伴一起分攤費用</p>
            </div>
            <button
              onClick={handleClose}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
              aria-label="關閉"
            >
              <X size={18} />
            </button>
          </div>

<div className="shrink-0 px-6 pt-5">
            <CreateGroupStepper current={step} />
          </div>

<div className="flex-1 overflow-y-auto px-6 pb-2">
            {submitted ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <Rocket size={28} className="text-emerald-600" />
                </div>
                <h2 className="page-title">群組已上架！</h2>
                <p className="text-sm text-slate-500">正在跳轉到群組管理頁面…</p>
                {newGroupId && (
                  <button
                    onClick={() => navigate(`/groups/${newGroupId}`)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    立即查看群組詳情 →
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                
                <div className="min-w-0 flex-1">
                  <div className="card p-6">
                    <StepComponent form={form} onChange={onChange} />
                  </div>

                  {stepErrors.length > 0 && step < 4 && (
                    <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
                      <div className="flex items-center gap-2 font-semibold">
                        <AlertCircle size={13} />
                        請先修正以下項目
                      </div>
                      <ul className="mt-1.5 list-disc space-y-1 pl-5">
                        {stepErrors.map(error => <li key={error}>{error}</li>)}
                      </ul>
                    </div>
                  )}
                </div>

<div className="hidden lg:block w-full shrink-0 lg:w-72">
                  <LivePreviewPanel form={form} />
                </div>
              </div>
            )}
          </div>

{!submitted && (
            <div className="flex shrink-0 gap-3 border-t border-line px-6 py-4">
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={handleBack}
              >
                <ChevronLeft size={15} />
                {step === 1 ? '取消' : '上一步'}
              </Button>

              {step < 4 ? (
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1"
                  disabled={!canNext()}
                  onClick={handleNext}
                >
                  下一步
                  <ChevronRight size={15} />
                </Button>
              ) : (
                <Button
                  variant="success"
                  size="md"
                  className="flex-1"
                  onClick={handleSubmit}
                >
                  <Rocket size={15} />
                  送出並上架
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
