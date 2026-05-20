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

    const { pathname } = request.nextUrl

    // Immediate safety return for system APIs and static assets
    if (pathname.startsWith('/api/') || pathname.includes('.')) {
        return response
    }

    // Determine path classifications upfront
    const isPublicRoute =
        pathname === '/' ||
        pathname === '/properties' ||
        pathname.startsWith('/properties/') ||
        pathname === '/login' ||
        pathname === '/signup'

    let user = null
    try {
        const { data, error } = await supabase.auth.getUser()

        if (error) {
            if (error.code === 'refresh_token_not_found' || error.status === 400 || error.message?.includes('refresh_token')) {
                // FIX: Break infinite loops. If they are already on a public route, just continue without a session context
                if (!isPublicRoute) {
                    console.warn('[MIDDLEWARE] Stale session detected on protected asset route. Bouncing to login safely.')
                    const redirectUrl = new URL('/login', request.url)
                    const cleanResponse = NextResponse.redirect(redirectUrl)

                    // Wipe standard token identifiers
                    cleanResponse.cookies.delete('sb-access-token')
                    cleanResponse.cookies.delete('sb-refresh-token')

                    // Dynamically calculate and clear the project-specific SSR cookie keys
                    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
                    const projectRef = supabaseUrl.split('//')[1]?.split('.')[0]
                    if (projectRef) {
                        cleanResponse.cookies.delete(`sb-${projectRef}-auth-token`)
                        cleanResponse.cookies.delete(`sb-${projectRef}-auth-token.0`)
                        cleanResponse.cookies.delete(`sb-${projectRef}-auth-token.1`)
                    }
                    return cleanResponse
                }

                // If on /login or public route, allow request to complete without authentication data context
                return response
            }
        }
        user = data?.user ?? null
    } catch (catchErr) {
        console.error('[MIDDLEWARE EXCEPTION] Unexpected crash during user initialization:', catchErr)
        if (!isPublicRoute) {
            const redirectUrl = new URL('/login', request.url)
            return NextResponse.redirect(redirectUrl)
        }
        return response
    }

    // Protection gate: Guest trying to sneak into private dashboard areas
    if (!user && !isPublicRoute) {
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(redirectUrl)
    }

    // Authenticated user landing on onboarding pages -> skip forward to dashboards
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

    // Role Enforcement Boundaries Guard
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