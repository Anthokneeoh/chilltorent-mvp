import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'

export default function MyListingsPage() {
    return (
        <>
            <Navbar />
            <div className="flex min-h-screen bg-cloud-whisper text-charcoal-tone">
                <Sidebar />
                <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {/* Main Title Header Section */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black tracking-tight">Landlord Properties</h1>
                                <p className="text-sm font-medium text-inkwell-gray mt-1">Manage your property listings</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    )
}