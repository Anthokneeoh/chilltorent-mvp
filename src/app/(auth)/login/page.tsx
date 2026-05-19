'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, ArrowRight, CheckCircle, AlertCircle, Edit2, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Navbar } from '@/components/layout/Navbar'

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectTo = searchParams.get('redirectTo') || '/'

    const { user, profile, isLoading: authLoading } = useAuth()

    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [otpSent, setOtpSent] = useState(false)
    const [otp, setOtp] = useState('')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (authLoading) return

        if (user && profile) {
            if (redirectTo && redirectTo !== '/') {
                router.push(redirectTo)
            } else {
                if (profile.role === 'admin') {
                    router.push('/admin')
                } else if (profile.role === 'landlord') {
                    router.push('/landlord')
                } else {
                    router.push('/')
                }
            }
        }
    }, [user, profile, authLoading, router, redirectTo])

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

            // The global useEffect configuration above handles immediate route routing 
            // on token verification. Fallback parameter redirect provided here:
            if (redirectTo && redirectTo !== '/') {
                router.push(redirectTo)
            }
        } catch (err: any) {
            setError(err.message || 'The authorization code provided is incorrect or expired.')
        } finally {
            setIsLoading(false)
        }
    }

    if (user && profile) {
        return (
            <div className="bg-pure-white rounded-2xl border border-pale-ash/40 shadow-subtle p-8 flex flex-col items-center justify-center min-h-[320px] gap-3">
                <Loader2 className="h-6 w-6 text-sky-connect animate-spin" />
                <p className="text-xs font-bold text-stone-slate uppercase tracking-widest">Synchronizing Workspace...</p>
            </div>
        )
    }

    return (
        <div className="bg-pure-white rounded-xl border border-pale-ash/50 shadow-subtle p-8">
            <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-charcoal-tone tracking-tight">Welcome Back</h1>
                <p className="text-xs font-medium text-stone-slate mt-1">Sign in to sync your platform actions</p>
            </div>

            {error && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-md flex items-start gap-2.5 animate-in fade-in duration-200">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-red-700 leading-relaxed">{error}</p>
                </div>
            )}

            {!otpSent ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-[11px] font-bold uppercase tracking-wider text-charcoal-tone mb-1.5">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-slate" />
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                required
                                className="w-full pl-9 pr-4 py-2 border border-pale-ash/60 rounded-md focus:outline-none focus:border-sky-connect focus:ring-2 focus:ring-sky-connect/10 bg-pure-white text-sm text-charcoal-tone font-medium shadow-xs transition-all"
                            />
                        </div>
                        <p className="text-[10px] text-stone-slate mt-1.5 font-medium">
                            We'll issue a 6-digit verification code directly to this inbox.
                        </p>
                    </div>

                    <Button type="submit" fullWidth disabled={isLoading} className="rounded-md py-2.5 font-semibold text-sm">
                        {isLoading ? 'Dispatching Code...' : 'Continue with Email'}
                        {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                </form>
            ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label htmlFor="otp" className="block text-[11px] font-bold uppercase tracking-wider text-charcoal-tone">
                                Verification Pin Code
                            </label>
                            <button
                                type="button"
                                onClick={() => setOtpSent(false)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-connect hover:text-sky-connect/80 transition-colors"
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
                            className="w-full px-4 py-2 text-center text-xl font-bold tracking-[0.5em] border border-pale-ash/60 rounded-md focus:outline-none focus:border-sky-connect focus:ring-2 focus:ring-sky-connect/10 bg-pure-white text-charcoal-tone shadow-xs transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-stone-slate/40"
                            maxLength={6}
                            autoFocus
                        />

                        <div className="mt-2.5 flex items-center justify-between text-xs font-semibold">
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

                    <Button type="submit" fullWidth disabled={isLoading} className="rounded-md py-2.5 font-semibold text-sm">
                        {isLoading ? 'Committing Session...' : 'Verify & Launch Dashboard'}
                        {!isLoading && <CheckCircle className="ml-2 h-4 w-4" />}
                    </Button>
                </form>
            )}

            <div className="mt-5 text-center text-xs font-semibold text-stone-slate">
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