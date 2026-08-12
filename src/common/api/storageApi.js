import client from './axiosClient'

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// 回傳 { key, url }：key 是要存進資料庫、之後每次讀取都要靠它重新換發簽章網址的永久識別碼；
// url 是這次上傳當下順便簽的短效預覽網址，只給上傳完馬上顯示縮圖用，過一段時間會失效
async function uploadFile(endpoint, file) {
  const data = await fileToBase64(file)
  return client.post(endpoint, { data })
}

export async function uploadDisputeEvidence(file) {
  return uploadFile('/upload/dispute-evidence', file)
}

export async function uploadServiceIssueEvidence(file) {
  return uploadFile('/upload/service-issue-evidence', file)
}

export async function uploadCredentialCommentAttachment(file) {
  return uploadFile('/upload/credential-comment-attachment', file)
}

export async function uploadMessageAttachment(file) {
  return uploadFile('/upload/message-attachment', file)
}
