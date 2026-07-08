// ExploreGroupCard 的 memo 比對函式只檢查 id/status/openSeats，不含 serviceId/serviceName，
// 建立群組流程的預覽卡若用固定字串當 id 會導致換服務/方案後畫面卡在舊資料，
// 因此用會影響預覽內容的表單欄位組成動態 id，確保 memo 能偵測到變化。
export function buildPreviewGroupId(form) {
  return `__preview__:${form.serviceId}:${form.planName}:${form.totalSeats}:${form.billingCycle}`
}
