import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// vitest.config.js 刻意關掉 globals，RTL 的自動清理機制是靠偵測全域 afterEach 才會註冊，
// 關掉 globals 後不會自動生效，改手動註冊，不然每個 it() render 出來的 DOM 會疊加到下一個測試
afterEach(cleanup)

// jsdom 沒有實作 IntersectionObserver，RevealSection（很多頁面都用來做進場動畫）掛載時會
// 直接噴 ReferenceError；測試不需要真的觀察捲動進場，給一個什麼都不做的假實作就夠了
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.IntersectionObserver = IntersectionObserverStub
