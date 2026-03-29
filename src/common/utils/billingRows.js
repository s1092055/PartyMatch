export function buildMemberRows(transactions, isCancelled) {
  if (isCancelled) {
    const byUserId = new Map()
    for (const tx of transactions) {
      if (tx.type !== 'refund') continue
      if (!byUserId.has(tx.userId)) byUserId.set(tx.userId, tx)
    }
    return [...byUserId.values()]
  }

  const netByUserId = new Map();
  for (const tx of transactions) {
    if (tx.type !== 'escrow' && tx.type !== 'refund') continue
    const prev = netByUserId.get(tx.userId) ?? { net: 0, latestEscrowTx: null }
    if (tx.type === 'escrow') {
      prev.net += Math.abs(tx.amount)
      if (!prev.latestEscrowTx || tx.createdAt > prev.latestEscrowTx.createdAt) prev.latestEscrowTx = tx
    } else {
      prev.net -= Math.abs(tx.amount)
    }
    netByUserId.set(tx.userId, prev)
  }
  return [...netByUserId.values()].filter(v => v.net > 0 && v.latestEscrowTx).map(v => v.latestEscrowTx)
}
