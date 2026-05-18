'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, ArrowRight, CheckCircle, AlertCircle, Edit2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Navbar } from '@/components/layout/Navbar'

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectTo = searchParams.get('redirectTo') || '/'

    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [otpSent, setOtpSent] = useState(false)
    const [otp, setOtp] = useState('')
    const [error, setError] = useState<string | null>(null)

    const handleSendOTP = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!email) return

        setIsLoading(true)
        setError(null)

        try {
            const callbackUrl = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`

            const { error: authError } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    shouldCreateUser: false,
                    emailRedirectTo: callbackUrl,
                },
            })

            if (authError) throw authError
            setOtpSent(true)
        } catch (err: any) {
            if (err.message === 'Signups not allowed for otp') {
                setError('Account not found. Please sign up first.')
            } else {
                setError(err.message || 'Failed to dispatch secure access code verification packet.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!otp) return

        setIsLoading(true)
        setError(null)

        try {
            const { error: verifyError } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'email',
            })

            if (verifyError) throw verifyError
            router.push(redirectTo)
        } catch (err: any) {
            setError(err.message || 'The authorization code provided is incorrect or expired.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="bg-pure-white rounded-2xl border border-pale-ash/40 shadow-subtle p-8">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-black text-charcoal-tone tracking-tight">Welcome Back</h1>
                <p className="text-sm font-medium text-inkwell-gray mt-1.5">Sign in to sync your platform actions</p>
            </div>

            {error && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 animate-in fade-in duration-200">
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-red-700 leading-relaxed">{error}</p>
                </div>
            )}

            {!otpSent ? (
                <form onSubmit={handleSendOTP} className="space-y-5">
                    <div>
                        <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-charcoal-tone mb-2">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-slate" />
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                required
                                className="w-full pl-10 pr-4 py-3 border border-pale-ash/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-connect/40 bg-pure-white text-sm text-charcoal-tone font-medium shadow-sm transition-all"
                            />
                        </div>
                        <p className="text-[11px] text-inkwell-gray mt-2 font-medium">
                            We'll issue a 6-digit verification code directly to this inbox.
                        </p>
                    </div>

                    <Button type="submit" fullWidth disabled={isLoading} className="rounded-xl py-3 font-bold text-sm">
                        {isLoading ? 'Dispatching Code...' : 'Continue with Email'}
                        {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                </form>
            ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-5">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="otp" className="block text-xs font-bold uppercase tracking-wider text-charcoal-tone">
                                Verification Pin Code
                            </label>
                            <button
                                type="button"
                                onClick={() => setOtpSent(false)}
                                className="inline-flex items-center gap-1 text-xs font-bold text-sky-connect hover:text-sky-connect/80 transition-colors"
                            >
                                <Edit2 className="h-3 w-3" />
                                Change email
                            </button>
                        </div>

                        <input
                            id="otp"
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="000000"
                            required
                            className="w-full px-4 py-3 text-center text-2xl font-black tracking-[0.5em] border border-pale-ash/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-connect/40 bg-pure-white text-charcoal-tone shadow-sm transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-stone-slate/60"
                            maxLength={6}
                            autoFocus
                        />

                        <div className="mt-3 flex items-center justify-between text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => handleSendOTP()}
                                className="text-sky-connect hover:underline disabled:opacity-50"
                                disabled={isLoading}
                            >
                                Resend code
                            </button>
                            <span className="text-stone-slate">Dispatched to {email}</span>
                        </div>
                    </div>

                    <Button type="submit" fullWidth disabled={isLoading} className="rounded-xl py-3 font-bold text-sm">
                        {isLoading ? 'Authorizing Profile...' : 'Verify & Sign In'}
                        {!isLoading && <CheckCircle className="ml-2 h-4 w-4" />}
                    </Button>
                </form>
            )}

            <div className="mt-6 text-center text-xs font-semibold text-inkwell-gray">
                Don't have a platform account?{' '}
                <Link href="/signup" className="text-sky-connect hover:underline font-bold">
                    Sign up here
                </Link>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-cloud-whisper flex items-center justify-center py-12 px-4">
                <div className="max-w-md w-full">
                    <Suspense fallback={
                        <div className="bg-pure-white rounded-2xl border border-pale-ash/30 p-8 text-center animate-pulse space-y-4">
                            <div className="h-6 bg-pale-ash rounded w-1/3 mx-auto" />
                            <div className="h-12 bg-pale-ash rounded-xl w-full" />
                        </div>
                    }>
                        <LoginForm />
                    </Suspense>
                </div>
            </main>
        </>
    )
}