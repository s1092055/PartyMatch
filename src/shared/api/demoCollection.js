// Demo 資料與正式資料完全分開存放：示範模式下讀寫 `demo_<name>` collection，
// 一般模式下讀寫 `<name>`。兩者是不同的 Firestore document，不會互相污染，
// 也不再需要在每筆資料上標記 `_demo: true` 後再過濾。
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

export function demoAwareCollection(name) {
  return DEMO_MODE ? `demo_${name}` : name
}
