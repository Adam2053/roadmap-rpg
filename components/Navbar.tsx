'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Zap, LayoutDashboard, Map, LogOut, User, Trophy } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    logout()
    router.push('/login')
    toast.success('Logged out successfully')
  }

  const navLinks = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      isActive: pathname === '/dashboard',
    },
    {
      href: '/roadmap',
      label: 'New Roadmap',
      icon: Map,
      isActive: pathname === '/roadmap' || pathname.startsWith('/roadmap/'),
    },
    {
      href: '/leaderboard',
      label: 'Leaderboard',
      icon: Trophy,
      isActive: pathname === '/leaderboard',
      isSpecial: true,
    },
  ]

  return (
    <nav className="fixed top-0 w-full z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <Zap className="h-6 w-6 text-purple-400 group-hover:text-purple-300 transition-colors" />
          <span className="font-bold text-lg gradient-text">Roadmap RPG</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {navLinks.map(({ href, label, icon: Icon, isActive, isSpecial }) => {
            if (isActive) {
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isSpecial
                      ? 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30'
                      : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                    }`}
                >
                  <Icon className={`h-4 w-4 ${isSpecial ? 'text-yellow-400' : 'text-purple-400'}`} />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              )
            }
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground transition-all ${isSpecial
                    ? 'hover:text-yellow-400 hover:bg-yellow-500/5'
                    : 'hover:text-foreground hover:bg-white/5'
                  }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            )
          })}

          {user && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-white/10">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <User className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-300">Lv.{user.level}</span>
                <span className="text-xs text-muted-foreground">{user.name.split(' ')[0]}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/5 transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
