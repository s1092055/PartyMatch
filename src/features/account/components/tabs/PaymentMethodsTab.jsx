import { useEffect, useState } from 'react'
import { CreditCard, Plus, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogCloseButton } from '../../../../components/ui/dialog'
import { Card } from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import { Button } from '../../../../components/ui/button'
import {
  createPaymentMethod,
  deletePaymentMethod,
  fetchPaymentMethods,
  setDefaultPaymentMethod,
} from '../../../../shared/api/paymentMethodsApi'

const BRAND_COLOR = {
  Visa:       { bg: 'bg-blue-600', text: 'VISA' },
  Mastercard: { bg: 'bg-red-500',  text: 'MC'   },
}

const EMPTY_CARD = { number: '', expiry: '', cvc: '', name: '' }

export default function PaymentMethodsTab() {
  const [cards, setCards]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [newCard, setNewCard]   = useState(EMPTY_CARD)

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
    if (!newCard.number || !newCard.expiry) return
    setSaving(true)
    try {
      const created = await createPaymentMethod({
        brand:  'Visa',
        last4:  newCard.number.replace(/\s/g, '').slice(-4),
        expiry: newCard.expiry,
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
                <button
                  onClick={() => handleRemove(card.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-4 transition-all hover:-translate-y-0.5 hover:bg-danger-subtle hover:text-danger"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </Card>
          )
        })}

        {cards.length < 2 && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-card border-2 border-dashed border-line py-4 text-sm text-ink-4 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:text-brand"
          >
            <Plus size={16} />
            新增付款方式
          </button>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={v => { if (!v) closeModal() }}>
        <DialogContent variant="panel" maxWidth="max-w-sm">
          <DialogHeader>
            <div className="flex min-w-0 items-center gap-2.5">
              <CreditCard size={16} className="shrink-0 text-brand" />
              <DialogTitle className="truncate text-base">新增付款方式</DialogTitle>
            </div>
            <DialogCloseButton />
          </DialogHeader>
          <DialogDescription>新增付款方式</DialogDescription>
          <DialogBody>
        <div className="space-y-3 p-5">
          <input type="text" placeholder="卡號" maxLength={19} className="field py-2 px-3" {...field('number')} />
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="到期日 MM/YY" maxLength={5} className="field py-2 px-3" {...field('expiry')} />
            <input type="text" placeholder="CVC" maxLength={4} className="field py-2 px-3" {...field('cvc')} />
          </div>
          <input type="text" placeholder="持卡人姓名" className="field py-2 px-3" {...field('name')} />
        </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={closeModal} className="flex-1">取消</Button>
            <Button
              onClick={handleAdd}
              disabled={!newCard.number || !newCard.expiry || saving}
              className="flex-1"
            >
              {saving ? '新增中…' : '新增'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
