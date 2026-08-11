import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import morgan from 'morgan'
import { errorHandler } from './middleware/errorHandler.js'

import authRoutes          from './routes/auth.js'
import groupRoutes         from './routes/groups/index.js'
import applicationRoutes   from './routes/applications.js'
import subscriptionRoutes  from './routes/subscriptions.js'
import notificationRoutes  from './routes/notifications.js'
import conversationRoutes  from './routes/conversations.js'
import favoriteRoutes      from './routes/favorites.js'
import serviceRoutes       from './routes/services.js'
import userRoutes          from './routes/users.js'
import uploadRoutes        from './routes/upload.js'
import memberRoutes        from './routes/members.js'
import tokenRoutes         from './routes/tokens.js'
import paymentMethodRoutes from './routes/paymentMethods.js'
import reviewRoutes        from './routes/reviews.js'
import systemMessageRoutes from './routes/systemMessages.js'
import credentialCommentRoutes from './routes/credentialComments.js'
import adminRoutes         from './routes/admin.js'

const app = express()

// ── 基礎 middleware ────────────────────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin:      process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
}))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes)
app.use('/api/groups',        groupRoutes)
app.use('/api/applications',  applicationRoutes)
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/conversations', conversationRoutes)
app.use('/api/favorites',     favoriteRoutes)
app.use('/api/services',      serviceRoutes)
app.use('/api/users',         userRoutes)
app.use('/api/upload',        uploadRoutes)
app.use('/api/members',       memberRoutes)
app.use('/api/tokens',          tokenRoutes)
app.use('/api/payment-methods', paymentMethodRoutes)
app.use('/api/reviews',         reviewRoutes)
app.use('/api/system-messages', systemMessageRoutes)
app.use('/api/credential-comments', credentialCommentRoutes)
app.use('/api/admin',         adminRoutes)

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date() }))

// ── 全域錯誤處理 ──────────────────────────────────────────────────────────────
app.use(errorHandler)

export default app
