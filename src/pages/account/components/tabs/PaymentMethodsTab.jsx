import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

const INIT_CARDS = [
  { id: 'card_001', brand: 'Visa',       last4: '4242', expiry: '12/27', isDefault: true },
  { id: 'card_002', brand: 'Mastercard', last4: '8888', expiry: '08/26', isDefault: false },
]

const BRAND_COLOR = {
  Visa:       { bg: 'bg-blue-600',  text: 'VISA' },
  Mastercard: { bg: 'bg-red-500',   text: 'MC' },
}

export default function PaymentMethodsTab() {
  const [cards, setCards]       = useState(INIT_CARDS)
  const [showForm, setShowForm] = useState(false)
  const [newCard, setNewCard]   = useState({ number: '', expiry: '', cvc: '', name: '' })

  function setDefault(id) {
    setCards(prev => prev.map(c => ({ ...c, isDefault: c.id === id })))
  }

  function remove(id) {
    setCards(prev => prev.filter(c => c.id !== id))
  }

  function addCard() {
    if (!newCard.number || !newCard.expiry) return
    setCards(prev => [...prev, {
      id: `card_${Date.now()}`,
      brand: 'Visa',
      last4: newCard.number.slice(-4),
      expiry: newCard.expiry,
      isDefault: false,
    }])
    setNewCard({ number: '', expiry: '', cvc: '', name: '' })
    setShowForm(false)
  }

  return (
    <div className="space-y-3">
      {cards.map(card => {
        const style = BRAND_COLOR[card.brand] ?? { bg: 'bg-line-strong', text: card.brand }
        return (
          <div key={card.id} className="card p-4 flex items-center gap-4">
            {/* Card brand badge */}
            <div className={`w-12 h-8 rounded-lg ${style.bg} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
              {style.text}
            </div>

            {/* Card info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-ink-2">
                  {card.brand} •••• {card.last4}
                </span>
                {card.isDefault && (
                  <span className="badge badge-blue">預設</span>
                )}
              </div>
              <p className="text-xs text-ink-3">到期日 {card.expiry}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {!card.isDefault && (
                <button
                  onClick={() => setDefault(card.id)}
                  className="text-xs text-brand hover:underline"
                >
                  設為預設
                </button>
              )}
              <button
                onClick={() => remove(card.id)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-ink-4 hover:text-danger hover:bg-danger-subtle transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        )
      })}

      {/* Add card form */}
      {showForm ? (
        <div className="bg-surface border-2 border-brand-border rounded-[var(--radius-card)] p-5 space-y-3">
          <p className="text-sm font-semibold text-ink-2">新增付款方式</p>
          <input
            type="text" placeholder="卡號" maxLength={19}
            value={newCard.number}
            onChange={e => setNewCard(p => ({ ...p, number: e.target.value }))}
            className="field py-2 px-3"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text" placeholder="到期日 MM/YY" maxLength={5}
              value={newCard.expiry}
              onChange={e => setNewCard(p => ({ ...p, expiry: e.target.value }))}
              className="field py-2 px-3"
            />
            <input
              type="text" placeholder="CVC" maxLength={4}
              value={newCard.cvc}
              onChange={e => setNewCard(p => ({ ...p, cvc: e.target.value }))}
              className="field py-2 px-3"
            />
          </div>
          <input
            type="text" placeholder="持卡人姓名"
            value={newCard.name}
            onChange={e => setNewCard(p => ({ ...p, name: e.target.value }))}
            className="field py-2 px-3"
          />
          <div className="flex gap-2">
            <button onClick={addCard} className="btn btn-primary flex-1">新增</button>
            <button onClick={() => setShowForm(false)} className="btn btn-ghost flex-1">取消</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-line rounded-[var(--radius-card)] py-4 text-sm text-ink-4 hover:border-brand-border hover:text-brand transition-colors"
        >
          <Plus size={16} />
          新增付款方式
        </button>
      )}
    </div>
  )
}
