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

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) setUser(loadProfile())
  }

  async function handleUserChange(key, value) {
    const previousValue = user[key]
    setUser(prev => ({ ...prev, [key]: value }))
    const result = await useAuthStore.getState().updateProfile({ [key]: value });
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
