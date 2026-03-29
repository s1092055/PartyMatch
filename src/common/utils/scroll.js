function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2
}

export function smoothScrollTo(container, targetTop, duration = 600) {
  const startTop = container.scrollTop
  const distance = targetTop - startTop
  const startTime = performance.now()
  let frameId = null

  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1)
    container.scrollTop = startTop + distance * easeInOutCubic(progress)
    if (progress < 1) frameId = requestAnimationFrame(step)
  }
  frameId = requestAnimationFrame(step)

  return () => cancelAnimationFrame(frameId)
}
