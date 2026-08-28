import client from './axiosClient'

const EXT_MIME_FALLBACK = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', heic: 'image/heic', heif: 'image/heic',
}

export function resolveImageMime(file) {
  if (file.type) return file.type
  const ext = file.name?.split('.').pop()?.toLowerCase()
  return EXT_MIME_FALLBACK[ext] ?? ''
}

const UPLOAD_TIMEOUT_MS = 60_000

async function uploadFile(endpoint, file, onProgress) {
  const mime = resolveImageMime(file)
  const blob = mime && mime !== file.type ? file.slice(0, file.size, mime) : file
  const formData = new FormData()
  formData.append('file', blob, file.name)
  return client.post(endpoint, formData, {
    timeout: UPLOAD_TIMEOUT_MS,
    headers: { 'Content-Type': undefined },
    onUploadProgress: onProgress && (e => onProgress(e.total ? Math.round((e.loaded / e.total) * 100) : 0)),
  })
}

export async function uploadDisputeEvidence(file, onProgress) {
  return uploadFile('/upload/dispute-evidence', file, onProgress)
}

export async function uploadServiceIssueEvidence(file, onProgress) {
  return uploadFile('/upload/service-issue-evidence', file, onProgress)
}

export async function uploadCredentialCommentAttachment(file, onProgress) {
  return uploadFile('/upload/credential-comment-attachment', file, onProgress)
}

export async function uploadMessageAttachment(file, onProgress) {
  return uploadFile('/upload/message-attachment', file, onProgress)
}
