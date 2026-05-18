import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/resend'
import { generateSystemOTP } from '@/lib/utils/formatters'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { to, type, data } = body

        if (!to || !type) {
            return NextResponse.json(
                { error: 'Missing required fields: to, type' },
                { status: 400 }
            )
        }

        let subject = ''
        let html = ''
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://myprestigeservices.com'

        switch (type) {
            case 'otp': {
                const otp = data?.otp || generateSystemOTP()
                subject = 'Your ChillToRent Verification Code'
                html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #0061ef; margin-bottom: 4px;">ChillToRent</h2>
            <p style="color: #475569; font-size: 16px;">Your secure verification identity code is:</p>
            <h1 style="font-size: 36px; letter-spacing: 6px; color: #0f172a; margin: 24px 0; font-family: monospace;">${otp}</h1>
            <p style="color: #64748b; font-size: 14px;">This code expires in 10 minutes. Do not share this registration sequence with anyone.</p>
          </div>
        `
                break
            }
            case 'viewing_request': {
                const { propertyTitle, tenantName } = data || {}
                subject = `New viewing request for ${propertyTitle || 'your property'}`
                html = `
          <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #0f172a;">📅 Viewing Request Received</h2>
            <p style="color: #334155; font-size: 16px;"><strong>${tenantName || 'A prospective tenant'}</strong> has submitted an inspection request for your property: <strong>${propertyTitle || 'Listing Asset'}</strong>.</p>
            <p style="color: #64748b; margin-bottom: 24px;">Log into your landlord hub portal to approve, reschedule, or open a chat dialogue instance.</p>
            <a href="${baseUrl}/landlord/chat" style="background: #0061ef; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Manage Request</a>
          </div>
        `
                break
            }
            case 'agreement_ready': {
                const { propertyTitle } = data || {}
                subject = `Your lease agreement document is ready`
                html = `
          <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #0f172a;">📄 Lease Agreement Generated</h2>
            <p style="color: #334155; font-size: 16px;">The legal structural lease agreement documentation for <strong>${propertyTitle || 'your rented asset'}</strong> has been generated successfully.</p>
            <p style="color: #64748b; margin-bottom: 24px;">Please access your dashboard overview screen to sign, finalize execution protocols, and print details.</p>
            <a href="${baseUrl}/tenant/agreements" style="background: #0061ef; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Review Agreement</a>
          </div>
        `
                break
            }
            case 'chat_nudge': {
                const { senderName, propertyTitle, recipientRole } = data || {}
                subject = `Unread conversation update waiting`

                const targetDashboard = recipientRole === 'landlord' ? 'landlord' : 'tenant'

                html = `
          <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #0f172a;">💬 New Message Response</h2>
            <p style="color: #334155; font-size: 16px;">You have unread negotiation threads waiting from <strong>${senderName || 'Account User'}</strong> regarding <strong>${propertyTitle || 'listed venue'}</strong>.</p>
            <a href="${baseUrl}/${targetDashboard}/chat" style="background: #0061ef; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; margin-top: 16px;">Open Chat Window</a>
          </div>
        `
                break
            }
            default:
                return NextResponse.json({ error: 'Invalid email dispatch type token mapping' }, { status: 400 })
        }

        const result = await sendEmail({
            to,
            subject,
            html,
        })

        if (!result.success) {
            console.error('Email send infrastructure error:', result.error)
            return NextResponse.json({ error: 'Failed to complete message delivery' }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'Transactional transmission finished' })
    } catch (err) {
        console.error('Email API router fatal throw:', err)
        return NextResponse.json({ error: 'Internal server boundary crash' }, { status: 500 })
    }
}