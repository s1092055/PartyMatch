import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogCloseButton } from './dialog'
import { useAuthStore } from '../../common/stores/useAuthStore'
import { toast } from '../../common/utils/toast'
import ProfileHeaderCard from './ProfileHeaderCard'
import PersonalInfoTab from './PersonalInfoTab'

function loadProfile() {
  const profile = useAuthStore.getState().getProfile()
  return {
    ...profile,
    phone: profile?.phone ?? '',
    bio: profile?.bio ?? '',
  }
}

export default function ProfileModal({ isOpen, onClose }) {
  const [user, setUser] = useState(loadProfile)

  // 每次開啟都重新讀一次快照，避免顯示上次開啟後在別的 Modal（例如設定）異動過的舊值
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) setUser(loadProfile())
  }

  async function handleUserChange(key, value) {
    const previousValue = user[key]
    setUser(prev => ({ ...prev, [key]: value }))
    // updateProfile 失敗時回傳 { ok: false }（不會 throw），先前用 .catch 接永遠接不到，
    // 導致儲存失敗被完全吞掉、畫面仍顯示未儲存成功的樂觀值——改為檢查 result.ok 並復原；
    // 回傳這個 promise 讓呼叫端（欄位的儲存按鈕）可以在存檔中顯示 loading 狀態
    const result = await useAuthStore.getState().updateProfile({ [key]: value })
    if (result.ok) return
    setUser(prev => ({ ...prev, [key]: previousValue }))
    toast(result.error ?? '儲存失敗，請稍後再試', 'error')
  }

  return (
    <Dialog open={isOpen} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent maxWidth="max-w-md" height="min(80dvh, 640px)">
        <DialogHeader>
          <DialogTitle>個人資料</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>
        <DialogDescription>個人資料</DialogDescription>
        <DialogBody className="px-6 py-5">
          <ProfileHeaderCard user={user} />
          <PersonalInfoTab user={user} onChange={handleUserChange} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
