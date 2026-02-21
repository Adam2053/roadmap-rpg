import Navbar from '@/components/Navbar'
import AuthProvider from '@/components/AuthProvider'

export const metadata = {
    title: 'Profile — Roadmap RPG',
    description: 'View a player profile on Roadmap RPG.',
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="pt-14 md:pt-16 pb-20 md:pb-0">{children}</main>
            </div>
        </AuthProvider>
    )
}
