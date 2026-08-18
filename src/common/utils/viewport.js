import { useLayoutEffect } from 'react'

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

// 把 window.innerHeight 寫進一個 CSS 變數，捲動／工具列收合展開觸發的 resize 一律
// debounce 過才更新，不即時跟——iPhone Safari 下方工具列在捲動中收合展開時，原生
// `dvh` 單位會即時跟著變化，若拿來當首頁逐 Section 滿版高度的依據，等於每個工具列
// 動畫影格都逼瀏覽器重新排版一次全部 Section（8 個滿版區塊疊在一起，各自高度一變
// 後面所有 Section 的位置都要重算），這是捲動時「卡卡的」的主因。改成只在使用者
// 停止捲動／縮放一段時間後才更新這個變數，捲動過程中維持上一次量到的穩定值，
// 版面在手勢進行中完全不會被工具列的即時高度變化打擾，放開後才補上最終正確高度
// （不能整個改用 100svh 固定寫死：svh 是「假設工具列一直展開」的最小值，工具列收
// 起來後底部會多出一截沒被 Section 填滿的空白，之前試過整組滿版 Section 全部
// 改 svh，版面跑位問題更嚴重，見 commit 85b6dcb）
export function useSettledViewportHeightVar(varName, debounceMs = 150) {
  useLayoutEffect(() => {
    function apply() {
      document.documentElement.style.setProperty(varName, `${window.innerHeight}px`)
    }
    apply()

    let timer = null
    function onResize() {
      clearTimeout(timer)
      timer = setTimeout(apply, debounceMs)
    }
    window.addEventListener('resize', onResize)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', onResize)
      document.documentElement.style.removeProperty(varName)
    }
  }, [varName, debounceMs])
}
