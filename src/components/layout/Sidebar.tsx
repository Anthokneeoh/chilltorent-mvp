'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    Home,
    Search,
    MessageCircle,
    FileText,
    PlusSquare,
    Users,
    CheckSquare,
    LogOut,
    User,
    Settings,
    Building,
    Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils/formatters'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'

interface NavItem {
    name: string
    href: string
    icon: React.ElementType
}

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { user, profile } = useAuth()
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const checkActiveState = (href: string) => {
        if (pathname === href) return true

        if (href === '/landlord' || href === '/tenant' || href === '/admin') {
            return false
        }

        // Prevent duplicate highlights: check if another nav item has a more specific prefix match
        const items = getNavItems()
        const hasMoreSpecificMatch = items.some(
            (item) => item.href !== href && item.href.startsWith(href + '/') && (pathname === item.href || pathname.startsWith(item.href + '/'))
        )
        if (hasMoreSpecificMatch) {
            return false
        }

        return pathname.startsWith(href + '/')
    }

    const getNavItems = (): NavItem[] => {
        if (!profile) return []

        switch (profile.role) {
            case 'tenant':
                return [
                    { name: 'Dashboard', href: '/tenant', icon: Home },
                    { name: 'Find Homes', href: '/properties', icon: Search },
                    { name: 'Messages', href: '/tenant/chat', icon: MessageCircle },
                    { name: 'Agreements', href: '/tenant/agreements', icon: FileText },
                ]
            case 'landlord':
                return [
                    { name: 'Dashboard', href: '/landlord', icon: Home },
                    { name: 'My Listings', href: '/landlord/properties', icon: Building },
                    { name: 'Add Property', href: '/landlord/properties/new', icon: PlusSquare },
                    { name: 'Messages', href: '/landlord/chat', icon: MessageCircle },
                ]
            case 'admin':
                return [
                    { name: 'Overview', href: '/admin', icon: Home },
                    { name: 'KYC Queue', href: '/admin/kyc-queue', icon: User },
                    { name: 'Listing Approvals', href: '/admin/listings-queue', icon: CheckSquare },
                    { name: 'All Users', href: '/admin/users', icon: Users },
                    { name: 'Settings', href: '/admin/settings', icon: Settings },
                ]
            default:
                return []
        }
    }

    const handleSignOut = async () => {
        if (isLoggingOut) return
        setIsLoggingOut(true)
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error
            router.refresh()
            router.push('/login')
        } catch (err) {
            console.error('Sign out execution tracking exception instance:', err)
            alert('Failed to cleanly terminate auth tokens. Please refresh and retry.')
        } finally {
            setIsLoggingOut(false)
        }
    }

    const navItems = getNavItems()

    if (!user || !profile) return null

    return (
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:top-16 md:bottom-0 md:left-0 bg-cloud-whisper border-r border-pale-ash/50">
            <div className="flex flex-col flex-1 overflow-y-auto pt-5 pb-4">
                <nav className="mt-2 flex-1 px-3 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const currentActive = checkActiveState(item.href)
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 border',
                                    currentActive
                                        ? 'bg-pure-white text-charcoal-tone font-semibold border-pale-ash/60 shadow-xs'
                                        : 'text-inkwell-gray hover:bg-pure-white/50 hover:text-charcoal-tone border-transparent'
                                )}
                            >
                                <Icon
                                    className={cn(
                                        'mr-3 h-4 w-4 shrink-0 transition-colors',
                                        currentActive ? 'text-sky-connect' : 'text-stone-slate group-hover:text-inkwell-gray'
                                    )}
                                />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                {/* Footprint Account Status & Sign Out Anchor */}
                <div className="px-3 pt-4 pb-2 border-t border-pale-ash/60 mt-auto bg-cloud-whisper/20">
                    <div className="flex items-center px-2 py-2 mb-2">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-charcoal-tone truncate">
                                {profile.full_name}
                            </p>
                            <p className="text-xs font-medium text-sky-connect capitalize tracking-wider mt-0.5">{profile.role}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        fullWidth
                        onClick={handleSignOut}
                        disabled={isLoggingOut}
                        className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50/60 font-medium transition-colors disabled:opacity-50"
                    >
                        {isLoggingOut ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <LogOut className="mr-2 h-4 w-4" />
                        )}
                        <span>{isLoggingOut ? 'Terminating Context...' : 'Sign Out'}</span>
                    </Button>
                </div>
            </div>
        </aside>
    )
}
