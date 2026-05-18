'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import PostHogPageView from '@/components/PostHogPageView'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const token = process.env.NEXT_PUBLIC_POSTHOG_KEY
        const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

        if (token && host) {
            posthog.init(token, {
                api_host: host,
                capture_pageview: false,
            })
        }
    }, [])

    return (
        <PHProvider client={posthog}>
            {children}
            <PostHogPageView /> {/* This fires pageviews on route changes */}
        </PHProvider>
    )
}