'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  Zap, LayoutDashboard, Map, LogOut, User,
  Trophy, Settings, Search, Loader2, X, Lock
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'

interface SearchResult {
  userId: string
  name: string
  level: number
  totalXP: number
  isProfilePublic: boolean
}

// ─── Mobile bottom tab ────────────────────────────────────────
function MobileTab({
  href, label, icon: Icon, isActive, isSpecial = false
}: {
  href: string; label: string; icon: React.ElementType
  isActive: boolean; isSpecial?: boolean
}) {
  const color = isActive
    ? isSpecial ? 'text-yellow-400' : 'text-purple-400'
    : 'text-white/30'
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-all active:scale-95"
    >
      <div className="relative flex items-center justify-center">
        <Icon className={`h-5 w-5 transition-colors duration-200 ${color}`} />
        {isActive && (
          <span
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
            style={{ background: isSpecial ? '#facc15' : '#a855f7' }}
          />
        )}
      </div>
      <span className={`text-[10px] font-medium mt-0.5 transition-colors duration-200 ${color}`}>
        {label}
      </span>
    </Link>
  )
}

// ─── Panel styles (solid opaque) ─────────────────────────────
const PANEL_STYLE: React.CSSProperties = {
  background: 'linear-gradient(145deg, #16162a 0%, #0e0e1e 100%)',
  border: '1px solid rgba(139,92,246,0.22)',
  boxShadow: '0 24px 64px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.03) inset',
  borderRadius: '16px',
  overflow: 'hidden',
}

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)

  // Single stable ref for the desktop search wrapper
  const desktopSearchRef = useRef<HTMLDivElement>(null)
  // Refs so the outside-click handler ignores taps inside the mobile panel
  const mobileSearchPanelRef = useRef<HTMLDivElement>(null)
  const mobileToggleRef = useRef<HTMLDivElement>(null)
  // Stable input ref — never recreated
  const desktopInputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    logout()
    router.push('/login')
    toast.success('Logged out successfully')
  }

  // Close search when clicking/tapping outside ALL search areas
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const inDesktop = desktopSearchRef.current?.contains(e.target as Node) ?? false
      const inMobilePanel = mobileSearchPanelRef.current?.contains(e.target as Node) ?? false
      const inMobileToggle = mobileToggleRef.current?.contains(e.target as Node) ?? false
      if (!inDesktop && !inMobilePanel && !inMobileToggle) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSearchOpen(false) }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`)
      if (res.ok) setResults((await res.json()).users)
    } catch { /* silent */ } finally {
      setSearching(false)
    }
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(q), 300)
  }

  const clearSearch = () => { setQuery(''); setResults([]) }

  const openSearch = () => {
    setSearchOpen(true)
    // Focus the right input after React paints
    requestAnimationFrame(() => {
      desktopInputRef.current?.focus()
      mobileInputRef.current?.focus()
    })
  }

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, isActive: pathname === '/dashboard' },
    { href: '/roadmap', label: 'Roadmap', icon: Map, isActive: pathname === '/roadmap' || (pathname.startsWith('/roadmap/') && !pathname.includes('/visibility')) },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy, isActive: pathname === '/leaderboard', isSpecial: true as const },
    { href: '/settings', label: 'Settings', icon: Settings, isActive: pathname === '/settings' },
  ]

  const closeSearch = () => { setSearchOpen(false); setQuery(''); setResults([]) }

  /* ── Search results (inlined — never a sub-component) ── */
  const renderResults = () => (
    <div style={{ maxHeight: 272, overflowY: 'auto' }}>
      {searching ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
        </div>
      ) : query.length >= 2 && results.length === 0 ? (
        <div className="py-8 text-center space-y-1">
          <p className="text-sm text-white/40">No users found</p>
          <p className="text-xs text-white/20">Try a different name or User ID</p>
        </div>
      ) : results.length > 0 ? (
        <div className="py-1">
          {results.map(r => (
            r.isProfilePublic ? (
              /* Public profile — use Link for reliable navigation */
              <Link
                key={r.userId}
                href={`/profile/${r.userId}`}
                onClick={closeSearch}
                className="flex items-center gap-3 px-4 py-3 hover:bg-purple-500/10 transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600/50 to-indigo-600/50 border border-purple-500/40 flex items-center justify-center text-sm font-black text-purple-200 flex-shrink-0">
                  {r.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/90 group-hover:text-white truncate">{r.name}</p>
                  <p className="text-xs text-white/35">Level {r.level} · {r.totalXP.toLocaleString()} XP</p>
                </div>
                <Zap className="h-3.5 w-3.5 text-yellow-500/50 group-hover:text-yellow-400 flex-shrink-0 transition-colors" />
              </Link>
            ) : (
              /* Private profile — show toast, no navigation */
              <button
                key={r.userId}
                onClick={() => toast.info(`🔒 ${r.name}'s profile is private`)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/4 transition-colors text-left group cursor-default"
              >
                <div className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center text-sm font-black text-white/30 flex-shrink-0">
                  {r.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/40 truncate">{r.name}</p>
                  <p className="text-xs text-white/25">Private profile</p>
                </div>
                <Lock className="h-3.5 w-3.5 text-white/20 flex-shrink-0" />
              </button>
            )
          ))}
        </div>
      ) : (
        <div className="py-7 px-5 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto">
            <Search className="h-5 w-5 text-purple-400/60" />
          </div>
          <p className="text-sm text-white/40 font-medium">Find adventurers</p>
          <p className="text-xs text-white/20 leading-relaxed">Search by name or paste a User ID from Settings</p>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* ════════════ DESKTOP TOP NAVBAR (md+) ════════════ */}
      <nav
        className="hidden md:block fixed top-0 w-full z-50 border-b"
        style={{
          background: 'rgba(10, 10, 20, 0.94)',
          backdropFilter: 'blur(20px)',
          borderColor: 'rgba(255,255,255,0.07)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">

          {/* Brand */}
          <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-black text-lg gradient-text tracking-tight">Roadmap RPG</span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon, isActive, isSpecial }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${isActive
                  ? isSpecial
                    ? 'bg-yellow-500/12 text-yellow-300 border-yellow-500/22'
                    : 'bg-purple-500/12 text-purple-300 border-purple-500/22'
                  : isSpecial
                    ? 'text-white/45 hover:text-yellow-300 hover:bg-yellow-500/8 border-transparent'
                    : 'text-white/45 hover:text-white/85 hover:bg-white/6 border-transparent'
                  }`}
              >
                <Icon className={`h-4 w-4 ${isActive && isSpecial ? 'text-yellow-400' : isActive ? 'text-purple-400' : ''}`} />
                {label}
              </Link>
            ))}
          </div>

          {/* Right: search + user + logout */}
          {user && (
            <div className="flex items-center gap-2 flex-shrink-0">

              {/* Desktop search — single stable wrapper ref */}
              <div className="relative" ref={desktopSearchRef}>
                <button
                  onClick={() => searchOpen ? setSearchOpen(false) : openSearch()}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${searchOpen
                    ? 'bg-purple-500/18 border-purple-500/35 text-purple-300'
                    : 'bg-white/5 border-white/8 text-white/50 hover:text-white/80 hover:bg-white/8 hover:border-white/15'
                    }`}
                >
                  <Search className="h-4 w-4" />
                  <span>Search</span>
                </button>

                {searchOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80" style={{ zIndex: 100 }}>
                    <div style={PANEL_STYLE}>
                      {/* Input row */}
                      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                        <Search className="h-4 w-4 text-purple-400 flex-shrink-0" />
                        <input
                          ref={desktopInputRef}
                          value={query}
                          onChange={handleInput}
                          placeholder="Name or User ID…"
                          autoComplete="off"
                          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none"
                        />
                        {query
                          ? <button onMouseDown={e => e.preventDefault()} onClick={clearSearch} className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"><X className="h-3.5 w-3.5 text-white/40" /></button>
                          : <kbd className="text-[10px] text-white/20 bg-white/5 border border-white/8 rounded px-1.5 py-0.5 font-mono">ESC</kbd>
                        }
                      </div>
                      {renderResults()}
                    </div>
                  </div>
                )}
              </div>

              {/* User chip */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
                style={{ background: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.18)' }}
              >
                <User className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-sm font-bold text-purple-300">Lv.{user.level}</span>
                <span className="text-xs text-white/40">{user.name.split(' ')[0]}</span>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-white/40 hover:text-red-400 hover:bg-red-500/8 border border-transparent hover:border-red-500/18 transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ════════════ MOBILE TOP BAR (< md) ════════════ */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 border-b"
        style={{
          background: 'rgba(10, 10, 20, 0.96)',
          backdropFilter: 'blur(20px)',
          borderColor: 'rgba(255,255,255,0.07)',
        }}
      >
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="font-black text-base gradient-text">Roadmap RPG</span>
        </Link>

        {user && (
          <div className="flex items-center gap-1.5" ref={mobileToggleRef}>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.22)' }}>
              <Zap className="h-3 w-3 text-yellow-400" />
              <span className="text-xs font-bold text-purple-300">Lv.{user.level}</span>
            </div>
            <button
              onClick={() => searchOpen ? setSearchOpen(false) : openSearch()}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: searchOpen ? 'rgba(139,92,246,0.22)' : 'rgba(255,255,255,0.05)', color: searchOpen ? '#c084fc' : 'rgba(255,255,255,0.5)' }}
            >
              {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </button>
            <button
              onClick={handleLogout}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: 'rgba(239,68,68,0.08)', color: 'rgba(239,68,68,0.6)' }}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Mobile search panel — drops below top bar */}
      {
        searchOpen && (
          <div ref={mobileSearchPanelRef} className="md:hidden fixed left-3 right-3 z-40" style={{ top: 60 }}>
            <div style={PANEL_STYLE}>
              <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <Search className="h-4 w-4 text-purple-400 flex-shrink-0" />
                <input
                  ref={mobileInputRef}
                  value={query}
                  onChange={handleInput}
                  placeholder="Name or User ID…"
                  autoComplete="off"
                  autoFocus
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none"
                />
                {query && (
                  <button onClick={clearSearch} className="flex-shrink-0 p-1 rounded hover:bg-white/10">
                    <X className="h-3.5 w-3.5 text-white/40" />
                  </button>
                )}
              </div>
              {renderResults()}
            </div>
          </div>
        )
      }

      {/* ════════════ MOBILE BOTTOM TAB BAR ════════════ */}
      {
        user && (
          <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 flex items-stretch"
            style={{
              background: 'linear-gradient(180deg, #0a0a14 0%, #06060e 100%)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 -8px 32px rgba(0,0,0,0.55)',
            }}
          >
            <MobileTab href="/dashboard" label="Dashboard" icon={LayoutDashboard} isActive={pathname === '/dashboard'} />
            <MobileTab href="/roadmap" label="Roadmap" icon={Map} isActive={pathname === '/roadmap' || (pathname.startsWith('/roadmap/') && !pathname.includes('/visibility'))} />
            <MobileTab href="/leaderboard" label="Leaderboard" icon={Trophy} isActive={pathname === '/leaderboard'} isSpecial />
            <MobileTab href="/settings" label="Settings" icon={Settings} isActive={pathname === '/settings'} />
          </div>
        )
      }
    </>
  )
}
