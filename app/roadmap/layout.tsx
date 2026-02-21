import Navbar from '@/components/Navbar'
import AuthProvider from '@/components/AuthProvider'

export default function RoadmapLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16">{children}</main>
      </div>
    </AuthProvider>
  )
}
