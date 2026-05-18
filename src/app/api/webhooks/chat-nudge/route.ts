import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { resend, FROM_EMAIL } from '@/lib/resend'
import type { Database } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized credential token mismatched.' }, { status: 401 })
    }

    try {
        const supabase = await createServerSupabaseClient()
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

        const { data: unreadMessages, error: fetchError } = await (supabase
            .from('messages') as any)
            .select(`
        id,
        body,
        created_at,
        is_read,
        viewing_request_id,
        sender_id,
        sender:profiles!sender_id (full_name),
        viewing_requests!inner (
          tenant_id,
          landlord_id,
          property:property_id (title)
        )
      `)
            .eq('is_read', false)
            .lt('created_at', thirtyMinutesAgo)

        if (fetchError) {
            console.error('Failed to capture unread dataset rows:', fetchError)
            return NextResponse.json({ error: 'Database state extraction error.' }, { status: 500 })
        }

        if (!unreadMessages || unreadMessages.length === 0) {
            return NextResponse.json({ success: true, nudgesSent: 0 })
        }

        const targetRecipientIds = new Set<string>()
        const messageTargets = unreadMessages.map((msg: any) => {
            const viewingReq = msg.viewing_requests
            const isTenantSender = msg.sender_id === viewingReq.tenant_id
            const recipientId = isTenantSender ? viewingReq.landlord_id : viewingReq.tenant_id
            targetRecipientIds.add(recipientId)

            return {
                msgId: msg.id,
                body: msg.body,
                viewingRequestId: msg.viewing_request_id,
                senderName: msg.sender?.full_name || 'A user',
                propertyTitle: viewingReq.property?.title || 'Rental Listing Space',
                recipientId
            }
        })

        const { data: profiles, error: profilesError } = await (supabase
            .from('profiles') as any)
            .select('id, email, full_name')
            .in('id', Array.from(targetRecipientIds))

        if (profilesError || !profiles) {
            console.error('Failed to batch pull recipient profiles:', profilesError)
            return NextResponse.json({ error: 'Recipient index allocation failure.' }, { status: 500 })
        }

        const profileMap = new Map(profiles.map((p: any) => [p.id, p]))
        const nudgesSent: string[] = []
        const errors: string[] = []
        for (const target of messageTargets) {
            try {
                const recipientProfile = profileMap.get(target.recipientId) as { email: string; full_name: string } | undefined
                if (!recipientProfile) {
                    errors.push(`Recipient record unavailable for unique id index context: ${target.recipientId}`)
                    continue
                }

                const previewText = target.body.length > 100 ? `${target.body.substring(0, 100)}...` : target.body

                const { error: emailError } = await resend.emails.send({
                    from: FROM_EMAIL,
                    to: recipientProfile.email,
                    subject: `💬 Unread message update from ${target.senderName.split(' ')[0]}`,
                    html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
              <h2 style="color: #0061ef;">ChillToRent Updates</h2>
              <p>Hello ${recipientProfile.full_name},</p>
              <p>You have an unread conversation alert from <strong>${target.senderName}</strong> regarding your inquiry matching <strong>${target.propertyTitle}</strong>.</p>
              <div style="background: #f4f6f8; border-left: 4px solid #0061ef; padding: 12px; margin: 16px 0; font-style: italic; border-radius: 4px;">
                "${previewText}"
              </div>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/tenant/chat?request=${target.viewingRequestId}" style="background: #0061ef; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 8px; font-weight: bold; font-size: 14px;">Open Conversation Space</a>
              <p style="margin-top: 28px; font-size: 11px; color: #666; border-top: 1px solid #e1e4e6; padding-top: 12px;">This is an automated operational notification dispatched because an message envelope was left unread for longer than 30 minutes.</p>
            </div>
          `,
                })

                if (emailError) {
                    errors.push(`Notification delivery failure for message ${target.msgId}: ${emailError.message}`)
                } else {
                    nudgesSent.push(target.msgId)
                }
            } catch (err: any) {
                errors.push(`Processing stream rejection tracking exception for ${target.msgId}: ${err.message}`)
            }
        }

        return NextResponse.json({
            success: true,
            nudgesSent: nudgesSent.length,
            errors: errors.length > 0 ? errors : undefined,
        })
    } catch (globalError: any) {
        console.error('Fatal unhandled background processing failure inside notification webhook loop context:', globalError)
        return NextResponse.json({ error: globalError.message || 'Pipeline process crash execution exception.' }, { status: 500 })
    }
}