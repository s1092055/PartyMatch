let svhProbe = null
export function getStableViewportHeight() {
  if (typeof document === 'undefined') return 0
  if (!svhProbe) {
    svhProbe = document.createElement('div')
    svhProbe.style.cssText = 'position:fixed;top:0;left:0;height:100svh;width:0;visibility:hidden;pointer-events:none;z-index:-1;'
    document.body.appendChild(svhProbe)
  }
  return svhProbe.getBoundingClientRect().height
}

function measureFixedEdgeReserve(selector, edgeProperty) {
  if (typeof document === 'undefined') return 0
  const el = document.querySelector(selector)
  const visible = el && getComputedStyle(el).display !== 'none'
  return visible ? el.offsetHeight + parseFloat(getComputedStyle(el)[edgeProperty] || '0') : 0
}

export function getMobileHeaderReserve() {
  return measureFixedEdgeReserve('[data-mobile-header]', 'top')
}
export function getMobileDockReserve() {
  return measureFixedEdgeReserve('[data-mobile-dock]', 'bottom')
}
