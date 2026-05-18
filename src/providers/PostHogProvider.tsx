'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

if (typeof window !== 'undefined') {
    const token = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

    if (token && host) {
        posthog.init(token, {
            api_host: host,
            person_profiles: 'identified_only',
            capture_pageview: false,
        })
    }
}

function PostHogPageViewTracker() {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        if (pathname && posthog) {
            let url = window.origin + pathname
            if (searchParams && searchParams.toString()) {
                url = url + `?${searchParams.toString()}`
            }
            posthog.capture('$pageview', { $current_url: url })
        }
    }, [pathname, searchParams])

    return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    return (
        <PHProvider client={posthog}>
            {/* The Suspense boundary that makes Vercel happy */}
            <Suspense fallback={null}>
                <PostHogPageViewTracker />
            </Suspense>
            {children}
        </PHProvider>
    )
}