import { NextResponse } from 'next/server'
import { generateUploadSignature } from '@/lib/cloudinary'
import { getCurrentUser } from '@/lib/supabase/server'

export async function POST(request: Request) {
    try {
        const sessionInstance = await getCurrentUser()

        if (!sessionInstance || !sessionInstance.user) {
            return NextResponse.json({ error: 'Unauthorized credentials' }, { status: 401 })
        }

        const role = sessionInstance.profile?.role
        if (role !== 'landlord' && role !== 'admin') {
            return NextResponse.json(
                { error: 'Forbidden: Restricted strictly to platform Landlords and Admins' },
                { status: 403 }
            )
        }

        const body = await request.json().catch(() => ({}))
        const folder = body.folder || 'property_media'
        const allowedFormats = body.allowedFormats || ['jpg', 'jpeg', 'png', 'webp', 'mp4']
        const uploadParams = await generateUploadSignature(folder, allowedFormats)

        return NextResponse.json(uploadParams)
    } catch (error) {
        console.error('Cloudinary signature engine route error:', error)
        return NextResponse.json({ error: 'Internal system gateway exception' }, { status: 500 })
    }
}