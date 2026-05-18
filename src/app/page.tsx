import Link from 'next/link'
import Image from 'next/image'
import { Home, MapPin, Key, ShieldCheck, FileText, ArrowRight } from 'lucide-react'
import { formatNaira } from '@/lib/utils/formatters'
import { HomeSearchBar } from '@/components/marketplace/HomeSearchBar'

const FEATURED_MOCK_PROPERTIES = [
  {
    id: 'prop-001',
    title: 'Luxury 3 Bedroom Apartment',
    lga: 'Ikoyi',
    state: 'Lagos',
    annual_rent: 8500000,
    bedrooms: 3,
    bathrooms: 3,
    property_type: 'APARTMENT',
    thumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500&auto=format&fit=crop&q=60',
    width: 500,
    height: 300,
  },
  {
    id: 'prop-002',
    title: 'Serviced 2 Bedroom Studio',
    lga: 'Lekki Phase 1',
    state: 'Lagos',
    annual_rent: 4500000,
    bedrooms: 2,
    bathrooms: 2,
    property_type: 'STUDIO',
    thumbnail: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&auto=format&fit=crop&q=60',
    width: 500,
    height: 300,
  },
  {
    id: 'prop-003',
    title: 'Modern 4 Bedroom Terrace',
    lga: 'Ikeja GRA',
    state: 'Lagos',
    annual_rent: 12000000,
    bedrooms: 4,
    bathrooms: 4,
    property_type: 'TERRACE',
    thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&auto=format&fit=crop&q=60',
    width: 500,
    height: 300,
  },
]

export default function PublicHomepage() {
  return (
    <div className="min-h-screen bg-cloud-whisper text-inkwell-gray">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-pure-white/80 backdrop-blur-md border-b border-pale-ash/40 px-4 sm:px-6 lg:px-8 shadow-subtle">
        <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-connect rounded-xl text-pure-white shadow-subtle">
              <Home className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-charcoal-tone to-sky-connect bg-clip-text text-transparent">
              ChillToRent
            </span>
          </div>
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

          {/* Interactive Client Search Bar */}
          <div className="mt-8">
            <HomeSearchBar />
          </div>
        </div>
      </header>

      {/* Featured Properties */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-pale-ash/40 pb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-charcoal-tone">Featured Marketplace Properties</h2>
            <p className="text-sm text-inkwell-gray mt-0.5">Verified structures offering certified infrastructure packages</p>
          </div>
          <span className="text-sm font-medium text-sky-connect hover:underline cursor-pointer flex items-center gap-1">
            See all catalog items ({FEATURED_MOCK_PROPERTIES.length}) <ArrowRight className="h-4 w-4" />
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURED_MOCK_PROPERTIES.map((property) => (
            <div key={property.id} className="card overflow-hidden p-0 hover:shadow-md transition-all">
              <div className="relative h-48 bg-cloud-whisper overflow-hidden">
                <Image
                  src={property.thumbnail}
                  alt={property.title}
                  width={property.width}
                  height={property.height}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  unoptimized // External Unsplash – for demo
                />
                <span className="absolute top-3 left-3 bg-pure-white/90 backdrop-blur-xs text-charcoal-tone font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-md shadow-xs border border-pale-ash/20">
                  {property.property_type.toLowerCase()}
                </span>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-charcoal-tone tracking-tight truncate">{property.title}</h3>
                  <div className="flex items-center text-sm text-stone-slate mt-1">
                    <MapPin className="h-3.5 w-3.5 mr-1 text-sky-connect shrink-0" />
                    {property.lga}, {property.state}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-medium text-stone-slate">
                  <span className="bg-cloud-whisper/80 border border-pale-ash/20 px-2.5 py-0.5 rounded-lg">{property.bedrooms} Bed Units</span>
                  <span className="bg-cloud-whisper/80 border border-pale-ash/20 px-2.5 py-0.5 rounded-lg">{property.bathrooms} Bath</span>
                  <span className="bg-sky-connect/5 text-sky-connect border border-sky-connect/10 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold ml-auto">Verified</span>
                </div>
                <div className="pt-4 border-t border-pale-ash/30 flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-sky-connect tracking-tight">{formatNaira(property.annual_rent)}</p>
                    <p className="text-[10px] font-medium text-stone-slate uppercase tracking-wider">Per Annum Rent</p>
                  </div>
                  {/* Updated UX Pivot: Allow public property viewing */}
                  <Link href={`/properties/${property.id}`}>
                    <button className="btn-ghost text-sm py-2 px-4 rounded-3xl">View details</button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

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