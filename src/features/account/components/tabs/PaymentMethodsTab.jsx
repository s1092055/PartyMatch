import { useEffect, useState } from 'react'
import { CreditCard, Plus, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogCloseButton } from '../../../../components/ui/dialog'
import { Card } from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import { Button } from '../../../../components/ui/button'
import { Input, Textarea } from '../../../../components/ui/input'
import FilterSelect from '../../../../components/ui/primitives/FilterSelect'
import { useFilterSelectGroup } from '../../../../components/ui/primitives/useFilterSelectGroup'
import {
  createPaymentMethod,
  deletePaymentMethod,
  fetchPaymentMethods,
  setDefaultPaymentMethod,
} from '../../../../common/api/paymentMethodsApi'

const BRAND_COLOR = {
  Visa:       { bg: 'bg-blue-600', text: 'VISA' },
  Mastercard: { bg: 'bg-red-500',  text: 'MC'   },
}

const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 16 }, (_, i) => String(CURRENT_YEAR + i))
const MONTH_GROUPS = [{ label: null, items: MONTHS.map(m => ({ value: m, label: m })) }]
const YEAR_GROUPS = [{ label: null, items: YEARS.map(y => ({ value: y, label: y })) }]

const EMPTY_CARD = {
  name: '', number: '', month: '', year: '', cvc: '',
  address: '', city: '', postalCode: '', comments: '',
}

function FormField({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-ink">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-ink-4">{hint}</p>}
    </div>
  )
}

export default function PaymentMethodsTab() {
  const [cards, setCards]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [newCard, setNewCard]   = useState(EMPTY_CARD)
  const expiryFilterGroup = useFilterSelectGroup()

  useEffect(() => {
    fetchPaymentMethods()
      .then(data => {
        const arr = Array.isArray(data) ? data : []
        setCards([...arr.filter(c => c.isDefault), ...arr.filter(c => !c.isDefault)])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd() {
    if (!newCard.number || !newCard.month || !newCard.year) return
    setSaving(true)
    try {
      const created = await createPaymentMethod({
        brand:  'Visa',
        last4:  newCard.number.replace(/\s/g, '').slice(-4),
        expiry: `${newCard.month}/${newCard.year.slice(-2)}`,
      })
      setCards(prev => [...prev, created])
      setNewCard(EMPTY_CARD)
      setModalOpen(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleSetDefault(id) {
    await setDefaultPaymentMethod(id).catch(console.error)
    setCards(prev => {
      const updated = prev.map(c => ({ ...c, isDefault: c.id === id }))
      return [updated.find(c => c.isDefault), ...updated.filter(c => !c.isDefault)]
    })
  }

  async function handleRemove(id) {
    await deletePaymentMethod(id).catch(console.error)
    setCards(prev => {
      const next = prev.filter(c => c.id !== id)
      if (next.length > 0 && !next.some(c => c.isDefault)) {
        next[0] = { ...next[0], isDefault: true }
      }
      return next
    })
  }

  function closeModal() {
    setModalOpen(false)
    setNewCard(EMPTY_CARD)
  }

  function field(key) {
    return {
      value: newCard[key],
      onChange: e => setNewCard(p => ({ ...p, [key]: e.target.value })),
    }
  }

  if (loading) return (
    <div className="flex justify-center py-8">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
    </div>
  )

  return (
    <>
      <div className="space-y-3">
        {cards.map(card => {
          const style = BRAND_COLOR[card.brand] ?? { bg: 'bg-line-strong', text: card.brand }
          return (
            <Card key={card.id} className="flex items-center gap-4 p-4">
              <div className={`flex h-8 w-12 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${style.bg}`}>
                {style.text}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink-2">
                    {card.brand} •••• {card.last4}
                  </span>
                  {card.isDefault && <Badge>預設</Badge>}
                </div>
                <p className="text-xs text-ink-3">到期日 {card.expiry}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!card.isDefault && (
                  <button onClick={() => handleSetDefault(card.id)} className="text-xs text-brand hover:underline">
                    設為預設
                  </button>
                )}
                <Button
                  onClick={() => handleRemove(card.id)}
                  variant="ghost"
                  size="icon"
                  aria-label="移除付款方式"
                  className="text-ink-4 hover:bg-danger-subtle hover:text-danger"
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            </Card>
          )
        })}

        {cards.length < 2 && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-card border border-line py-4 text-sm text-ink-4 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:text-brand"
          >
            <Plus size={16} />
            新增付款方式
          </button>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={v => { if (!v) closeModal() }}>
        <DialogContent variant="panel" maxWidth="max-w-sm" height="min(85dvh, 34rem)">
          <DialogHeader>
            <div className="flex min-w-0 items-center gap-2.5">
              <CreditCard size={16} className="shrink-0 text-brand" />
              <DialogTitle className="truncate text-base">新增付款方式</DialogTitle>
            </div>
            <DialogCloseButton />
          </DialogHeader>
          <DialogDescription>交易已加密保護</DialogDescription>
          <DialogBody>
            <div className="space-y-4 p-5">
              <p className="-mt-1 text-sm text-ink-3">交易已加密保護</p>

              <FormField label="持卡人姓名">
                <Input type="text" placeholder="王小明" {...field('name')} />
              </FormField>

              <FormField label="卡號" hint="請輸入 16 碼卡號">
                <Input type="text" placeholder="1234 5678 9012 3456" maxLength={19} {...field('number')} />
              </FormField>

              <div className="grid grid-cols-3 gap-3">
                <FormField label="月">
                  <FilterSelect
                    id="card-month"
                    ariaLabel="到期月份"
                    group={expiryFilterGroup}
                    value={newCard.month}
                    onChange={v => setNewCard(p => ({ ...p, month: v }))}
                    groups={MONTH_GROUPS}
                    className="h-10 w-full font-bold"
                    listClassName="max-h-40"
                    triggerContent={<span className="truncate">{newCard.month || 'MM'}</span>}
                  />
                </FormField>
                <FormField label="年">
                  <FilterSelect
                    id="card-year"
                    ariaLabel="到期年份"
                    group={expiryFilterGroup}
                    value={newCard.year}
                    onChange={v => setNewCard(p => ({ ...p, year: v }))}
                    groups={YEAR_GROUPS}
                    className="h-10 w-full font-bold"
                    listClassName="max-h-40"
                    triggerContent={<span className="truncate">{newCard.year || 'YYYY'}</span>}
                  />
                </FormField>
                <FormField label="安全碼">
                  <Input type="text" placeholder="123" maxLength={4} {...field('cvc')} />
                </FormField>
              </div>

              <div className="space-y-4 border-t border-line-subtle pt-4">
                <p className="text-sm font-bold text-ink">帳單地址</p>
                <FormField label="地址">
                  <Input type="text" placeholder="請輸入詳細地址" {...field('address')} />
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="城市">
                    <Input type="text" placeholder="台北市" {...field('city')} />
                  </FormField>
                  <FormField label="郵遞區號">
                    <Input type="text" placeholder="100" {...field('postalCode')} />
                  </FormField>
                </div>
              </div>

              <FormField label="備註">
                <Textarea placeholder="新增任何補充說明" rows={3} {...field('comments')} />
              </FormField>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              onClick={handleAdd}
              disabled={!newCard.number || !newCard.month || !newCard.year || saving}
              className="flex-1"
            >
              {saving ? '儲存中…' : '儲存'}
            </Button>
            <Button variant="ghost" onClick={closeModal} className="flex-1">取消</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
