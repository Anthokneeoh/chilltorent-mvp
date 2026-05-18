import imageCompression from 'browser-image-compression'
import { validateVideoDuration } from '@/lib/utils/formatters'
export async function compressImage(file: File, maxSizeMB: number = 1): Promise<File> {
    const options = {
        maxSizeMB,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/jpeg',
    }
    try {
        const compressed = await imageCompression(file, options)
        return compressed
    } catch (error) {
        console.error('Client-side image compression engine failure:', error)
        throw new Error('Failed to process image. Please try uploading a smaller file format.')
    }
}
export async function getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src)
            resolve(video.duration)
        }
        video.onerror = () => {
            window.URL.revokeObjectURL(video.src)
            resolve(0)
        }
        video.src = URL.createObjectURL(file)
    })
}

export async function prepareMediaFile(file: File): Promise<{ file: File; media_type: 'image' | 'video' }> {
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
        throw new Error('Unsupported file format. Please upload a standard image or video asset.')
    }

    if (isVideo) {
        const isValid = await validateVideoDuration(file)
        if (!isValid) {
            throw new Error('Video uploads are restricted to a maximum length of 30 seconds.')
        }
        return { file, media_type: 'video' }
    }

    const compressed = await compressImage(file)
    return { file: compressed, media_type: 'image' }
}