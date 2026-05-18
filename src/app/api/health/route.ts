import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    const startTime = Date.now()
    let databaseStatus: 'connected' | 'disconnected' = 'disconnected'

    try {
        const supabase = await createServerSupabaseClient()

        const { error } = await (supabase
            .from('profiles') as any)
            .select('id', { count: 'exact', head: true })
        if (!error) {
            databaseStatus = 'connected'
        }
    } catch (err) {
        console.error('Health check database connection exception:', err)
    }

    const isHealthy = databaseStatus === 'connected'
    const responseTime = Date.now() - startTime

    return NextResponse.json(
        {
            status: isHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            database: databaseStatus,
            environment: process.env.NODE_ENV || 'development',
            version: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
            responseTimeMs: responseTime,
        },
        {
            status: isHealthy ? 200 : 503,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        }
    )
}