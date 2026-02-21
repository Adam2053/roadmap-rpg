import Navbar from '@/components/Navbar'
import AuthProvider from '@/components/AuthProvider'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-14 md:pt-16 pb-20 md:pb-0">{children}</main>
      </div>
    </AuthProvider>
  )
}
