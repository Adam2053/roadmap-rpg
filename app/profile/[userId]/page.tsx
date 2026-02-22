'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    ArrowLeft, Trophy, Zap, Flame, Map, Clock, Globe,
    Lock, Loader2, Calendar, TrendingUp, ExternalLink, ChevronRight,
    UserPlus, UserX, Heart, HeartHandshake, HeartOff, Users,
    UserCheck, Sparkles, Star, PenLine
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface PublicRoadmap {
    _id: string
    title: string
    goal: string
    difficulty: string
    duration: number
    progress: number
    skillLevel: string
    starCount: number
    isCustom: boolean
    createdAt: string
}

interface UserProfile {
    userId: string
    name: string
    totalXP: number
    level: number
    bodyXP: number
    skillsXP: number
    mindsetXP: number
    careerXP: number
    streak: number
    memberSince: string
    isMe: boolean
}

interface ConnectionStatus {
    isMe: boolean
    following: boolean
    followerCount: number
    friendStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted'
    closeFriendCount: number
    allowCloseFriendRequests: boolean
    myCloseFriendCount: number
}

const CATEGORY_META = [
    { key: 'bodyXP' as const, label: '💪 Body', bar: 'from-rose-500 to-red-500', text: 'text-rose-300', bg: 'bg-rose-500/10' },
    { key: 'skillsXP' as const, label: '🧠 Skills', bar: 'from-blue-500 to-cyan-500', text: 'text-blue-300', bg: 'bg-blue-500/10' },
    { key: 'mindsetXP' as const, label: '✨ Mindset', bar: 'from-violet-500 to-pink-500', text: 'text-violet-300', bg: 'bg-violet-500/10' },
    { key: 'careerXP' as const, label: '🚀 Career', bar: 'from-emerald-500 to-green-500', text: 'text-emerald-300', bg: 'bg-emerald-500/10' },
]

function XPBar({ label, xp, max, bar, text }: { label: string; xp: number; max: number; bar: string; text: string }) {
    const pct = max > 0 ? Math.min(100, Math.round((xp / max) * 100)) : 0
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
                <span className={text}>{label}</span>
                <span className="text-white/50 tabular-nums">{xp.toLocaleString()} XP</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${bar} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    )
}

export default function ProfilePage() {
    const { userId } = useParams<{ userId: string }>()
    const router = useRouter()

    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [roadmaps, setRoadmaps] = useState<PublicRoadmap[]>([])
    const [isPrivate, setIsPrivate] = useState(false)
    const [privateName, setPrivateName] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Connection state
    const [connStatus, setConnStatus] = useState<ConnectionStatus | null>(null)
    const [connLoading, setConnLoading] = useState(false)

    const fetchProfile = useCallback(async () => {
        try {
            const res = await fetch(`/api/profile/${userId}`)
            if (!res.ok) {
                const json = await res.json()
                setError(json.error || 'Profile not found')
                return
            }
            const data = await res.json()
            if (data.isPrivate) {
                setIsPrivate(true)
                setPrivateName(data.profile?.name || 'This user')
                // Store limited profile data so we can render name/xp/friend button
                setProfile(data.profile as UserProfile)
            } else {
                setProfile(data.profile)
                setRoadmaps(data.publicRoadmaps || [])
            }
        } catch {
            setError('Failed to load profile')
        } finally {
            setLoading(false)
        }
    }, [userId])

    const fetchConnStatus = useCallback(async () => {
        try {
            const res = await fetch(`/api/connections/status/${userId}`)
            if (res.ok) setConnStatus(await res.json())
        } catch { /* non-fatal */ }
    }, [userId])

    useEffect(() => { fetchProfile() }, [fetchProfile])
    useEffect(() => { fetchConnStatus() }, [fetchConnStatus])

    const maxCategoryXP = profile
        ? Math.max(1, profile.bodyXP, profile.skillsXP, profile.mindsetXP, profile.careerXP)
        : 1

    /* ── Connection action handlers ──────────────────────── */
    const toggleFollow = async () => {
        if (!connStatus || connLoading) return
        setConnLoading(true)
        const prev = connStatus
        setConnStatus(s => s ? {
            ...s,
            following: !s.following,
            followerCount: s.following ? Math.max(0, s.followerCount - 1) : s.followerCount + 1,
        } : s)
        try {
            const res = await fetch('/api/connections/follow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: userId }),
            })
            if (!res.ok) {
                setConnStatus(prev)
                toast.error((await res.json()).error || 'Failed')
            } else {
                const data = await res.json()
                setConnStatus(s => s ? { ...s, following: data.following, followerCount: data.followerCount } : s)
                toast.success(data.following ? `Now following ${profile?.name} as mentor ♦` : `Unfollowed ${profile?.name}`)
            }
        } catch {
            setConnStatus(prev)
            toast.error('Network error')
        } finally {
            setConnLoading(false)
        }
    }

    const sendFriendRequest = async () => {
        if (!connStatus || connLoading) return
        setConnLoading(true)
        try {
            const res = await fetch('/api/connections/friend/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: userId }),
            })
            const json = await res.json()
            if (!res.ok) { toast.error(json.error || 'Failed'); return }
            setConnStatus(s => s ? { ...s, friendStatus: 'pending_sent' } : s)
            toast.success(`Close friend request sent to ${profile?.name}! 🤝`)
        } catch {
            toast.error('Network error')
        } finally {
            setConnLoading(false)
        }
    }

    const cancelRequest = async () => {
        if (!connStatus || connLoading) return
        setConnLoading(true)
        try {
            const res = await fetch(`/api/connections/friend/${userId}`, { method: 'DELETE' })
            if (!res.ok) { toast.error((await res.json()).error || 'Failed'); return }
            setConnStatus(s => s ? { ...s, friendStatus: 'none' } : s)
            toast.success('Request cancelled')
        } catch {
            toast.error('Network error')
        } finally {
            setConnLoading(false)
        }
    }

    const unfriend = async () => {
        if (!connStatus || connLoading) return
        setConnLoading(true)
        try {
            const res = await fetch(`/api/connections/friend/${userId}`, { method: 'DELETE' })
            if (!res.ok) { toast.error((await res.json()).error || 'Failed'); return }
            setConnStatus(s => s ? {
                ...s,
                friendStatus: 'none',
                closeFriendCount: Math.max(0, s.closeFriendCount - 1),
                myCloseFriendCount: Math.max(0, s.myCloseFriendCount - 1),
            } : s)
            toast.success(`Removed ${profile?.name} from close friends`)
        } catch {
            toast.error('Network error')
        } finally {
            setConnLoading(false)
        }
    }

    /* ── Friend button ───────────────────────────────────── */
    const renderFriendButton = () => {
        if (!connStatus) return null
        const { friendStatus, allowCloseFriendRequests, myCloseFriendCount, closeFriendCount } = connStatus

        if (friendStatus === 'accepted') return (
            <button onClick={unfriend} disabled={connLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-indigo-500/35 bg-indigo-500/15 text-indigo-300 hover:bg-red-500/12 hover:border-red-500/35 hover:text-red-300 transition-all"
                title="Remove close friend"
            >
                <HeartHandshake className="h-4 w-4" />
                Close Friend
            </button>
        )

        if (friendStatus === 'pending_sent') return (
            <button onClick={cancelRequest} disabled={connLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-white/15 bg-white/5 text-white/40 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/25 transition-all"
                title="Cancel request"
            >
                <HeartOff className="h-4 w-4" />
                Pending…
            </button>
        )

        if (friendStatus === 'pending_received') return (
            <span className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-yellow-500/25 bg-yellow-500/10 text-yellow-300">
                <Sparkles className="h-4 w-4" />
                Wants to connect
            </span>
        )

        // none — show Add button with guards
        if (!allowCloseFriendRequests) return (
            <span className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border border-white/8 bg-white/3 text-white/25 cursor-not-allowed" title="Not accepting requests">
                <UserX className="h-4 w-4" />
                Requests disabled
            </span>
        )

        if (myCloseFriendCount >= 10) return (
            <span className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border border-white/8 bg-white/3 text-white/25 cursor-not-allowed" title="You've reached 10 close friends">
                <Users className="h-4 w-4" />
                Your limit reached
            </span>
        )

        if (closeFriendCount >= 10) return (
            <span className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border border-white/8 bg-white/3 text-white/25 cursor-not-allowed" title="This user's limit is full">
                <Users className="h-4 w-4" />
                Their limit full
            </span>
        )

        return (
            <button onClick={sendFriendRequest} disabled={connLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-500/45 transition-all"
            >
                <Heart className="h-4 w-4" />
                Add Close Friend
            </button>
        )
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                <p className="text-sm text-muted-foreground">Loading profile…</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
                <div className="text-6xl">🔍</div>
                <h2 className="text-xl font-bold">Profile not found</h2>
                <p className="text-muted-foreground">{error}</p>
                <button onClick={() => router.back()}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Go back
                </button>
            </div>
        )
    }

    const showConnectionActions = connStatus && !connStatus.isMe

    if (isPrivate) {
        return (
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
                <button onClick={() => router.back()}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
                    <ArrowLeft className="h-4 w-4" /> Back
                </button>

                {/* Muted hero — shows identity but not full stats */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/60 border border-white/10 p-6 sm:p-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/3 to-white/1 pointer-events-none" />
                    <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-white/3 blur-3xl pointer-events-none" />

                    <div className="relative flex flex-col sm:flex-row items-start gap-5">
                        <div className="w-20 h-20 rounded-2xl bg-white/8 border border-white/12 flex items-center justify-center text-4xl font-black text-white/35 flex-shrink-0">
                            {privateName.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h1 className="text-2xl sm:text-3xl font-black text-white/80 break-words">{privateName}</h1>
                                <span className="flex items-center gap-1 text-xs text-white/30 bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5">
                                    <Lock className="h-3 w-3" /> Private profile
                                </span>
                            </div>

                            {/* Level + XP — shown even on private */}
                            {profile && (
                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                    <span className="flex items-center gap-1.5 bg-yellow-500/12 border border-yellow-500/20 rounded-full px-3 py-1">
                                        <Trophy className="h-3.5 w-3.5 text-yellow-400/70" />
                                        <span className="text-sm font-bold text-yellow-300/70">Level {profile.level}</span>
                                    </span>
                                    <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                                        <Zap className="h-3.5 w-3.5 text-white/30" />
                                        <span className="text-sm font-semibold text-white/40">{profile.totalXP?.toLocaleString()} XP</span>
                                    </span>
                                </div>
                            )}

                            {/* Close friend actions — no Follow button for private profiles */}
                            {showConnectionActions && (
                                <div className="flex flex-wrap items-center gap-2.5 mt-5">
                                    {renderFriendButton()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="glass rounded-2xl p-6 text-center space-y-2">
                    <Lock className="h-6 w-6 text-white/20 mx-auto" />
                    <p className="text-sm text-white/30">Stats and roadmaps are hidden on private profiles.</p>
                    <p className="text-xs text-white/20">
                        This adventurer has chosen to keep their journey private. Only public profiles share full stats and roadmaps.
                    </p>
                </div>
            </div>
        )
    }

    if (!profile) return null

    const memberYear = new Date(profile.memberSince!).getFullYear()

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

            {/* Back */}
            <button onClick={() => router.back()}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
                <ArrowLeft className="h-4 w-4" />
                Back
            </button>

            {/* ── Hero Banner ── */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900/70 via-indigo-900/60 to-purple-900/50 border border-purple-500/20 p-6 sm:p-8">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-indigo-600/10 pointer-events-none" />
                <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

                <div className="relative flex flex-col sm:flex-row items-start gap-5">
                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/40 to-indigo-500/40 border border-purple-500/40 flex items-center justify-center text-4xl font-black text-purple-200 flex-shrink-0">
                        {profile.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h1 className="text-2xl sm:text-3xl font-black break-words">{profile.name}</h1>
                            {profile.isMe && (
                                <span className="text-xs font-bold bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-full px-2.5 py-0.5">You</span>
                            )}
                            {connStatus?.friendStatus === 'accepted' && (
                                <span className="text-xs font-bold bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-full px-2.5 py-0.5 flex items-center gap-1">
                                    <HeartHandshake className="h-3 w-3" /> Close Friend
                                </span>
                            )}
                            {connStatus?.following && (
                                <span className="text-xs font-bold bg-purple-500/15 border border-purple-500/25 text-purple-300/80 rounded-full px-2.5 py-0.5 flex items-center gap-1">
                                    <UserCheck className="h-3 w-3" /> Mentor
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="flex items-center gap-1.5 bg-yellow-500/15 border border-yellow-500/25 rounded-full px-3 py-1">
                                <Trophy className="h-3.5 w-3.5 text-yellow-400" />
                                <span className="text-sm font-bold text-yellow-300">Level {profile.level}</span>
                            </span>
                            {profile.streak > 0 && (
                                <span className="flex items-center gap-1.5 bg-orange-500/15 border border-orange-500/25 rounded-full px-3 py-1">
                                    <Flame className="h-3.5 w-3.5 text-orange-400" />
                                    <span className="text-sm font-bold text-orange-300">{profile.streak}d streak</span>
                                </span>
                            )}
                            <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                                <Calendar className="h-3.5 w-3.5 text-white/40" />
                                <span className="text-sm text-white/40">Joined {memberYear}</span>
                            </span>
                            <span className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
                                <Globe className="h-3.5 w-3.5 text-emerald-400" />
                                <span className="text-sm text-emerald-300">Public profile</span>
                            </span>
                        </div>

                        {/* Connection stats row */}
                        {connStatus && (
                            <div className="flex items-center gap-4 mt-3 text-sm text-white/35">
                                <span className="flex items-center gap-1.5">
                                    <UserCheck className="h-3.5 w-3.5 text-purple-400/60" />
                                    <span className="font-semibold text-purple-300/70">{connStatus.followerCount}</span>
                                    <span>followers</span>
                                </span>
                                <span className="text-white/15">·</span>
                                <span className="flex items-center gap-1.5">
                                    <HeartHandshake className="h-3.5 w-3.5 text-indigo-400/60" />
                                    <span className="font-semibold text-indigo-300/70">{connStatus.closeFriendCount}</span>
                                    <span>close friends</span>
                                </span>
                            </div>
                        )}

                        {/* Connection action buttons */}
                        {showConnectionActions && (
                            <div className="flex flex-wrap items-center gap-2.5 mt-4">
                                {/* Follow / Unfollow */}
                                <button
                                    onClick={toggleFollow}
                                    disabled={connLoading}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all disabled:opacity-60 ${connStatus.following
                                        ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 hover:bg-red-500/12 hover:border-red-500/35 hover:text-red-300'
                                        : 'bg-white/5 border-white/12 text-white/55 hover:bg-purple-500/15 hover:border-purple-500/35 hover:text-purple-300'
                                        }`}
                                >
                                    {connLoading
                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                        : connStatus.following
                                            ? <UserX className="h-4 w-4" />
                                            : <UserPlus className="h-4 w-4" />
                                    }
                                    {connStatus.following ? 'Following' : 'Follow as Mentor'}
                                </button>

                                {/* Close friend */}
                                {renderFriendButton()}
                            </div>
                        )}
                    </div>

                    {/* Total XP — only on larger screens */}
                    <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <Zap className="h-6 w-6 text-yellow-400" />
                            <span className="text-3xl font-black text-yellow-300 tabular-nums">{profile.totalXP.toLocaleString()}</span>
                        </div>
                        <span className="text-xs text-white/30 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />Total XP
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Stats + Category XP ── */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Stats cards */}
                <div className="glass rounded-2xl p-5 space-y-4">
                    <h2 className="font-bold text-sm text-white/50 uppercase tracking-widest">Stats</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Total XP', value: profile.totalXP.toLocaleString(), icon: '⚡', color: 'text-yellow-300' },
                            { label: 'Level', value: profile.level, icon: '🏆', color: 'text-yellow-300' },
                            { label: 'Day Streak', value: `${profile.streak} 🔥`, icon: '🔥', color: 'text-orange-300' },
                            { label: 'Public Maps', value: roadmaps.length, icon: '🗺️', color: 'text-blue-300' },
                        ].map(s => (
                            <div key={s.label} className="bg-white/3 border border-white/8 rounded-xl p-3">
                                <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                                <div className="text-xs text-white/30 mt-0.5">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Category XP */}
                <div className="glass rounded-2xl p-5 space-y-4">
                    <h2 className="font-bold text-sm text-white/50 uppercase tracking-widest">Category XP</h2>
                    <div className="space-y-4">
                        {CATEGORY_META.map(cat => (
                            <XPBar
                                key={cat.key}
                                label={cat.label}
                                xp={profile[cat.key]}
                                max={maxCategoryXP}
                                bar={cat.bar}
                                text={cat.text}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Public Roadmaps ── */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-xl flex items-center gap-2">
                        <Globe className="h-5 w-5 text-emerald-400" />
                        Public Roadmaps
                        <span className="text-sm font-normal text-white/30">({roadmaps.length})</span>
                    </h2>
                </div>

                {roadmaps.length === 0 ? (
                    <div className="glass rounded-2xl p-12 text-center space-y-3">
                        <Map className="h-10 w-10 text-white/20 mx-auto" />
                        <p className="text-muted-foreground">No public roadmaps shared yet</p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                        {roadmaps.map(rm => (
                            <Link
                                key={rm._id}
                                href={`/roadmap/${rm._id}`}
                                className="glass rounded-2xl p-5 hover:bg-white/10 transition-all duration-300 group block"
                            >
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-sm leading-snug break-words group-hover:text-purple-300 transition-colors">
                                            {rm.title || rm.goal}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-md font-medium whitespace-nowrap ${rm.difficulty === 'hard' ? 'bg-red-500/20 text-red-300' : rm.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>
                                                {rm.difficulty}
                                            </span>
                                            <span className="text-xs text-white/30 flex items-center gap-1 whitespace-nowrap">
                                                <Clock className="h-3 w-3" />{rm.duration}w
                                            </span>
                                            {rm.isCustom && (
                                                <span className="text-xs text-teal-400/80 flex items-center gap-1 whitespace-nowrap">
                                                    <PenLine className="h-3 w-3" />Custom
                                                </span>
                                            )}
                                            {(rm.starCount || 0) > 0 && (
                                                <span className="text-xs text-yellow-400/80 flex items-center gap-1 whitespace-nowrap">
                                                    <Star className="h-3 w-3 fill-yellow-400/60" />{rm.starCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-white/20 group-hover:text-purple-400 transition-colors flex-shrink-0 mt-0.5" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs text-white/30 mb-1">
                                        <span>Progress</span>
                                        <span>{rm.progress}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                                            style={{ width: `${rm.progress}%` }} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Profile URL share chip */}
            <div className="glass rounded-xl border border-white/8 px-4 py-3 flex items-center gap-3 text-xs text-white/30">
                <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="flex-1 min-w-0 truncate">
                    Profile URL: <span className="text-white/50">{typeof window !== 'undefined' ? window.location.href : ''}</span>
                </span>
                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
            </div>

        </div>
    )
}
