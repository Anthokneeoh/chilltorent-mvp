'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Home, Search, MessageCircle, FileText, User, LogOut, PlusSquare, Building } from 'lucide-react'
import { cn } from '@/lib/utils/formatters'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'

export function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const pathname = usePathname()
    const { user, profile, signOut, isLoading } = useAuth()

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        setIsMobileMenuOpen(false)
    }, [pathname])

    const isActive = (path: string) => {
        if (path === '/' || path === '/landlord' || path === '/tenant' || path === '/admin') {
            return pathname === path
        }
        return pathname === path || pathname.startsWith(path + '/')
    }

    const getNavItems = () => {
        if (!user || !profile) return []

        const role = profile.role
        const baseItems = []

        if (role === 'tenant') {
            baseItems.push(
                { name: 'Home', href: '/', icon: Home },
                { name: 'Search', href: '/properties', icon: Search },
                { name: 'Chat', href: '/tenant/chat', icon: MessageCircle },
                { name: 'Agreements', href: '/tenant/agreements', icon: FileText }
            )
        } else if (role === 'landlord') {
            baseItems.push(
                { name: 'Dashboard', href: '/landlord', icon: Home },
                { name: 'My Listings', href: '/landlord', icon: Building },
                { name: 'Add Property', href: '/landlord/properties/new', icon: PlusSquare },
                { name: 'Chat', href: '/landlord/chat', icon: MessageCircle }
            )
        } else if (role === 'admin') {
            baseItems.push(
                { name: 'Admin Hub', href: '/admin', icon: Home },
                { name: 'KYC Queue', href: '/admin/kyc-queue', icon: User },
                { name: 'Listings Queue', href: '/admin/listings-queue', icon: FileText }
            )
        }
        return baseItems
    }

    const navItems = getNavItems()

    return (
        <header
            className="sticky top-0 z-50 w-full bg-pure-white/85 backdrop-blur-md border-b border-pale-ash/50 transition-all duration-200"
        >
            <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo Branding */}
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="text-xl font-bold text-sky-connect tracking-tight">ChillToRent</span>
                    </Link>

                    {/* Desktop Control Panel Layout */}
                    <div className="hidden md:flex md:items-center md:space-x-6">
                        {isLoading ? (
                            // Silent shell block to prevent layout jumping while parsing credentials
                            <div className="h-8 w-32 animate-pulse rounded-lg bg-pale-ash/50" />
                        ) : user && profile ? (
                            <>
                                {navItems.map((item) => {
                                    const Icon = item.icon
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={cn(
                                                'flex items-center space-x-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200',
                                                isActive(item.href)
                                                    ? 'bg-cloud-whisper text-charcoal-tone border border-pale-ash/60'
                                                    : 'text-inkwell-gray hover:bg-cloud-whisper hover:text-charcoal-tone'
                                            )}
                                        >
                                            <Icon className="h-3.5 w-3.5" />
                                            <span>{item.name}</span>
                                        </Link>
                                    )
                                })}

                                <div className="h-4 w-[1px] bg-pale-ash" />

                                <div className="flex items-center space-x-3">
                                    <span className="text-sm font-medium text-charcoal-tone">
                                        {profile.full_name?.split(' ')[0] || 'User'}
                                    </span>
                                    <button
                                        onClick={() => signOut()}
                                        className="rounded-lg p-2 text-inkwell-gray hover:bg-red-50 hover:text-red-600 transition-colors"
                                        aria-label="Sign Out Session"
                                    >
                                        <LogOut className="h-4 w-4" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <Link href="/login">
                                    <Button variant="ghost" size="sm">Login</Button>
                                </Link>
                                <Link href="/signup">
                                    <Button variant="primary" size="sm">Sign Up</Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Hamburg Trigger Toggle */}
                    <div className="flex md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="rounded-lg p-2 text-inkwell-gray hover:bg-pale-ash transition-colors"
                            aria-expanded={isMobileMenuOpen}
                        >
                            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Drawer Dropdown */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-pale-ash/50 bg-pure-white animate-in slide-in-from-top-2 duration-200">
                        <div className="space-y-1 pb-4 pt-2">
                            {isLoading ? (
                                <div className="space-y-2 p-4">
                                    <div className="h-4 w-full animate-pulse rounded bg-pale-ash" />
                                    <div className="h-4 w-3/4 animate-pulse rounded bg-pale-ash" />
                                </div>
                            ) : user && profile ? (
                                <>
                                    <div className="border-b border-pale-ash/60 px-4 py-3 bg-cloud-whisper/40 mb-2">
                                        <p className="text-sm font-semibold text-charcoal-tone">{profile.full_name}</p>
                                        <p className="text-xs text-inkwell-gray truncate">{user.email}</p>
                                        <span className="mt-1.5 inline-flex items-center rounded-full bg-sky-connect/10 px-2 py-0.5 text-xs font-medium capitalize text-sky-connect">
                                            {profile.role}
                                        </span>
                                    </div>

                                    {navItems.map((item) => {
                                        const Icon = item.icon
                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                className={cn(
                                                    'flex items-center space-x-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors',
                                                    isActive(item.href)
                                                        ? 'bg-cloud-whisper text-charcoal-tone font-semibold border border-pale-ash/60'
                                                        : 'text-inkwell-gray hover:bg-cloud-whisper'
                                                )}
                                            >
                                                <Icon className="h-5 w-5" />
                                                <span>{item.name}</span>
                                            </Link>
                                        )
                                    })}

                                    <button
                                        onClick={() => signOut()}
                                        className="flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50/50 transition-colors"
                                    >
                                        <LogOut className="h-5 w-5" />
                                        <span>Sign Out</span>
                                    </button>
                                </>
                            ) : (
                                <div className="space-y-2 px-4 py-3">
                                    <Link href="/login" className="block w-full">
                                        <Button variant="ghost" fullWidth>Login</Button>
                                    </Link>
                                    <Link href="/signup" className="block w-full">
                                        <Button variant="primary" fullWidth>Sign Up</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </nav>
        </header>
    )
}