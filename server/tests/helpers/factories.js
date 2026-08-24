import prisma from '../../src/lib/prisma.js'
import { signAccessToken } from '../../src/utils/jwt.js'

let counter = 0
function uniqueEmail() {
  counter += 1
  return `test-${Date.now()}-${counter}@partymatch.test`
}

export async function createUser({ tokenBalance = 0, name = '測試使用者', isAdmin = false } = {}) {
  const user = await prisma.user.create({
    data: {
      email:        uniqueEmail(),
      passwordHash: null,
      name,
      phone:        '+886900000000',
      tokenBalance,
      isAdmin,
    },
  })
  return user
}

export function authHeader(user) {
  const token = signAccessToken({ id: user.id, email: user.email })
  return `Bearer ${token}`
}

export async function createGroup({ host, monthlyFee = 300, maxMembers = 2, billingCycle = 'monthly' } = {}) {
  const service = await prisma.service.create({
    data: {
      id:       `svc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name:     '測試服務',
      category: 'other',
      plans:    [{ id: 'plan-basic', name: '基本方案', maxMembers, monthlyFee, currency: 'TWD' }],
    },
  })
  const group = await prisma.group.create({
    data: {
      hostId:   host.id,
      serviceId: service.id,
      planId:    'plan-basic',
      planName:  '基本方案',
      maxMembers,
      monthlyFee,
      billingCycle,
    },
  })
  return { group, service }
}
