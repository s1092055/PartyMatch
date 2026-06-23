function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function uploadPaymentProof(_groupId, _userId, file) {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY
  const base64 = await fileToBase64(file)

  const formData = new FormData()
  formData.append('key', apiKey)
  formData.append('image', base64)

  const res = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) throw new Error(`[imgbb] upload failed: ${res.status}`)
  const json = await res.json()
  return json.data.url
}
