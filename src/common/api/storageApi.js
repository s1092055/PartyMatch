import client from './axiosClient'

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function uploadFile(endpoint, file) {
  const data = await fileToBase64(file)
  const result = await client.post(endpoint, { data })
  return result.url
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
