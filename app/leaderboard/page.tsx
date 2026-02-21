'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    Trophy, Zap, Flame, ArrowLeft, RefreshCw, Crown,
    TrendingUp, Users, Medal, Loader2, Star
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'

interface LeaderboardEntry {
    rank: number
    name: string
    totalXP: number
    level: number
    bodyXP: number
    skillsXP: number
    mindsetXP: number
    careerXP: number
    streak: number
    isMe: boolean
}

const CATEGORY_COLORS = {
    body: { bg: 'bg-rose-500', text: 'text-rose-300', label: '💪 Body' },
    skills: { bg: 'bg-blue-500', text: 'text-blue-300', label: '🧠 Skills' },
    mindset: { bg: 'bg-amber-500', text: 'text-amber-300', label: '✨ Mindset' },
    career: { bg: 'bg-emerald-500', text: 'text-emerald-300', label: '🚀 Career' },
}

const RANK_CONFIG = [
    { crown: '👑', ring: 'ring-2 ring-yellow-400/60', bg: 'from-yellow-500/20 to-amber-500/10', border: 'border-yellow-500/30', label: 'text-yellow-300', medal: 'bg-gradient-to-br from-yellow-400 to-amber-500', icon: <Crown className="h-5 w-5" /> },
    { crown: '🥈', ring: 'ring-2 ring-slate-400/60', bg: 'from-slate-500/20  to-slate-400/10', border: 'border-slate-400/30', label: 'text-slate-300', medal: 'bg-gradient-to-br from-slate-300  to-slate-400', icon: <Medal className="h-5 w-5" /> },
    { crown: '🥉', ring: 'ring-2 ring-orange-400/60', bg: 'from-orange-500/20 to-amber-400/10', border: 'border-orange-400/30', label: 'text-orange-300', medal: 'bg-gradient-to-br from-orange-400 to-amber-500', icon: <Medal className="h-5 w-5" /> },
    { crown: '4', ring: '', bg: 'from-white/5       to-transparent', border: 'border-white/8', label: 'text-white/50', medal: 'bg-white/10', icon: <Star className="h-4 w-4" /> },
    { crown: '5', ring: '', bg: 'from-white/5       to-transparent', border: 'border-white/8', label: 'text-white/50', medal: 'bg-white/10', icon: <Star className="h-4 w-4" /> },
]

function CategoryBar({ label, xp, total, color }: { label: string; xp: number; total: number; color: typeof CATEGORY_COLORS['body'] }) {
    const pct = total > 0 ? Math.round((xp / total) * 100) : 0
    return (
        <div className="space-y-0.5">
            <div className="flex justify-between text-[10px]">
                <span className={color.text}>{label}</span>
                <span className="text-white/30 tabular-nums">{xp.toLocaleString()}</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full ${color.bg} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    )
}

export default function LeaderboardPage() {
    const router = useRouter()
    const { user } = useAuthStore()

    const [entries, setEntries] = useState<LeaderboardEntry[]>([])
    const [myRank, setMyRank] = useState<number | null>(null)
    const [totalUsers, setTotalUsers] = useState(0)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

    const fetchLeaderboard = useCallback(async (silent = false) => {
        if (!silent) setLoading(true)
        else setRefreshing(true)
        try {
            const res = await fetch('/api/leaderboard')
            if (!res.ok) throw new Error()
            const data = await res.json()
            setEntries(data.leaderboard)
            setMyRank(data.myRank)
            setTotalUsers(data.totalUsers)
            setLastUpdated(new Date())
        } catch {
            toast.error('Failed to load leaderboard')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    // Initial load + auto-refresh every 30s
    useEffect(() => {
        fetchLeaderboard()
        const interval = setInterval(() => fetchLeaderboard(true), 30_000)
        return () => clearInterval(interval)
    }, [fetchLeaderboard])

    const topEntry = entries[0]

    return (
        <div className="max-w-3xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">

            {/* Back */}
            <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
            </button>

            {/* ── Hero header ── */}
            <div className="text-center space-y-3 relative">
                {/* Glow */}
                <div className="absolute inset-0 -z-10 blur-3xl opacity-20 bg-gradient-to-br from-yellow-500 via-purple-500 to-indigo-500 rounded-full" />

                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/30 to-amber-500/10 border border-yellow-500/30 mb-2">
                    <Trophy className="h-8 w-8 text-yellow-400" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-black gradient-text">Leaderboard</h1>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Top adventurers ranked by total XP earned. Updated in real-time&nbsp;— every 30 seconds.
                </p>

                {/* Stats row */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                    <div className="flex items-center gap-1.5 text-xs text-white/40 bg-white/5 border border-white/8 rounded-full px-3 py-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {totalUsers} adventurers
                    </div>
                    {myRank && (
                        <div className="flex items-center gap-1.5 text-xs bg-purple-500/10 border border-purple-500/25 text-purple-300 rounded-full px-3 py-1.5">
                            <TrendingUp className="h-3.5 w-3.5" />
                            You are rank #{myRank}
                        </div>
                    )}
                    <button
                        onClick={() => fetchLeaderboard(true)}
                        disabled={refreshing}
                        className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/70 bg-white/5 hover:bg-white/10 border border-white/8 rounded-full px-3 py-1.5 transition-all"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* ── Leaderboard ── */}
            {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                    <p className="text-sm text-muted-foreground">Fetching the rankings…</p>
                </div>
            ) : entries.length === 0 ? (
                <div className="text-center py-20 space-y-3">
                    <div className="text-5xl">🏜️</div>
                    <p className="text-muted-foreground">No adventurers yet. Be the first!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {entries.map((entry, i) => {
                        const cfg = RANK_CONFIG[i] ?? RANK_CONFIG[4]
                        const isTop3 = i < 3
                        const xpShare = topEntry.totalXP > 0 ? (entry.totalXP / topEntry.totalXP) * 100 : 0

                        return (
                            <div
                                key={entry.rank}
                                className={`relative glass rounded-2xl border overflow-hidden transition-all duration-300 ${cfg.border} ${entry.isMe ? 'ring-2 ring-purple-500/50' : ''}`}
                            >
                                {/* Rank gradient overlay */}
                                <div className={`absolute inset-0 bg-gradient-to-r ${cfg.bg} pointer-events-none`} />


                                <div className="relative p-4 sm:p-5">
                                    <div className="flex items-start gap-4">

                                        {/* Medal / Rank */}
                                        <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${cfg.medal} flex items-center justify-center font-black text-white shadow-lg ${cfg.ring}`}>
                                            {isTop3 ? <span className="text-xl leading-none">{cfg.crown}</span> : <span className={`text-base font-bold ${cfg.label}`}>{entry.rank}</span>}
                                        </div>

                                        {/* Main info */}
                                        <div className="flex-1 min-w-0 space-y-2">
                                            {/* Name + level + XP */}
                                            <div className="flex flex-wrap items-baseline gap-2">
                                                <h3 className={`font-bold text-base sm:text-lg truncate ${entry.isMe ? 'text-purple-200' : 'text-white/90'}`}>
                                                    {entry.name}
                                                </h3>
                                                {entry.isMe && (
                                                    <span className="text-[10px] font-bold bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-full px-2 py-0.5 flex-shrink-0">
                                                        YOU
                                                    </span>
                                                )}
                                                <span className="text-xs font-semibold text-white/40 bg-white/5 border border-white/8 rounded-md px-1.5 py-0.5 whitespace-nowrap">
                                                    Lv.{entry.level}
                                                </span>
                                                <span className="ml-auto flex items-center gap-1 text-sm sm:text-base font-black text-yellow-400 whitespace-nowrap">
                                                    <Zap className="h-4 w-4" />
                                                    {entry.totalXP.toLocaleString()} XP
                                                </span>
                                            </div>

                                            {/* Total XP bar vs #1 */}
                                            <div className="space-y-1">
                                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-700 ${i === 0 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : i === 1 ? 'bg-gradient-to-r from-slate-300 to-slate-400' : i === 2 ? 'bg-gradient-to-r from-orange-400 to-amber-500' : 'bg-gradient-to-r from-purple-500 to-indigo-500'}`}
                                                        style={{ width: `${xpShare}%` }}
                                                    />
                                                </div>
                                                {entry.streak > 0 && (
                                                    <div className="flex items-center gap-1 text-[10px] text-orange-400">
                                                        <Flame className="h-3 w-3" />
                                                        {entry.streak} day streak
                                                    </div>
                                                )}
                                            </div>

                                            {/* Category XP breakdown — only show if user has any category XP */}
                                            {(entry.bodyXP + entry.skillsXP + entry.mindsetXP + entry.careerXP) > 0 && (
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1">
                                                    <CategoryBar label="💪 Body" xp={entry.bodyXP} total={entry.totalXP} color={CATEGORY_COLORS.body} />
                                                    <CategoryBar label="🧠 Skills" xp={entry.skillsXP} total={entry.totalXP} color={CATEGORY_COLORS.skills} />
                                                    <CategoryBar label="✨ Mindset" xp={entry.mindsetXP} total={entry.totalXP} color={CATEGORY_COLORS.mindset} />
                                                    <CategoryBar label="🚀 Career" xp={entry.careerXP} total={entry.totalXP} color={CATEGORY_COLORS.career} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ── Your rank if outside top 5 ── */}
            {!loading && myRank && myRank > 5 && user && (
                <div className="glass rounded-2xl border border-purple-500/20 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/5 p-4 sm:p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-purple-300">#{myRank}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 flex-wrap">
                                    <p className="font-bold text-purple-200">{user.name} <span className="text-xs text-purple-400">(You)</span></p>
                                    <span className="text-xs text-white/40 bg-white/5 border border-white/8 rounded-md px-1.5 py-0.5">Lv.{user.level}</span>
                                    <span className="ml-auto flex items-center gap-1 text-sm font-black text-yellow-400">
                                        <Zap className="h-3.5 w-3.5" />
                                        {user.totalXP.toLocaleString()} XP
                                    </span>
                                </div>
                                <p className="text-xs text-white/35 mt-0.5">
                                    {entries[0] && entries[0].totalXP > user.totalXP
                                        ? `${(entries[0].totalXP - user.totalXP).toLocaleString()} XP behind #1`
                                        : "Keep grinding \u2014 you're climbing the ranks!"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── How XP is earned ── */}
            <div className="glass rounded-2xl border border-white/8 p-5 sm:p-6 space-y-4">
                <h2 className="font-bold text-sm text-white/60 uppercase tracking-widest">How to climb the ranks</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                        { icon: '✅', title: 'Complete tasks', desc: 'Each task rewards 20–200 XP based on difficulty and skill level.' },
                        { icon: '🔥', title: 'Keep your streak', desc: 'Log in and complete at least one task daily to maintain your streak.' },
                        { icon: '🏆', title: 'Harder roadmaps', desc: 'Hard difficulty tasks give up to 2× more XP than easy ones.' },
                        { icon: '📚', title: 'Diversify categories', desc: 'Spread XP across Body, Skills, Mindset and Career for a balanced profile.' },
                    ].map(item => (
                        <div key={item.title} className="flex gap-3 p-3 rounded-xl bg-white/3 border border-white/6">
                            <span className="text-xl flex-shrink-0">{item.icon}</span>
                            <div>
                                <p className="text-sm font-semibold text-white/80">{item.title}</p>
                                <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
