import prisma from '../lib/prisma.js'
import { computeSeatCost } from '../utils/pricing.js'
import { notify, notifyGroupConversation, claimGroupStatus } from '../routes/groups/shared.js'
import { rejectPendingApplications } from '../utils/membership.js'
import { adjustCreditScore } from '../utils/creditScore.js'

// 群組列表查詢共用的 include 組合，跟原本 routes/groups/lifecycle.js 逐一複製貼上的版本一致
const HOST_GROUP_INCLUDE = {
  host:    { select: { id: true, name: true, avatarColor: true, avatarInitial: true, showAvatar: true, presenceStatus: true, creditScore: true, bio: true } },
  service: true,
  _count:  { select: { members: true } },
}

const MAX_BILLING_DATE_ADJUST_DAYS = 7

function httpError(statusCode, message, extra) {
  const err = new Error(message)
  err.statusCode = statusCode
  if (extra) Object.assign(err, extra)
  return err
}

// POST /groups/:id/activate — pending_activation → confirming（48h 確認期開始）
export async function activateGroup({ groupId, hostId }) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true, service: true },
  })
  if (!group) throw httpError(404, '群組不存在')
  if (group.hostId !== hostId) throw httpError(403, '僅團主可操作')
  if (group.status !== 'pending_activation') throw httpError(400, `群組狀態為 ${group.status}，無法啟用（需為 pending_activation）`)

  const confirmDeadline = new Date()
  confirmDeadline.setHours(confirmDeadline.getHours() + 48)

  // 下次扣款日只在「第一次」啟用（首期，來自 /lock）才從實際啟用當下重新算，確保第一期
  // 不會因為鎖定到啟用中間拖延而縮水；之後每次續訂再啟用（hasActivatedOnce 已是 true）都
  // 固定沿用 /renew 已經算好、錨定在「上一期排定日期 + 一個週期」的值，不再重算——不然扣款日
  // 會因為每期啟用延誤而持續往後漂移，不再固定在同一天。真的遇到需要延後的情況交給團主
  // 用「調整下次扣款日」手動處理（見 adjustBillingDate）
  const isFirstActivation = !group.hasActivatedOnce
  const nextBillingDate = isFirstActivation ? new Date() : group.nextBillingDate
  if (isFirstActivation) {
    if (group.billingCycle === 'yearly') nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1)
    else nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
  }

  // 改用 callback transaction（而不是原本的陣列式）：信用分數的 adjustCreditScore() 需要先讀出
  // 目前分數才能夾在 [0, 100] 之間再寫回，陣列式的每個項目都是各自獨立的 Prisma promise，
  // 沒辦法在同一個 transaction 裡先讀後寫
  const updated = await prisma.$transaction(async (tx) => {
    const updatedGroup = await tx.group.update({
      where: { id: groupId },
      data: {
        status: 'confirming',
        confirmDeadline,
        hasActivatedOnce: true,
        ...(isFirstActivation && { nextBillingDate }),
      },
      include: HOST_GROUP_INCLUDE,
    })
    if (isFirstActivation) {
      await tx.subscription.updateMany({
        where: { groupId },
        data:  { nextBillingDate },
      })
    }
    // 信用分數：團主成功啟用群組 +5（每次成功啟用都加，含續訂重新啟用）
    await adjustCreditScore(tx, { userId: group.hostId, delta: 5, reason: '團主成功啟用群組', groupId })
    return updatedGroup
  })

  // 只有第一次啟用才會改動扣款日，才需要另外發「已確定」通知；續訂後的啟用日期本來就
  // 沒變（/renew 那則「預估」通知已經講過這個日期），不用重複通知造成誤會
  if (isFirstActivation) {
    const groupLabel = group.planName ?? group.service?.name ?? ''
    const finalDateText = nextBillingDate.toISOString().slice(0, 10).replace(/-/g, '/')
    ;[group.hostId, ...group.members.map(m => m.userId)].forEach(userId => {
      notify({
        userId,
        type:    'billing_date_confirmed',
        title:   '下次扣款日已確定',
        message: `「${groupLabel}」服務已啟用，下次扣款日確定為 ${finalDateText}。`,
        meta:    { groupId, nextBillingDate: nextBillingDate.toISOString(), estimated: false },
      })
    })
  }

  const groupLabelForActivation = group.planName ?? group.service?.name ?? ''
  notify({
    userId:  group.hostId,
    type:    'group_activated',
    title:   '服務已啟用，確認期開始',
    message: `「${groupLabelForActivation}」群組服務已啟用，成員有 48 小時確認期。`,
    meta:    { groupId },
  })
  group.members.forEach(m => {
    notify({
      userId:  m.userId,
      type:    'group_activated',
      title:   '服務已啟用，請確認',
      message: `「${groupLabelForActivation}」服務已啟用！請在 48 小時內確認服務是否正常，否則將自動完成。`,
      meta:    { groupId },
    })
  })

  return updated
}

// PATCH /groups/:id/billing-date — 團主在確認期調整下次扣款日（外部設定延誤等情況的補救窗口）
export async function adjustBillingDate({ groupId, hostId, nextBillingDate: requestedRaw, note: noteRaw }) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true, service: true },
  })
  if (!group) throw httpError(404, '群組不存在')
  if (group.hostId !== hostId) throw httpError(403, '僅團主可操作')
  if (group.status !== 'confirming') throw httpError(400, `群組狀態為 ${group.status}，只能在確認期調整扣款日`)
  if (group.billingDateAdjustedAt) throw httpError(400, '本期已經調整過扣款日，每期僅能調整一次')
  if (!group.nextBillingDate) throw httpError(400, '這個群組目前沒有扣款日可以調整')

  const requested = new Date(requestedRaw)
  if (Number.isNaN(requested.getTime())) throw httpError(400, '日期格式不正確')

  // 只能延後、不能提前（防止團主藉此提早催繳），且延後幅度有上限（避免變相無限拖延服務期）
  const current = new Date(group.nextBillingDate)
  const maxAllowed = new Date(current)
  maxAllowed.setDate(maxAllowed.getDate() + MAX_BILLING_DATE_ADJUST_DAYS)
  if (requested <= current) throw httpError(400, '新的扣款日只能比原本的日期晚')
  if (requested > maxAllowed) throw httpError(400, `最多只能延後 ${MAX_BILLING_DATE_ADJUST_DAYS} 天`)

  const note = noteRaw.trim()

  const [updated] = await prisma.$transaction([
    prisma.group.update({
      where: { id: groupId },
      data: {
        nextBillingDate:           requested,
        billingDateAdjustedAt:     new Date(),
        billingDateAdjustmentNote: note,
      },
      include: HOST_GROUP_INCLUDE,
    }),
    prisma.subscription.updateMany({
      where: { groupId },
      data:  { nextBillingDate: requested },
    }),
  ])

  // 只通知成員，不通知團主自己（是他本人操作的）；不重複用 billing_date_confirmed，
  // 讓成員清楚分辨這是「事後被改過」而不是原本啟用時就定案的日期
  const groupLabel = group.planName ?? group.service?.name ?? ''
  const oldDateText = current.toISOString().slice(0, 10).replace(/-/g, '/')
  const newDateText = requested.toISOString().slice(0, 10).replace(/-/g, '/')
  group.members.forEach(m => {
    notify({
      userId:  m.userId,
      type:    'billing_date_adjusted',
      title:   '下次扣款日已調整',
      message: `「${groupLabel}」的下次扣款日由 ${oldDateText} 調整為 ${newDateText}，原因：${note}`,
      meta:    { groupId, oldDate: current.toISOString(), nextBillingDate: requested.toISOString(), note },
    })
  })

  return updated
}

// POST /groups/:id/confirm — 成員確認服務正常（確認期間）
export async function confirmService({ groupId, userId }) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: { include: { user: { select: { id: true, name: true } } } },
      host:    { select: { id: true } },
      service: { select: { name: true } },
    },
  })
  if (!group) throw httpError(404, '群組不存在')
  if (group.status !== 'confirming') throw httpError(400, `群組狀態為 ${group.status}，不在確認期`)

  const member = group.members.find(m => m.userId === userId)
  if (!member) throw httpError(403, '你不是此群組成員')

  const now = new Date()
  const groupLabel = group.planName ?? group.service?.name ?? ''

  // 成員確認服務正常跟信用分數 +2（付款被團主確認）包在同一個 transaction，避免確認成功但加分失敗
  await prisma.$transaction(async (tx) => {
    await tx.member.update({ where: { id: member.id }, data: { confirmedAt: now } })
    await adjustCreditScore(tx, { userId: member.userId, delta: 2, reason: '付款被團主確認', groupId })
  })

  // 原本只寫一則群組聊天室的系統訊息（見下方 git blame），使用者反應這樣不會出現在通知中心、
  // 團主不容易注意到，改成真正的 Notification，不再另外發群組訊息
  notify({
    userId:  group.hostId,
    type:    'member_confirmed_service',
    title:   '成員已確認服務正常',
    message: `${member.user.name} 已確認「${groupLabel}」服務正常。`,
    meta:    { groupId },
  })

  // 確認全員是否都已確認（含剛才更新的成員）
  const updatedMembers = await prisma.member.findMany({ where: { groupId } })
  const allConfirmed   = updatedMembers.every(m => m.id === member.id ? true : m.confirmedAt != null)
  const deadlinePassed = group.confirmDeadline && new Date(group.confirmDeadline) <= now

  if (!allConfirmed && !deadlinePassed) return { group: null, released: false }

  // 撥款：escrowTokens → host.tokenBalance；用條件式 updateMany 當樂觀鎖搶佔撥款資格，
  // 避免跟另一位成員幾乎同時確認、或跟 GET /:id 觸發的逾期自動撥款互相撞在一起，
  // 讓同一筆代管款項被撥款兩次
  const released = await prisma.$transaction(async (tx) => {
    const claimed = await tx.group.updateMany({
      where: { id: groupId, status: 'confirming' },
      data:  { status: 'active', confirmDeadline: null, escrowTokens: 0 },
    })
    if (claimed.count === 0) return null // 已被其他併發請求撥款過了

    // 用函式最上方一開始就讀好的 group.escrowTokens，不用在交易內再讀一次：只要上面的
    // updateMany 成功搶到 status='confirming' 這個條件，就保證這段期間沒有其他路徑動過
    // escrowTokens（唯一會動它的撥款/退款路徑都要求 status 先離開 confirming 才能進行）
    await tx.user.update({
      where: { id: group.host.id },
      data:  { tokenBalance: { increment: group.escrowTokens } },
    })
    await tx.tokenTransaction.create({
      data: {
        userId:        group.host.id,
        type:          'release',
        amount:        group.escrowTokens,
        relatedGroupId: groupId,
        note:          '確認期結束，代管款項撥付',
      },
    })
    await tx.subscription.updateMany({
      where: { groupId },
      data:  { status: 'active' },
    })

    return tx.group.findUnique({ where: { id: groupId }, include: HOST_GROUP_INCLUDE })
  })

  if (released) {
    prisma.notification.create({
      data: {
        userId:  group.host.id,
        type:    'escrow_released',
        title:   '代管款項已撥款',
        message: `「${groupLabel}」群組確認期結束，代管款項已撥入你的PM幣餘額。`,
        meta:    { groupId },
      },
    }).catch(console.error)
    notifyGroupConversation(groupId, member.userId, `確認期結束，代管款項已撥款給團主。`).catch(console.error)
  }

  // released 為 null 代表已經被其他併發請求（例如同時逾期自動撥款）處理過，直接讀目前真實狀態
  // 回傳即可，不用讓使用者看到誤導的失敗訊息——實際上撥款這件事已經完成了
  const finalGroup = released ?? await prisma.group.findUnique({ where: { id: groupId }, include: HOST_GROUP_INCLUDE })
  return { group: { ...finalGroup, escrowTokens: 0 }, released: true }
}

// POST /groups/:id/dispute — 成員申訴（confirming → disputed）
export async function raiseDispute({ groupId, userId, reason, evidenceUrl }) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: { include: { user: { select: { id: true, name: true } } } },
      service: { select: { name: true } },
    },
  })
  if (!group) throw httpError(404, '群組不存在')
  if (group.status !== 'confirming') throw httpError(400, `群組狀態為 ${group.status}，不在確認期`)

  const member = group.members.find(m => m.userId === userId)
  if (!member) throw httpError(403, '你不是此群組成員')

  // 跟確認期（confirmDeadline）用同一套 48 小時的節奏，避免使用者對兩個時限有不同期待
  const disputeDeadline = new Date()
  disputeDeadline.setHours(disputeDeadline.getHours() + 48)
  const groupLabel = group.planName ?? group.service?.name ?? ''

  const updated = await prisma.$transaction(async (tx) => {
    // 條件式搶佔：避免跟同時發生的「全員確認完成撥款」互相撞在一起，讓已經撥款給團主、
    // 進入 active 的群組又被這裡的舊快照蓋回 disputed
    await claimGroupStatus(tx, groupId, {
      fromStatus: 'confirming',
      data:       { status: 'disputed', disputeDeadline },
    })

    await tx.member.update({
      where: { id: member.id },
      data:  {
        serviceInfoIssueNote: reason.trim(),
        ...(evidenceUrl ? { disputeEvidenceUrl: evidenceUrl } : {}),
      },
    })

    return tx.group.findUnique({ where: { id: groupId }, include: HOST_GROUP_INCLUDE })
  })

  prisma.notification.create({
    data: {
      userId:  group.hostId,
      type:    'dispute_raised',
      title:   '收到成員問題回報',
      message: `${member.user.name} 針對「${groupLabel}」服務回報問題，將於 48 小時內處理完成。`,
      meta:    { groupId },
    },
  }).catch(console.error)
  notifyGroupConversation(groupId, member.userId, `${member.user.name} 回報了服務問題，等待處理。`).catch(console.error)

  // 「帳號資訊」分頁的留言區也留一筆，讓群組所有人（團主＋所有成員）打開分頁就直接看到，
  // 不用只靠聊天室訊息才知道發生什麼事
  prisma.credentialComment.create({
    data: {
      groupId,
      authorId: member.userId,
      content:  `已提出問題回報：${reason.trim()}`.slice(0, 500),
    },
  }).catch(console.error)

  return updated
}

// POST /groups/:id/resolve-dispute — 團主與成員自行協調解決，不需要平台介入裁定（disputed → confirming）
// 跟 adjudicateDispute（管理員裁定，涉及金流分配）是兩條不同路徑：這裡純粹是「雙方已經自己談好，問題排除了」，
// 錢完全不動，只是把群組放回確認期讓成員可以重新確認服務正常，不用每次小問題都卡著等平台處理
export async function resolveDisputeByHost({ groupId, hostId, note }) {
  const group = await prisma.group.findUnique({
    where:   { id: groupId },
    include: { members: { include: { user: { select: { id: true, name: true } } } }, service: { select: { name: true } } },
  })
  if (!group) throw httpError(404, '群組不存在')
  if (group.hostId !== hostId) throw httpError(403, '僅團主可操作')
  if (group.status !== 'disputed') throw httpError(400, `群組狀態為 ${group.status}，不在申訴期`)

  const disputeMember = group.members.find(m => m.serviceInfoIssueNote)
  if (!disputeMember) throw httpError(400, '找不到申訴成員')

  // 回到確認期給成員一個全新的 48 小時確認窗口，跟啟用服務當下第一次進確認期用同一套節奏
  const confirmDeadline = new Date()
  confirmDeadline.setHours(confirmDeadline.getHours() + 48)
  const groupLabel = group.planName ?? group.service?.name ?? ''

  const updated = await prisma.$transaction(async (tx) => {
    // 條件式搶佔：避免跟管理員幾乎同時裁定申訴（adjudicateDispute）互相撞在一起——兩邊都是從
    // disputed 轉出去，只能有一邊真正生效，另一邊要收到明確的錯誤而不是把對方的結果蓋掉
    await claimGroupStatus(tx, groupId, {
      fromStatus: 'disputed',
      data:       { status: 'confirming', disputeDeadline: null, confirmDeadline },
      message:    '這筆申訴剛好已經被處理過了，請重新整理頁面',
    })

    await tx.member.update({
      where: { id: disputeMember.id },
      data:  { serviceInfoIssueNote: null, disputeEvidenceUrl: null, confirmedAt: null },
    })

    return tx.group.findUnique({ where: { id: groupId }, include: HOST_GROUP_INCLUDE })
  })

  // 用獨立的 dispute_resolved_by_host 型別，跟 adjudicateDispute（管理員裁定，會動到金流）共用的
  // dispute_resolved 分開，這樣前端才能只在裁定那邊觸發餘額即時刷新，自行協調解決不涉及金流，
  // 不需要（也不應該）觸發成員端的餘額 API 呼叫
  notify({
    userId:  disputeMember.userId,
    type:    'dispute_resolved_by_host',
    title:   '問題已處理完成',
    message: `團主已回覆「${groupLabel}」你回報的問題並處理完成，請重新確認服務是否正常。`,
    meta:    { groupId },
  })

  prisma.credentialComment.create({
    data: {
      groupId,
      authorId: hostId,
      content:  (note ? `問題已處理完成：${note}` : '問題已處理完成').slice(0, 500),
    },
  }).catch(console.error)

  return updated
}

// POST /groups/:id/cancel — 解散群組（啟用前），退還所有代管給成員
export async function cancelGroup({ groupId, hostId }) {
  const group = await prisma.group.findUnique({ where: { id: groupId }, include: { service: { select: { name: true } } } })
  if (!group) throw httpError(404, '群組不存在')
  if (group.hostId !== hostId) throw httpError(403, '僅團主可解散群組')

  const cancellable = ['recruiting', 'full']
  if (!cancellable.includes(group.status)) throw httpError(400, `群組已鎖定（狀態為 ${group.status}），無法解散`)

  const seatCost = computeSeatCost(group)
  const groupLabelForCancel = group.planName ?? group.service?.name ?? ''

  const currentMembers = await prisma.$transaction(async (tx) => {
    // 條件式更新：確保狀態沒有在讀取跟寫入之間被其他請求（例如同時退出/被移除，或申請人剛好
    // 同時送出新申請）變動過；escrowTokens 這裡先不歸零，等下面把成員跟還在審核中的申請都
    // 退完款才統一歸零，避免 rejectPendingApplications 退款時讀到已經被提早歸零的代管餘額
    const updated = await tx.group.updateMany({
      where: { id: groupId, status: { in: cancellable } },
      data:  { status: 'cancelled' },
    })
    if (updated.count === 0) throw httpError(409, '群組狀態已變動，請重新整理頁面')

    // 在同一個 transaction 裡重新查詢當下真正還在群組內的成員，不用外層讀到的舊名單，
    // 避免跟同時發生的退出/移除撞在一起造成重複退款
    const currentMembers = await tx.member.findMany({ where: { groupId } })
    if (currentMembers.length > 0) {
      // 每人退款金額相同，一次 updateMany/createMany 取代逐筆 await，跟其他退款端點手法一致
      await tx.user.updateMany({
        where: { id: { in: currentMembers.map(m => m.userId) } },
        data:  { tokenBalance: { increment: seatCost } },
      })
      await tx.tokenTransaction.createMany({
        data: currentMembers.map(m => ({
          userId:        m.userId,
          type:          'refund',
          amount:        seatCost,
          relatedGroupId: groupId,
          note:          '群組解散，代管退款',
        })),
      })
    }

    // 還在審核中的申請不會有人再處理了，一併退款並標記為未通過，不能只退成員的錢——
    // 團主解散群組時如果剛好有申請人在申請中，這些人的代管費用之前完全沒有被退還過
    await rejectPendingApplications(tx, groupId, {
      refundNote:   '群組已解散，代管退款',
      buildMessage: groupLabel => `很遺憾，「${groupLabel}」群組已被團主解散，你的申請未通過，代管費用已退還至你的PM幣餘額。`,
    })

    await tx.group.update({ where: { id: groupId }, data: { escrowTokens: 0 } })

    return currentMembers
  })

  currentMembers.forEach(m => {
    notify({
      userId:  m.userId,
      type:    'group_cancelled',
      title:   '群組已解散',
      message: `「${groupLabelForCancel}」群組已被團主解散，代管費用已退還至你的PM幣餘額。`,
      meta:    { groupId },
    })
  })

  return { status: 'cancelled' }
}

// POST /groups/:id/lock — full → pending_confirmation
export async function lockGroup({ groupId, hostId, sharedCredentials: sharedCredentialsRaw }) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true, service: true },
  })
  if (!group) throw httpError(404, '群組不存在')
  if (group.hostId !== hostId) throw httpError(403, '僅團主可操作')
  if (group.status !== 'full') throw httpError(400, `群組狀態為 ${group.status}，無法鎖定（需為 full）`)

  // 設定下次扣款日（從今天起算一個計費週期）
  const nextBillingDate = new Date()
  if (group.billingCycle === 'yearly') nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1)
  else nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)

  // 填寫服務帳號資訊的期限：鎖定時間 + 24h（僅供前端顯示倒數，逾期不會自動處理）
  const serviceInfoDeadline = new Date()
  serviceInfoDeadline.setHours(serviceInfoDeadline.getHours() + 24)

  // 無官方多人邀請機制的服務（sharingMethod: shared_credentials），團主鎖定當下順便提供帳密，
  // 後端不知道 sharingMethod 分類（只存在前端 catalog），單純是有傳就存、沒傳就維持 null
  const sharedCredentials = typeof sharedCredentialsRaw === 'string' && sharedCredentialsRaw.trim()
    ? sharedCredentialsRaw.trim()
    : undefined

  const [updated] = await prisma.$transaction([
    prisma.group.update({
      where: { id: groupId },
      // nextBillingDate 這裡也一起寫回 Group（不只 Subscription），/renew 續訂時是讀 Group 這個
      // 欄位當基準；billingDateAdjustedAt/Note 重置成 null，讓這個新週期重新擁有一次調整額度
      data: {
        status: 'pending_confirmation',
        serviceInfoDeadline,
        nextBillingDate,
        billingDateAdjustedAt:     null,
        billingDateAdjustmentNote: null,
        ...(sharedCredentials !== undefined && { sharedCredentials }),
      },
      include: HOST_GROUP_INCLUDE,
    }),
    prisma.subscription.updateMany({
      where: { groupId },
      data:  { nextBillingDate },
    }),
  ])

  // 聊天室已由前端在鎖定前先建立好，這裡補一則系統訊息告知所有成員聊天室已啟用
  const groupLabel = group.planName ?? group.service?.name ?? ''
  notifyGroupConversation(groupId, group.hostId, `「${groupLabel}」聊天室已啟用。`).catch(console.error)

  // 這個階段的扣款日只是預估（實際啟用服務時會重新計算，見 activateGroup），先提醒成員跟團主自己
  // 心裡有個底，開啟群組詳情時前端會用一個 Dialog 特別提示一次
  const estimatedDateText = nextBillingDate.toISOString().slice(0, 10).replace(/-/g, '/')
  ;[group.hostId, ...group.members.map(m => m.userId)].forEach(userId => {
    notify({
      userId,
      type:    'billing_date_confirmed',
      title:   '預估下次扣款日',
      message: `「${groupLabel}」目前預估下次扣款日為 ${estimatedDateText}，實際日期會在團主啟用服務時重新確認。`,
      meta:    { groupId, nextBillingDate: nextBillingDate.toISOString(), estimated: true },
    })
  })

  // sharedCredentials 是否有值可以用來判斷這個服務是不是團主提供帳密的類型（見上方 sharedCredentials
  // 賦值的註解），後端沒有 sharingMethod 分類資料，只能用這個訊號決定通知文案要說「提取」還是「填寫」
  const isSharedCredentials = sharedCredentials !== undefined
  notify({
    userId:  group.hostId,
    type:    'group_chat_opened',
    title:   '群組聊天室已啟用',
    message: `「${groupLabel}」群組已鎖定，聊天室已建立，點擊查看。`,
    meta:    { groupId },
  })
  group.members.forEach(m => {
    notify({
      userId:  m.userId,
      type:    'group_chat_opened',
      title:   '群組聊天室已啟用',
      message: `「${groupLabel}」群組已鎖定，聊天室已建立，點擊查看。`,
      meta:    { groupId },
    })
    notify({
      userId:  m.userId,
      type:    'fill_service_info',
      title:   isSharedCredentials ? '請提取帳號資訊' : '請填寫服務帳號資訊',
      message: isSharedCredentials
        ? `「${groupLabel}」群組已鎖定，請進入提取帳號資訊並完成付款。`
        : `「${groupLabel}」群組已鎖定，請進入填寫服務帳號並完成付款。`,
      meta:    { groupId },
    })
  })

  return updated
}

// POST /groups/:id/adjudicate — 平台裁定申訴（需管理員）
// winner: 'member' → 退款給申訴成員並移出群組；'host' → 撥款給團主
export async function adjudicateDispute({ groupId, winner, reason }) {
  if (!['member', 'host'].includes(winner)) throw httpError(400, 'winner 必須為 member 或 host')
  if (!reason?.trim()) throw httpError(400, '請填寫裁定說明')

  const group = await prisma.group.findUnique({
    where:   { id: groupId },
    include: { members: { include: { user: { select: { id: true } } } }, service: { select: { name: true } } },
  })
  if (!group) throw httpError(404, '群組不存在')
  if (group.status !== 'disputed') throw httpError(400, `群組狀態為 ${group.status}，不在申訴期`)

  // 找申訴成員（有 serviceInfoIssueNote 的那位）
  const disputeMember = group.members.find(m => m.serviceInfoIssueNote)
  if (!disputeMember) throw httpError(400, '找不到申訴成員')

  const seatCost = computeSeatCost(group)
  const groupLabel = group.planName ?? group.service?.name ?? ''

  if (winner === 'member') {
    // 退款給申訴成員，移出群組，其他人代管不變，群組回 active；條件式搶佔避免跟團主幾乎
    // 同時自行標記解決（resolveDisputeByHost）互相撞在一起
    await prisma.$transaction(async (tx) => {
      await claimGroupStatus(tx, group.id, {
        fromStatus: 'disputed',
        data:       { status: 'active', disputeDeadline: null, escrowTokens: { decrement: seatCost } },
        message:    '這筆申訴剛好已經被處理過了，請重新整理頁面',
      })
      await tx.user.update({
        where: { id: disputeMember.userId },
        data:  { tokenBalance: { increment: seatCost } },
      })
      await tx.tokenTransaction.create({
        data: { userId: disputeMember.userId, type: 'refund', amount: seatCost, relatedGroupId: group.id, note: `問題處理結果：${reason.trim()}` },
      })
      await tx.member.delete({ where: { id: disputeMember.id } })
      await tx.subscription.updateMany({
        where: { groupId: group.id, userId: disputeMember.userId },
        data:  { status: 'ended' },
      })
    })

    notify({
      userId:  disputeMember.userId,
      type:    'dispute_resolved',
      title:   '問題處理結果',
      message: `你對「${groupLabel}」回報的問題已確認，本期費用已退還至你的PM幣餘額。`,
      meta:    { groupId: group.id },
    })
    notify({
      userId:  group.hostId,
      type:    'dispute_resolved',
      title:   '問題處理結果',
      message: `「${groupLabel}」的問題處理結果為退款給成員，該成員本期費用已退還並移出群組。`,
      meta:    { groupId: group.id },
    })
  } else {
    // 撥款給團主，群組回 active，全員訂閱啟用；同樣用條件式搶佔避免跟團主自行解決互相撞在一起
    await prisma.$transaction(async (tx) => {
      await claimGroupStatus(tx, group.id, {
        fromStatus: 'disputed',
        data:       { status: 'active', disputeDeadline: null, escrowTokens: 0 },
        message:    '這筆申訴剛好已經被處理過了，請重新整理頁面',
      })
      await tx.user.update({
        where: { id: group.hostId },
        data:  { tokenBalance: { increment: group.escrowTokens } },
      })
      await tx.tokenTransaction.create({
        data: { userId: group.hostId, type: 'release', amount: group.escrowTokens, relatedGroupId: group.id, note: `問題處理結果：${reason.trim()}` },
      })
      await tx.subscription.updateMany({ where: { groupId: group.id }, data: { status: 'active' } })
    })

    notify({
      userId:  group.hostId,
      type:    'escrow_released',
      title:   '代管款項已撥款',
      message: `問題處理結果：「${groupLabel}」代管款項已撥入你的PM幣餘額。`,
      meta:    { groupId: group.id },
    })
    notify({
      userId:  disputeMember.userId,
      type:    'dispute_resolved',
      title:   '問題處理結果',
      message: `你對「${groupLabel}」回報的問題經確認後，本期費用已撥款給團主。`,
      meta:    { groupId: group.id },
    })
  }

  return { winner, disputeMemberId: disputeMember.userId }
}

// POST /groups/:id/renew — active → pending_confirmation，向每位成員收取本期代管費用並重置帳號資訊
export async function renewGroup({ groupId, hostId }) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: { include: { user: { select: { id: true, tokenBalance: true } } } } },
  })
  if (!group) throw httpError(404, '群組不存在')
  if (group.hostId !== hostId) throw httpError(403, '僅團主可操作')
  if (group.status !== 'active') throw httpError(400, `群組狀態為 ${group.status}，無法開始新一期（需為 active）`)

  const seatCost = computeSeatCost(group)

  const memberIds = group.members.map(m => m.userId)
  const insufficient = group.members.filter(m => m.user.tokenBalance < seatCost)
  if (insufficient.length > 0) {
    throw httpError(400, `${insufficient.length} 位成員PM幣餘額不足，無法開始新一期收款`, {
      code:      'INSUFFICIENT_BALANCE',
      memberIds: insufficient.map(m => m.userId),
    })
  }

  const base = new Date(group.nextBillingDate ?? new Date())
  if (group.billingCycle === 'yearly') base.setFullYear(base.getFullYear() + 1)
  else base.setMonth(base.getMonth() + 1)

  // 續訂後回到跟第一次鎖定群組相同的填寫帳號資訊階段，比照設定 24h 倒數
  const serviceInfoDeadline = new Date()
  serviceInfoDeadline.setHours(serviceInfoDeadline.getHours() + 24)

  const updated = await prisma.$transaction(async (tx) => {
    // 條件式搶佔：確保只有一個 renew 請求能真正往下扣款，避免團主快速點兩下（或分頁重複送出）
    // 導致同一期跟每位成員收了兩次錢——下面的餘額 gte 檢查只能防止扣成負數，防不了重複扣款
    await claimGroupStatus(tx, groupId, {
      fromStatus: 'active',
      data:       { status: 'pending_confirmation' },
    })

    // 向每位成員收取本期代管費用；用 gte 條件式扣款，避免上方檢查後、寫入前餘額被其他請求變動造成扣成負數
    const charged = await tx.user.updateMany({
      where: { id: { in: memberIds }, tokenBalance: { gte: seatCost } },
      data:  { tokenBalance: { decrement: seatCost } },
    })
    if (charged.count !== memberIds.length) throw httpError(409, '部分成員PM幣餘額於扣款當下不足，請稍後重試')

    await tx.tokenTransaction.createMany({
      data: memberIds.map(userId => ({
        userId,
        type:           'escrow',
        amount:         -seatCost,
        relatedGroupId: groupId,
        note:           `新一期代管 ${seatCost} PM`,
      })),
    })

    // 清空所有成員的服務帳號資訊，讓他們重新填寫
    await tx.member.updateMany({
      where: { groupId },
      data:  { serviceInfo: null, serviceInfoIssueNote: null, confirmedAt: null },
    })

    // Subscription.nextBillingDate 也要一起更新（跟 lockGroup 一樣），不然成員端卡片顯示的
    // 還是上一期的舊日期；billingDateAdjustedAt/Note 重置成 null，讓新的一期重新擁有一次調整額度
    await tx.subscription.updateMany({
      where: { groupId },
      data:  { nextBillingDate: base },
    })

    return tx.group.update({
      where: { id: groupId },
      data:  {
        status: 'pending_confirmation',
        nextBillingDate: base,
        serviceInfoDeadline,
        escrowTokens: { increment: seatCost * memberIds.length },
        billingDateAdjustedAt:     null,
        billingDateAdjustmentNote: null,
      },
      include: HOST_GROUP_INCLUDE,
    })
  })

  // 續訂後回到跟第一次鎖定群組一樣的「預估」階段，同一套通知類型，見 lockGroup 的說明
  const groupLabel = group.planName ?? ''
  const estimatedDateText = base.toISOString().slice(0, 10).replace(/-/g, '/')
  ;[group.hostId, ...memberIds].forEach(userId => {
    notify({
      userId,
      type:    'billing_date_confirmed',
      title:   '預估下次扣款日',
      message: `「${groupLabel}」新一期目前預估下次扣款日為 ${estimatedDateText}，實際日期會在團主啟用服務時重新確認。`,
      meta:    { groupId, nextBillingDate: base.toISOString(), estimated: true },
    })
  })

  memberIds.forEach(userId => {
    notify({
      userId,
      type:    'group_renewal',
      title:   '新一期已開始',
      message: `「${groupLabel}」群組開始新一期，請前往填寫最新服務帳號資訊。`,
      meta:    { groupId },
    })
  })

  return updated
}
