'use client'
import { FileText } from 'lucide-react'
export default function TenantAgreementsPage() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-4">
            <FileText className="h-14 w-14 mx-auto text-sky-connect opacity-40" />
            <h1 className="text-xl font-black text-charcoal-tone">Lease Covenants Registry</h1>
            <p className="text-xs font-medium text-stone-slate max-w-sm mx-auto">Your verified tenancy lease legal agreements will compile here.</p>
        </div>
    )
}
