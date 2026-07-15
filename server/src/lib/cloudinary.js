import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// data: 'data:<mime>;base64,...'
export async function uploadImage(data, { folder, resourceType = 'image', transformation } = {}) {
  const result = await cloudinary.uploader.upload(data, {
    folder,
    resource_type: resourceType,
    ...(transformation && { transformation }),
  })
  return { url: result.secure_url, publicId: result.public_id }
}

export default cloudinary
