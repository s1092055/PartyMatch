import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// vitest.config.js 刻意關掉 globals，RTL 的自動清理機制是靠偵測全域 afterEach 才會註冊，
// 關掉 globals 後不會自動生效，改手動註冊，不然每個 it() render 出來的 DOM 會疊加到下一個測試
afterEach(cleanup)
