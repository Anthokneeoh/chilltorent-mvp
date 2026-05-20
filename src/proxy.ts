import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    let user = null
    try {
        const { data, error } = await supabase.auth.getUser()

        if (error) {
            if (error.code === 'refresh_token_not_found' || error.status === 400) {
                console.warn('[MIDDLEWARE] Stale session detected. Flushing cookies and bouncing to login.')
                const redirectUrl = new URL('/login', request.url)
                const cleanResponse = NextResponse.redirect(redirectUrl)

                cleanResponse.cookies.delete('sb-access-token')
                cleanResponse.cookies.delete('sb-refresh-token')
                return cleanResponse
            }
        }
        user = data?.user ?? null
    } catch (catchErr) {
        console.error('[MIDDLEWARE EXCEPTION] Unexpected crash during user initialization:', catchErr)
        const redirectUrl = new URL('/login', request.url)
        return NextResponse.redirect(redirectUrl)
    }

    const { pathname } = request.nextUrl

    if (pathname.startsWith('/api/') || pathname.includes('.')) {
        return response
    }
    const isPublicRoute =
        pathname === '/' ||
        pathname === '/properties' ||
        pathname.startsWith('/properties/') ||
        pathname === '/login' ||
        pathname === '/signup'

    if (!user && !isPublicRoute) {
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(redirectUrl)
    }

    if (user && (pathname === '/login' || pathname === '/signup')) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = profile?.role || 'tenant'

        const dashboardMap = {
            tenant: '/tenant',
            landlord: '/landlord',
            admin: '/admin',
        }
        return NextResponse.redirect(new URL(dashboardMap[role as keyof typeof dashboardMap] || '/', request.url))
    }

    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = profile?.role

        if (!profile && isPublicRoute) {
            return response
        }

        if (pathname.startsWith('/admin') && role !== 'admin') {
            return NextResponse.redirect(new URL(role ? `/${role}` : '/', request.url))
        }
        if (pathname.startsWith('/landlord') && role !== 'landlord') {
            return NextResponse.redirect(new URL(role ? `/${role}` : '/', request.url))
        }
        if (pathname.startsWith('/tenant') && role !== 'tenant') {
            return NextResponse.redirect(new URL(role ? `/${role}` : '/', request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}