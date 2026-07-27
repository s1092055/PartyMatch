export function isImageUrl(url) {
  return /\.(png|jpe?g|gif|webp|heic)(\?|$)/i.test(url)
}
