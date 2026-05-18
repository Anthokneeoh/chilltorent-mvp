import Link from 'next/link'
import { Home, Key, ShieldCheck, FileText } from 'lucide-react'
import { HomeSearchBar } from '@/components/marketplace/HomeSearchBar'
import { PropertyFeed } from '@/components/marketplace/PropertyFeed'

export default function PublicHomepage() {
  return (
    <div className="min-h-screen bg-cloud-whisper text-inkwell-gray">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-pure-white/80 backdrop-blur-md border-b border-pale-ash/40 px-4 sm:px-6 lg:px-8 shadow-subtle">
        <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
          {/* FIX: Logo explicitly routes to clean root URL */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="p-2 bg-sky-connect rounded-xl text-pure-white shadow-subtle">
              <Home className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-charcoal-tone to-sky-connect bg-clip-text text-transparent">
              ChillToRent
            </span>
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href="/login" className="text-inkwell-gray hover:text-charcoal-tone transition-colors">
              Sign In
            </Link>
            <Link href="/signup">
              <button className="btn-primary text-sm py-2 px-4 rounded-3xl">Get Started</button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="bg-gradient-to-b from-pure-white to-cloud-whisper/20 border-b border-pale-ash/20 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="inline-flex items-center gap-1.5 bg-sky-connect/5 text-sky-connect border border-sky-connect/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            🇳🇬 Transparent Property Packages
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-charcoal-tone leading-tight">
            Find verified listings with <span className="text-sky-connect">clear</span> move-in packages.
          </h1>
          <p className="text-base text-inkwell-gray max-w-xl mx-auto">
            Browse premium rental properties across Lagos. Coordinate inspections with verified lessors, lock in security deposits, and sign tenancy agreements cleanly.
          </p>

          <div className="mt-8">
            <HomeSearchBar />
          </div>
        </div>
      </header>

      {/* Database Driven Property Feed */}
      <PropertyFeed />

      {/* Feature Pillars */}
      <section className="bg-pure-white border-t border-pale-ash/40 py-12 mt-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-3 flex flex-col items-center">
            <div className="p-3 bg-sky-connect/5 border border-sky-connect/10 text-sky-connect rounded-2xl shadow-subtle">
              <Key className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-charcoal-tone">Direct Chat Channels</h3>
            <p className="text-sm text-stone-slate max-w-xs">Chat loops open automatically the moment an inspection is approved by the lessor profile.</p>
          </div>
          <div className="space-y-3 flex flex-col items-center">
            <div className="p-3 bg-green-50 text-green-600 border border-green-100 rounded-2xl shadow-subtle">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-charcoal-tone">KYC Identity Guards</h3>
            <p className="text-sm text-stone-slate max-w-xs">All ownership certificates and landlord profiles undergo rigorous admin verification queues.</p>
          </div>
          <div className="space-y-3 flex flex-col items-center">
            <div className="p-3 bg-purple-50 text-purple-600 border border-purple-100 rounded-2xl shadow-subtle">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-charcoal-tone">Tenancy Deed Assemblies</h3>
            <p className="text-sm text-stone-slate max-w-xs">Digital legal parameters populate structured lease arrangements automatically upon escrow completion.</p>
          </div>
        </div>
      </section>

      <footer className="bg-cloud-whisper border-t border-pale-ash/20 py-6 text-center text-xs font-medium text-stone-slate">
        © 2026 ChillToRent Ecosystem. Running securely on Anthonio's Servers.
      </footer>
    </div>
  )
}