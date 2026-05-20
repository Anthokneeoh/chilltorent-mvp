export const dynamic = 'force-dynamic'

import LandlordAuthGuard from './LandlordAuthGuard'

export default function LandlordLayout({ children }: { children: React.ReactNode }) {
  return (
    <LandlordAuthGuard>
      {children}
    </LandlordAuthGuard>
  )
}