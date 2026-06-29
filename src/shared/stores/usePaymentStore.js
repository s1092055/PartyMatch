import { create } from 'zustand'
import { insertPaymentRecord, readAllPaymentRecords } from '../api/paymentsApi'
import { createId } from '../utils/storage'
import { nowISO, todayISO } from '../utils/date'

export const usePaymentStore = create((set, get) => ({
  payments: [],
  loading:  false,
  error:    null,

  init: async () => {
    set({ loading: true, error: null })
    try {
      const payments = await readAllPaymentRecords()
      set({ payments, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  // ── 選取器 ──────────────────────────────────────────────────────────────────
  getBySubscriptionId: (subscriptionId) =>
    get().payments.filter(p => p.subscriptionId === subscriptionId),

  getCountBySubIds: (subIds) => {
    const idSet = new Set(subIds)
    return get().payments.filter(p => idSet.has(p.subscriptionId)).length
  },

  // ── 建立收款紀錄 ────────────────────────────────────────────────────────────
  create: ({ subscriptionId, amount, periodLabel, proofUrl }) => {
    const dateStr = todayISO()
    const record = {
      id:             createId('pay'),
      subscriptionId,
      amount,
      paidAt:         nowISO(),
      periodLabel:    periodLabel ?? dateStr.slice(0, 7).replace('-', '年') + '月',
      ...(proofUrl ? { proofUrl } : {}),
    }
    set(s => ({ payments: [...s.payments, record] }))
    insertPaymentRecord(record).catch(console.error)
    return record
  },
}))
