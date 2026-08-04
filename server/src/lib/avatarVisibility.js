// 使用者可以在「其他設定」關閉「顯示自己的大頭照」，這裡把任何要回傳給「別人」看的
// 使用者資料裡的 avatarInitial/avatarColor 蓋成 null（前端遇到 null 會 fallback 成
// PartyMatch logo），並拿掉 showAvatar 這個欄位本身——不需要讓其他使用者知道對方的
// 開關狀態。只有使用者查看/編輯自己的 profile 時才不套用這層遮罩，維持看到自己的真實大頭照
export function maskAvatar(user) {
  if (!user) return user
  const { showAvatar, ...rest } = user
  if (showAvatar === false) {
    return { ...rest, avatarInitial: null, avatarColor: null }
  }
  return rest
}
