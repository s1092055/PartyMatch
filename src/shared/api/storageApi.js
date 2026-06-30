import client from './axiosClient'

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function uploadPaymentProof(_groupId, _userId, file) {
  const data = await fileToBase64(file)
  const result = await client.post('/upload/payment-proof', { data })
  return result.url
}
