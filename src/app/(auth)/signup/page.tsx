'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, User, Phone, ArrowRight, CheckCircle, AlertCircle, Home, Building, Edit2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Navbar } from '@/components/layout/Navbar'
import { cn } from '@/lib/utils/formatters'

export default function SignupPage() {
    const router = useRouter()

    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [role, setRole] = useState<'tenant' | 'landlord'>('tenant')
    const [isLoading, setIsLoading] = useState(false)
    const [otpSent, setOtpSent] = useState(false)
    const [otp, setOtp] = useState('')
    const [error, setError] = useState<string | null>(null)

    const handleSendOTP = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()

        const sanitizedEmail = email.trim()
        const sanitizedName = fullName.trim()
        const sanitizedPhone = phone.trim()

        if (!sanitizedEmail || !sanitizedName) return

        setIsLoading(true)
        setError(null)

        try {
            // 1. Core verification check: intercept duplicate email constraints early
            const { data: existingUser } = await supabase
                .from('profiles')
                .select('email')
                .eq('email', sanitizedEmail)
                .maybeSingle()

            if (existingUser) {
                setError('An account with this email address already exists. Please sign in instead.')
                setIsLoading(false)
                return
            }

            // 2. Custom constraint validation: verify duplicate phone records before running auth triggers
            if (sanitizedPhone) {
                const { data: existingPhone } = await supabase
                    .from('profiles')
                    .select('phone')
                    .eq('phone', sanitizedPhone)
                    .maybeSingle()

                if (existingPhone) {
                    setError('This phone number is already linked to another account. Please use a unique number.')
                    setIsLoading(false)
                    return
                }
            }

            // 3. Complete authentication registration payload dispatch
            const { error: authError } = await supabase.auth.signInWithOtp({
                email: sanitizedEmail,
                options: {
                    data: {
                        full_name: sanitizedName,
                        phone: sanitizedPhone || null,
                        role: role,
                    },
                    emailRedirectTo: `${window.location.origin}/api/auth/callback`,
                },
            })

            if (authError) throw authError
            setOtpSent(true)
        } catch (err: any) {
            setError(err.message || 'Failed to dispatch secure registration confirmation packet.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!otp.trim()) return

        setIsLoading(true)
        setError(null)

        try {
            const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
                email: email.trim(),
                token: otp.trim(),
                type: 'email',
            })

            if (verifyError) throw verifyError

            if (verifyData?.user) {
                const { data: fetchedProfile } = await (supabase.from('profiles') as any)
                    .select('*')
                    .eq('id', verifyData.user.id)
                    .single()

                const userRole = fetchedProfile?.role || role
                if (userRole === 'admin') router.push('/admin')
                else if (userRole === 'landlord') router.push('/landlord')
                else router.push('/tenant')
            } else {
                if (role === 'landlord') router.push('/landlord')
                else router.push('/tenant')
            }
        } catch (err: any) {
            setError(err.message || 'The token validation layer rejected this verification pin code.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-cloud-whisper flex items-center justify-center py-12 px-4">
                <div className="max-w-md w-full">
                    <div className="bg-pure-white rounded-xl border border-pale-ash/50 shadow-subtle p-8">
                        <div className="text-center mb-6">
                            <h1 className="text-xl font-bold text-charcoal-tone tracking-tight">Create Account</h1>
                            <p className="text-xs font-medium text-stone-slate mt-1">Join platform services to secure rental portfolios</p>
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
                                    <label htmlFor="fullName" className="block text-[11px] font-bold uppercase tracking-wider text-charcoal-tone mb-1.5">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-slate" />
                                        <input
                                            id="fullName"
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="John Doe"
                                            required
                                            className="w-full pl-9 pr-4 py-2 border border-pale-ash/60 rounded-md focus:outline-none focus:border-sky-connect focus:ring-2 focus:ring-sky-connect/10 bg-pure-white text-sm text-charcoal-tone font-medium shadow-xs transition-all"
                                        />
                                    </div>
                                </div>

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
                                </div>

                                <div>
                                    <label htmlFor="phone" className="block text-[11px] font-bold uppercase tracking-wider text-charcoal-tone mb-1.5">
                                        Phone Number (Optional)
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-slate" />
                                        <input
                                            id="phone"
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="08012345678"
                                            className="w-full pl-9 pr-4 py-2 border border-pale-ash/60 rounded-md focus:outline-none focus:border-sky-connect focus:ring-2 focus:ring-sky-connect/10 bg-pure-white text-sm text-charcoal-tone font-medium shadow-xs transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal-tone mb-2">
                                        Account Assignment Role
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setRole('tenant')}
                                            className={cn(
                                                'flex flex-col items-center gap-1.5 p-3 border rounded-md transition-all duration-200 text-left',
                                                role === 'tenant'
                                                    ? 'border-sky-connect bg-sky-connect/5 ring-1 ring-sky-connect'
                                                    : 'border-pale-ash/60 bg-pure-white hover:border-pale-ash'
                                            )}
                                        >
                                            <Home className={cn('h-4 w-4', role === 'tenant' ? 'text-sky-connect' : 'text-stone-slate')} />
                                            <span className={cn('text-xs font-semibold', role === 'tenant' ? 'text-sky-connect' : 'text-charcoal-tone')}>
                                                Tenant Profile
                                            </span>
                                            <p className="text-[10px] text-stone-slate font-medium text-center leading-tight">Looking to secure a space</p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setRole('landlord')}
                                            className={cn(
                                                'flex flex-col items-center gap-1.5 p-3 border rounded-md transition-all duration-200 text-left',
                                                role === 'landlord'
                                                    ? 'border-sky-connect bg-sky-connect/5 ring-1 ring-sky-connect'
                                                    : 'border-pale-ash/60 bg-pure-white hover:border-pale-ash'
                                            )}
                                        >
                                            <Building className={cn('h-4 w-4', role === 'landlord' ? 'text-sky-connect' : 'text-stone-slate')} />
                                            <span className={cn('text-xs font-semibold', role === 'landlord' ? 'text-sky-connect' : 'text-charcoal-tone')}>
                                                Landlord Profile
                                            </span>
                                            <p className="text-[10px] text-stone-slate font-medium text-center leading-tight">Managing real estate assets</p>
                                        </button>
                                    </div>
                                </div>

                                <Button type="submit" fullWidth disabled={isLoading} className="rounded-md py-2.5 font-semibold text-sm !mt-5">
                                    {isLoading ? 'Processing Registration...' : 'Create Account Portfolio'}
                                    {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOTP} className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label htmlFor="otp" className="block text-[11px] font-bold uppercase tracking-wider text-charcoal-tone">
                                            Activation Code Token
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setOtpSent(false)}
                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-connect hover:text-sky-connect/80 transition-colors"
                                        >
                                            <Edit2 className="h-3 w-3" />
                                            Edit details
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
                                            Resend authorization pin
                                        </button>
                                        <span className="text-stone-slate truncate max-w-[200px]">Checking inbox: {email}</span>
                                    </div>
                                </div>

                                <Button type="submit" fullWidth disabled={isLoading} className="rounded-md py-2.5 font-semibold text-sm">
                                    {isLoading ? 'Authenticating...' : 'Verify & Launch Dashboard'}
                                    {!isLoading && <CheckCircle className="ml-2 h-4 w-4" />}
                                </Button>
                            </form>
                        )}

                        <div className="mt-5 text-center text-xs font-semibold text-stone-slate">
                            Already have an asset login profile?{' '}
                            <Link href="/login" className="text-sky-connect hover:underline font-bold">
                                Sign in here
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
