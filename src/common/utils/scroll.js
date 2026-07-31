function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2
}

// 帶 easing 的捲動動畫，回傳取消函式（在下一次呼叫前取消尚未跑完的動畫，避免兩個動畫互搶 scrollTop）
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
