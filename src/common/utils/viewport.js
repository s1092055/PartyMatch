// iOS Safari 捲動時網址列會即時收合/展開，window.innerHeight 跟著即時變動——如果拿它當
// 「可用高度」的依據，每次網址列收合都會觸發 resize 事件、重新算出不同的結果，畫面上看起來
// 就是內容忽大忽小地跳動。CSS 的 100svh（small viewport height）是規格保證「假設網址列一直
// 展開」算出來的最保守高度，不會隨網址列收合即時變動，用一個看不見的探測元素量出它實際的
// 像素值，取代 window.innerHeight 當穩定基準
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

// 手機版 MobileDock 是蓋在畫面最上層的 fixed 元素，不會讓 100dvh 的高度縮水，但實際可視
// 內容還是會被它擋住，這裡量它目前實際佔用的高度（含底部留白）。不能用 offsetParent 判斷
// 是否顯示——position:fixed 的元素 offsetParent 永遠是 null（規格如此，不代表沒顯示），
// 得看 computed display 才知道有沒有被 can-hover:lg:hidden 收掉
export function getMobileDockReserve() {
  if (typeof document === 'undefined') return 0
  const dockEl = document.querySelector('[data-mobile-dock]')
  const dockVisible = dockEl && getComputedStyle(dockEl).display !== 'none'
  return dockVisible ? dockEl.offsetHeight + parseFloat(getComputedStyle(dockEl).bottom || '0') : 0
}
