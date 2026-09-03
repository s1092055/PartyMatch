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
import reviewRoutes        from './routes/reviews.js'
import systemMessageRoutes from './routes/systemMessages.js'
import credentialCommentRoutes from './routes/credentialComments.js'
import platformReportRoutes    from './routes/platformReports.js'
import adminRoutes         from './routes/admin/index.js'
import adminAuthRoutes     from './routes/adminAuth.js'

const app = express()

app.set('trust proxy', 1);

app.use(helmet());
const allowedOrigins = (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())

// 開發環境用手機連 Mac 熱點測試時，Mac 的 LAN IP 會隨網路切換而改變，
// 與其每次手動更新 CLIENT_ORIGIN，直接放行區網網段的 origin（僅限開發環境）
const LAN_ORIGIN_PATTERN = /^http:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+):5173$/

app.use(cors({
  origin(origin, callback) {
    const isAllowed = !origin
      || allowedOrigins.includes(origin)
      || (process.env.NODE_ENV !== 'production' && LAN_ORIGIN_PATTERN.test(origin))
    if (isAllowed) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

app.use('/api/auth',          authRoutes);
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
app.use('/api/reviews',         reviewRoutes)
app.use('/api/system-messages', systemMessageRoutes)
app.use('/api/credential-comments', credentialCommentRoutes)
app.use('/api/platform-reports', platformReportRoutes)
app.use('/api/admin/auth',    adminAuthRoutes)
app.use('/api/admin',         adminRoutes)

app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date() }));

app.use(errorHandler);

export default app
