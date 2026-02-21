import Navbar from '@/components/Navbar'
import AuthProvider from '@/components/AuthProvider'

export const metadata = {
    title: 'Leaderboard — Roadmap RPG',
    description: 'See the top adventurers ranked by XP earned. Climb the ranks by completing roadmap tasks.',
}

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="pt-16">{children}</main>
            </div>
        </AuthProvider>
    )
}
