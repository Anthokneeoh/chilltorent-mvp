import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const nextParam = requestUrl.searchParams.get('next') || '/'
    let safeRedirectTarget = '/'
    if (nextParam.startsWith('/') && !nextParam.startsWith('//')) {
        safeRedirectTarget = nextParam
    }

    if (code) {
        try {
            const cookieStore = await cookies()

            const supabase = createServerClient<Database>(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    cookies: {
                        getAll() {
                            return cookieStore.getAll()
                        },
                        setAll(cookiesToSet) {
                            try {
                                cookiesToSet.forEach(({ name, value, options }) =>
                                    cookieStore.set(name, value, options)
                                )
                            } catch {
                            }
                        },
                    },
                }
            )

            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
            if (exchangeError) throw exchangeError

        } catch (err: any) {
            console.error('Fatal authorization handshake sequence breakdown:', err)

            const errorMsg = encodeURIComponent('Your verification link has expired or was already processed.')
            return NextResponse.redirect(new URL(`/login?error=${errorMsg}`, request.url))
        }
    }
    return NextResponse.redirect(new URL(safeRedirectTarget, request.url))
}