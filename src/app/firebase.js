import { initializeApp } from 'firebase/app'
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const firebaseApp = initializeApp(firebaseConfig)

// Safari 的 WebSocket/WebChannel 連線常靜默斷線，用 experimentalForceLongPolling 改為 HTTP long-polling。
// persistentLocalCache 讓離線快取也生效。
export const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache(),
  experimentalForceLongPolling: true,
})
export const auth = getAuth(firebaseApp)
