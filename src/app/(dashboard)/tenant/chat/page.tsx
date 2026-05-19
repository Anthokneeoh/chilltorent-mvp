'use client'

import { Suspense } from 'react'
import { Loader2, MessageCircle } from 'lucide-react'

export default function TenantChatPage() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-4">
            <MessageCircle className="h-14 w-14 mx-auto text-sky-connect opacity-40" />
            <h1 className="text-xl font-black text-charcoal-tone">Conversations Hub</h1>
            <p className="text-xs font-medium text-stone-slate max-w-sm mx-auto">Active communication channels with landlords populate automatically once inspection tours are booked.</p>
        </div>
    )
}
