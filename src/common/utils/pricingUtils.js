export function calcPricePerSeat(plan, seats) {
  return Math.ceil(plan.monthlyPrice / seats)
}

export function calcDisplayPrice(pricePerSeat, billingCycle) {
  return billingCycle === 'yearly' ? pricePerSeat * 12 : pricePerSeat
}

export function calcDisplayCycle(billingCycle) {
  return billingCycle === 'yearly' ? 'yearly' : 'monthly'
}
