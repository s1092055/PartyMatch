export function startPolling(pollOnce, intervalMs) {
  let active = true
  const isActive = () => active

  async function tick() {
    if (!isActive()) return
    await pollOnce(isActive)
  }

  tick()
  const timer = setInterval(tick, intervalMs)

  return () => {
    active = false
    clearInterval(timer)
  }
}
