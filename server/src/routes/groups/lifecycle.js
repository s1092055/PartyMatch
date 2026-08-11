import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, requireAdmin } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { toPlainGroup } from '../../utils/pricing.js'
import { maskAvatar } from '../../lib/avatarVisibility.js'
import * as groupLifecycleService from '../../services/groupLifecycle.service.js'

const router = Router()

// 群組狀態機的業務邏輯（驗證、交易、通知）都搬去 services/groupLifecycle.service.js，
// 這裡只負責：讀 req、呼叫對應的 service 函式、把回傳的 group 物件套上大頭照遮罩／
// Decimal 轉型後送出 response——維持路由層「只管 HTTP，不管業務規則」的分工
function maskGroupHost(group) {
  return toPlainGroup(group?.host ? { ...group, host: maskAvatar(group.host) } : group)
}

const disputeSchema = z.object({
  reason:      z.string().trim().min(1).max(500),
  evidenceUrl: z.string().url(),
})

const adjustBillingDateSchema = z.object({
  nextBillingDate: z.string(),
  note:            z.string().trim().min(1).max(300),
})

const resolveDisputeSchema = z.object({
  note: z.string().trim().max(500).optional(),
})

// POST /groups/:id/activate — pending_activation → confirming（48h 確認期開始）
router.post('/:id/activate', requireAuth, async (req, res, next) => {
  try {
    const updated = await groupLifecycleService.activateGroup({ groupId: req.params.id, hostId: req.user.id })
    res.json(maskGroupHost(updated))
  } catch (err) { next(err) }
})

// PATCH /groups/:id/billing-date — 團主在確認期調整下次扣款日（外部設定延誤等情況的補救窗口）
router.patch('/:id/billing-date', requireAuth, validate(adjustBillingDateSchema), async (req, res, next) => {
  try {
    const updated = await groupLifecycleService.adjustBillingDate({
      groupId: req.params.id,
      hostId:  req.user.id,
      nextBillingDate: req.body.nextBillingDate,
      note:            req.body.note,
    })
    res.json(maskGroupHost(updated))
  } catch (err) { next(err) }
})

// POST /groups/:id/confirm — 成員確認服務正常（確認期間）
router.post('/:id/confirm', requireAuth, async (req, res, next) => {
  try {
    const { group, released } = await groupLifecycleService.confirmService({ groupId: req.params.id, userId: req.user.id })
    res.json({ group: group ? maskGroupHost(group) : null, released })
  } catch (err) { next(err) }
})

// POST /groups/:id/dispute — 成員申訴（confirming → disputed）
router.post('/:id/dispute', requireAuth, validate(disputeSchema), async (req, res, next) => {
  try {
    const updated = await groupLifecycleService.raiseDispute({
      groupId:     req.params.id,
      userId:      req.user.id,
      reason:      req.body.reason,
      evidenceUrl: req.body.evidenceUrl,
    })
    res.json(maskGroupHost(updated))
  } catch (err) { next(err) }
})

// POST /groups/:id/resolve-dispute — 團主與成員自行協調解決，不需要平台介入裁定（disputed → confirming）
router.post('/:id/resolve-dispute', requireAuth, validate(resolveDisputeSchema), async (req, res, next) => {
  try {
    const updated = await groupLifecycleService.resolveDisputeByHost({
      groupId: req.params.id,
      hostId:  req.user.id,
      note:    req.body.note,
    })
    res.json(maskGroupHost(updated))
  } catch (err) { next(err) }
})

// POST /groups/:id/cancel — 解散群組（啟用前），退還所有代管給成員
router.post('/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    const result = await groupLifecycleService.cancelGroup({ groupId: req.params.id, hostId: req.user.id })
    res.json(result)
  } catch (err) { next(err) }
})

// POST /groups/:id/lock — full → pending_confirmation
router.post('/:id/lock', requireAuth, async (req, res, next) => {
  try {
    const updated = await groupLifecycleService.lockGroup({
      groupId:  req.params.id,
      hostId:   req.user.id,
      sharedCredentials: req.body?.sharedCredentials,
    })
    res.json(maskGroupHost(updated))
  } catch (err) { next(err) }
})

// POST /groups/:id/adjudicate — 平台裁定申訴（需管理員）
router.post('/:id/adjudicate', requireAdmin, async (req, res, next) => {
  try {
    const result = await groupLifecycleService.adjudicateDispute({
      groupId: req.params.id,
      winner:  req.body.winner,
      reason:  req.body.reason,
    })
    res.json(result)
  } catch (err) { next(err) }
})

// POST /groups/:id/renew — active → pending_confirmation，向每位成員收取本期代管費用並重置帳號資訊
router.post('/:id/renew', requireAuth, async (req, res, next) => {
  try {
    const updated = await groupLifecycleService.renewGroup({ groupId: req.params.id, hostId: req.user.id })
    res.json(maskGroupHost(updated))
  } catch (err) {
    // errorHandler 只會轉發 message，PM 幣餘額不足這個錯誤前端還需要 code/memberIds
    // 才能標示出是哪些成員餘額不夠，這裡跟 applications.js 同一套手法自己攔截組回應
    if (err.code === 'INSUFFICIENT_BALANCE') {
      return res.status(err.statusCode).json({ message: err.message, code: err.code, memberIds: err.memberIds })
    }
    next(err)
  }
})

export default router
