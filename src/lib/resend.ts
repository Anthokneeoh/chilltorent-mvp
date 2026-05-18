import { Resend } from 'resend'
export const resend = new Resend(process.env.RESEND_API_KEY!)
export const FROM_EMAIL = 'noreply@myprestigeservices.com'

export const EMAIL_TEMPLATES = {
    OTP: process.env.RESEND_TEMPLATE_OTP,
    VIEWING_REQUEST: process.env.RESEND_TEMPLATE_VIEWING,
    AGREEMENT_READY: process.env.RESEND_TEMPLATE_AGREEMENT,
    CHAT_NUDGE: process.env.RESEND_TEMPLATE_CHAT_NUDGE,
} as const

export async function sendEmail({
    to,
    subject,
    html,
    from = FROM_EMAIL,
}: {
    to: string
    subject: string
    html: string
    from?: string
}) {
    try {
        const { data, error } = await resend.emails.send({
            from,
            to,
            subject,
            html,
        })
        if (error) {
            console.error('Resend error:', error)
            return { success: false, error }
        }
        return { success: true, data }
    } catch (error) {
        console.error('Failed to send email:', error)
        return { success: false, error }
    }
}