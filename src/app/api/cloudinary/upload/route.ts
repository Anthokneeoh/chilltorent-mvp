import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Configure Cloudinary Core
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
})

// Maximum file bounds
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_VIDEO_SIZE = 14 * 1024 * 1024 // 14MB

export async function POST(request: NextRequest) {
    try {
        // 1. Verify user session validation credentials
        const supabase = await createServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized credentials profile missing.' }, { status: 401 })
        }

        // 2. Enforce permission scopes from profiles
        const { data: profile } = await (supabase.from('profiles') as any)
            .select('role')
            .eq('id', user.id)
            .single()

        const role = profile?.role
        if (role !== 'landlord' && role !== 'admin') {
            return NextResponse.json({ error: 'Access forbidden. Privilege scope mismatch.' }, { status: 403 })
        }

        // 3. Extract multi-part data allocations
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const folder = formData.get('folder') as string || 'property_media'

        if (!file) {
            return NextResponse.json({ error: 'No data file packet identified.' }, { status: 400 })
        }

        // 4. Boundary verification parsing
        const isImage = file.type.startsWith('image/')
        const isVideo = file.type.startsWith('video/')
        if (!isImage && !isVideo) {
            return NextResponse.json({ error: 'Mime type rejected. File format must evaluate as an image or video.' }, { status: 400 })
        }

        if (isImage && file.size > MAX_IMAGE_SIZE) {
            return NextResponse.json({ error: 'Image file envelope exceeds the permitted 10MB allocation window.' }, { status: 400 })
        }
        if (isVideo && file.size > MAX_VIDEO_SIZE) {
            return NextResponse.json({ error: 'Video payload size exceeds the serverless network forwarding limits.' }, { status: 400 })
        }

        // 5. Convert incoming binary to Node.js stream consumable buffers
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // 6. Pipe buffer directly out to Cloudinary Asset Storage Managers
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: isVideo ? 'video' : 'image',
                    transformation: isVideo
                        ? [{ quality: 'auto' }]
                        : [{ width: 1200, crop: 'limit', quality: 'auto' }],
                },
                (error, uploadResult) => {
                    if (error) reject(error)
                    else resolve(uploadResult)
                }
            ).end(buffer)
        })

        const uploadResult = result as { secure_url: string; public_id: string }

        return NextResponse.json({
            secure_url: uploadResult.secure_url,
            public_id: uploadResult.public_id,
        })
    } catch (error: any) {
        console.error('Fatal edge transfer sequence breakdown inside Cloudinary controller:', error)
        return NextResponse.json({ error: error.message || 'Asset processing pipeline crashed.' }, { status: 500 })
    }
}