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

export async function uploadPaymentProof(_groupId, _userId, file) {
  return uploadFile('/upload/payment-proof', file)
}

export async function uploadDisputeEvidence(file) {
  return uploadFile('/upload/dispute-evidence', file)
}
