import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
})

export { cloudinary }

export async function generateUploadSignature(
    folder: string,
    allowedFormats: string[] = ['jpg', 'png', 'webp', 'mp4']
) {
    const timestamp = Math.round(Date.now() / 1000)
    const signature = cloudinary.utils.api_sign_request(
        {
            timestamp,
            folder,
            allowed_formats: allowedFormats.join(','),
            upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
        },
        process.env.CLOUDINARY_API_SECRET!
    )
    return {
        signature,
        timestamp,
        cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        folder,
        allowedFormats,
    }
}

export async function deleteAsset(publicId: string) {
    try {
        const result = await cloudinary.uploader.destroy(publicId)
        return result
    } catch (error) {
        console.error('Cloudinary delete error:', error)
        return null
    }
}