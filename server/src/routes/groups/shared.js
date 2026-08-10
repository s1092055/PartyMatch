import prisma from '../../lib/prisma.js'
import { appendMessage } from '../../lib/conversationMessages.js'

// 找出群組聊天室並附加一則系統訊息；建立時機早於群組鎖定的情境（例如群組還沒鎖定）不會有聊天室，此時靜默略過
export async function notifyGroupConversation(groupId, senderId, content) {
  const conversation = await prisma.conversation.findFirst({ where: { groupId, type: 'group' } })
  if (!conversation) return
  await appendMessage(conversation, { senderId, content, type: 'system' })
}

// 建立單則通知，fire-and-forget（不阻塞主要回應，失敗只記 log）
export function notify({ userId, type, title, message, meta }) {
  prisma.notification.create({ data: { userId, type, title, message, meta } }).catch(console.error)
}

// 群組狀態機轉換的併發保護共用 helper：用條件式 updateMany（WHERE id + status）當樂觀鎖搶佔轉換
// 資格，只有 DB 當下真的還是 fromStatus 才會生效。搶佔失敗代表已經被其他併發請求（例如團主跟
// 管理員幾乎同時處理同一筆申訴、或使用者快速點兩下同一個按鈕）搶先處理過，丟一個帶 statusCode
// 的 Error 讓外層交易整筆回滾，呼叫端不用各自重寫「updateMany → 檢查 count → throw」這三行。
// 只適用於「搶佔失敗＝這個請求該被拒絕」的情境；如果搶佔失敗其實代表「已經被別人做完、直接回報
// 目前真實狀態即可」（例如撥款、逾期自動撥款這種只求恰好執行一次的情境），不要用這個 helper，
// 直接檢查 updateMany 的 count 自行決定分支。
export async function claimGroupStatus(tx, groupId, { fromStatus, data, message = '群組狀態已變動，請重新整理頁面', responseCode }) {
  const claimed = await tx.group.updateMany({
    where: { id: groupId, status: Array.isArray(fromStatus) ? { in: fromStatus } : fromStatus },
    data,
  })
  if (claimed.count === 0) {
    const err = new Error(message)
    err.statusCode = 409
    if (responseCode) err.responseCode = responseCode
    throw err
  }
}
