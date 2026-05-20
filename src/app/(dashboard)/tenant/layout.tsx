export const dynamic = 'force-dynamic'

import TenantAuthGuard from './TenantAuthGuard'

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return <TenantAuthGuard>{children}</TenantAuthGuard>
}
