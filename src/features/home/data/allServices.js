import { listServiceTypes } from '../../../common/utils/serviceUtils'

// HomePage（CTA 區塊服務 icon）與 BubbleField（背景浮動泡泡）共用同一份服務清單，
// 只在模組載入時計算一次
export const ALL_SERVICES = listServiceTypes()
