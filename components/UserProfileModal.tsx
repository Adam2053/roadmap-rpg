'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    X, Trophy, Zap, Flame, Map, Clock, Globe,
    Lock, Loader2, TrendingUp, Calendar, ExternalLink, User,
    Star, PenLine, UserPlus, UserCheck, UserX, Users,
    Heart, HeartHandshake, HeartOff, Sparkles
} from 'lucide-react'
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

interface Props {
    userId: string
    entryName: string
    onClose: () => void
}

const CATEGORY_META = [
    { key: 'bodyXP' as const, label: '💪 Body', bar: 'from-rose-500 to-red-500', text: 'text-rose-300' },
    { key: 'skillsXP' as const, label: '🧠 Skills', bar: 'from-blue-500 to-cyan-500', text: 'text-blue-300' },
    { key: 'mindsetXP' as const, label: '✨ Mindset', bar: 'from-violet-500 to-pink-500', text: 'text-violet-300' },
    { key: 'careerXP' as const, label: '🚀 Career', bar: 'from-emerald-500 to-green-500', text: 'text-emerald-300' },
]

function XPCategoryBar({ label, xp, max, barClass, textClass }: {
    label: string; xp: number; max: number; barClass: string; textClass: string
}) {
    const pct = max > 0 ? Math.min(100, Math.round((xp / max) * 100)) : 0
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className={textClass}>{label}</span>
                <span className="text-white/40 tabular-nums">{xp.toLocaleString()}</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${barClass} rounded-full transition-all duration-700`}
                    style={{ width: `${pct}%` }} />
            </div>
        </div>
    )
}

export default function UserProfileModal({ userId, entryName, onClose }: Props) {
    const router = useRouter()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [roadmaps, setRoadmaps] = useState<PublicRoadmap[]>([])
    const [isPrivate, setIsPrivate] = useState(false)
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
                setError(json.error || 'Failed to load profile')
                return
            }
            const data = await res.json()
            if (data.isPrivate) {
                setIsPrivate(true)
                // data.profile includes name, totalXP, level, allowCloseFriendRequests
                setProfile(data.profile as UserProfile)
            } else {
                setProfile(data.profile)
                setRoadmaps(data.publicRoadmaps || [])
            }
        } catch {
            setError('Network error')
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

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [onClose])

    const viewFullProfile = () => { onClose(); router.push(`/profile/${userId}`) }
    const openRoadmap = (roadmapId: string) => { onClose(); router.push(`/roadmap/${roadmapId}`) }

    /* ── Connection actions ────────────────────────────────── */
    const toggleFollow = async () => {
        if (!connStatus || connLoading) return
        setConnLoading(true)
        const prev = connStatus
        // Optimistic update
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
                toast.success(data.following ? `Now following ${entryName} as mentor` : `Unfollowed ${entryName}`)
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
            toast.success(`Close friend request sent to ${entryName}! 🤝`)
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
            toast.success(`Removed ${entryName} from close friends`)
        } catch {
            toast.error('Network error')
        } finally {
            setConnLoading(false)
        }
    }

    const maxCategoryXP = profile
        ? Math.max(1, profile.bodyXP, profile.skillsXP, profile.mindsetXP, profile.careerXP)
        : 1

    /* ── Friend button logic ───────────────────────────────── */
    const renderFriendButton = () => {
        if (!connStatus) return null
        const { friendStatus, allowCloseFriendRequests, myCloseFriendCount, closeFriendCount } = connStatus

        if (friendStatus === 'accepted') {
            return (
                <button
                    onClick={unfriend}
                    disabled={connLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-indigo-500/35 bg-indigo-500/15 text-indigo-300 hover:bg-red-500/15 hover:border-red-500/35 hover:text-red-300 transition-all"
                    title="Remove close friend"
                >
                    <HeartHandshake className="h-3.5 w-3.5" />
                    Close Friend
                </button>
            )
        }

        if (friendStatus === 'pending_sent') {
            return (
                <button
                    onClick={cancelRequest}
                    disabled={connLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/15 bg-white/5 text-white/40 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/25 transition-all"
                    title="Cancel request"
                >
                    <HeartOff className="h-3.5 w-3.5" />
                    Pending…
                </button>
            )
        }

        if (friendStatus === 'pending_received') {
            return (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-yellow-500/25 bg-yellow-500/10 text-yellow-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    Wants to connect
                </span>
            )
        }

        // friendStatus === 'none' — show Add button (with guards)
        if (!allowCloseFriendRequests) {
            return (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-white/8 bg-white/3 text-white/25 cursor-not-allowed" title="Not accepting close friend requests">
                    <UserX className="h-3.5 w-3.5" />
                    Requests off
                </span>
            )
        }

        if (myCloseFriendCount >= 10) {
            return (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-white/8 bg-white/3 text-white/25 cursor-not-allowed" title="You've reached 10 close friends">
                    <Users className="h-3.5 w-3.5" />
                    Your limit reached
                </span>
            )
        }

        if (closeFriendCount >= 10) {
            return (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-white/8 bg-white/3 text-white/25 cursor-not-allowed" title="This user has reached their limit">
                    <Users className="h-3.5 w-3.5" />
                    Their limit full
                </span>
            )
        }

        return (
            <button
                onClick={sendFriendRequest}
                disabled={connLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-indigo-500/25 bg-indigo-500/8 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all"
            >
                <Heart className="h-3.5 w-3.5" />
                Add Close Friend
            </button>
        )
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto glass rounded-3xl border border-white/15 shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
                >
                    <X className="h-4 w-4" />
                </button>

                {loading ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-24">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                        <p className="text-sm text-muted-foreground">Loading profile…</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-24 px-6">
                        <div className="text-4xl">😶</div>
                        <p className="text-sm text-muted-foreground text-center">{error}</p>
                    </div>
                ) : isPrivate && profile ? (
                    /* ── Private profile: show identity + friend request only ── */
                    <div>
                        {/* Muted hero */}
                        <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/60 p-6 pb-5">
                            <div className="absolute inset-0 bg-gradient-to-r from-white/3 to-white/1 pointer-events-none" />
                            <div className="relative flex items-start gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-white/8 border border-white/15 flex items-center justify-center flex-shrink-0 text-2xl font-black text-white/40">
                                    {profile.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h2 className="text-xl font-black text-white/85 leading-tight pr-8">{profile.name}</h2>
                                        <span className="flex items-center gap-1 text-xs text-white/30 bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5">
                                            <Lock className="h-3 w-3" /> Private
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 mt-2.5">
                                        <div className="flex items-center gap-1.5 bg-yellow-500/12 border border-yellow-500/20 rounded-full px-2.5 py-1">
                                            <Trophy className="h-3.5 w-3.5 text-yellow-400/70" />
                                            <span className="text-xs font-bold text-yellow-300/70">Level {profile.level}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-2.5 py-1">
                                            <Zap className="h-3.5 w-3.5 text-white/30" />
                                            <span className="text-xs font-semibold text-white/40">{profile.totalXP?.toLocaleString()} XP</span>
                                        </div>
                                    </div>

                                    {/* Close friend action */}
                                    {connStatus && !connStatus.isMe && (
                                        <div className="mt-4">
                                            {connStatus.friendStatus === 'accepted' ? (
                                                <button onClick={unfriend} disabled={connLoading}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-indigo-500/35 bg-indigo-500/15 text-indigo-300 hover:bg-red-500/15 hover:border-red-500/35 hover:text-red-300 transition-all">
                                                    <HeartHandshake className="h-3.5 w-3.5" /> Close Friend
                                                </button>
                                            ) : connStatus.friendStatus === 'pending_sent' ? (
                                                <button onClick={cancelRequest} disabled={connLoading}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/15 bg-white/5 text-white/40 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/25 transition-all">
                                                    <HeartOff className="h-3.5 w-3.5" /> Pending…
                                                </button>
                                            ) : connStatus.friendStatus === 'pending_received' ? (
                                                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-yellow-500/25 bg-yellow-500/10 text-yellow-300">
                                                    <Sparkles className="h-3.5 w-3.5" /> Wants to connect
                                                </span>
                                            ) : !(connStatus.allowCloseFriendRequests ?? true) ? (
                                                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-white/8 bg-white/3 text-white/25 cursor-not-allowed">
                                                    <UserX className="h-3.5 w-3.5" /> Requests off
                                                </span>
                                            ) : connStatus.myCloseFriendCount >= 10 ? (
                                                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-white/8 bg-white/3 text-white/25 cursor-not-allowed">
                                                    <Users className="h-3.5 w-3.5" /> Your limit reached
                                                </span>
                                            ) : connStatus.closeFriendCount >= 10 ? (
                                                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-white/8 bg-white/3 text-white/25 cursor-not-allowed">
                                                    <Users className="h-3.5 w-3.5" /> Their limit full
                                                </span>
                                            ) : (
                                                <button onClick={sendFriendRequest} disabled={connLoading}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-indigo-500/25 bg-indigo-500/8 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all">
                                                    <Heart className="h-3.5 w-3.5" /> Add Close Friend
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Hint footer */}
                        <div className="px-5 py-4 text-center">
                            <p className="text-xs text-white/20 leading-relaxed">
                                This adventurer keeps their journey private. Stats and roadmaps are hidden.
                            </p>
                        </div>
                    </div>
                ) : profile ? (
                    <div>
                        {/* Hero */}
                        <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-purple-900/70 via-indigo-900/60 to-purple-900/50 p-6 pb-5">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-indigo-600/10 pointer-events-none" />
                            <div className="relative flex items-start gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/40 to-indigo-500/40 border border-purple-500/40 flex items-center justify-center flex-shrink-0 text-2xl font-black text-purple-200">
                                    {profile.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-xl font-black text-white leading-tight break-words pr-8">{profile.name}</h2>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <div className="flex items-center gap-1.5 bg-yellow-500/15 border border-yellow-500/25 rounded-full px-2.5 py-1">
                                            <Trophy className="h-3.5 w-3.5 text-yellow-400" />
                                            <span className="text-xs font-bold text-yellow-300">Level {profile.level}</span>
                                        </div>
                                        {profile.streak > 0 && (
                                            <div className="flex items-center gap-1.5 bg-orange-500/15 border border-orange-500/25 rounded-full px-2.5 py-1">
                                                <Flame className="h-3.5 w-3.5 text-orange-400" />
                                                <span className="text-xs font-bold text-orange-300">{profile.streak}d streak</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-2.5 py-1">
                                            <Calendar className="h-3 w-3 text-white/40" />
                                            <span className="text-xs text-white/40">
                                                {new Date(profile.memberSince).getFullYear()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative mt-4 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
                                <Zap className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                                <span className="text-2xl font-black text-yellow-300 tabular-nums">{profile.totalXP.toLocaleString()}</span>
                                <span className="text-sm text-white/40">Total XP</span>
                                <div className="ml-auto flex items-center gap-1 text-xs text-white/30">
                                    <TrendingUp className="h-3.5 w-3.5" />
                                    <span>all categories</span>
                                </div>
                            </div>

                            {/* Connection stats */}
                            {connStatus && (
                                <div className="relative mt-3 flex items-center gap-3 text-xs text-white/35">
                                    <span className="flex items-center gap-1">
                                        <UserCheck className="h-3 w-3 text-purple-400/60" />
                                        <span className="font-semibold text-purple-300/80">{connStatus.followerCount}</span> followers
                                    </span>
                                    <span className="text-white/15">·</span>
                                    <span className="flex items-center gap-1">
                                        <HeartHandshake className="h-3 w-3 text-indigo-400/60" />
                                        <span className="font-semibold text-indigo-300/80">{connStatus.closeFriendCount}</span> close friends
                                    </span>
                                </div>
                            )}

                            {/* Connection action buttons */}
                            {connStatus && !connStatus.isMe && (
                                <div className="relative mt-3 flex items-center gap-2 flex-wrap">
                                    {/* Follow / Unfollow mentor */}
                                    <button
                                        onClick={toggleFollow}
                                        disabled={connLoading}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${connStatus.following
                                            ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 hover:bg-red-500/15 hover:border-red-500/35 hover:text-red-300'
                                            : 'bg-white/5 border-white/10 text-white/50 hover:bg-purple-500/15 hover:border-purple-500/30 hover:text-purple-300'
                                            }`}
                                    >
                                        {connStatus.following
                                            ? <><UserX className="h-3.5 w-3.5" /> Following</>
                                            : <><UserPlus className="h-3.5 w-3.5" /> Follow as Mentor</>
                                        }
                                    </button>

                                    {/* Close friend button */}
                                    {renderFriendButton()}
                                </div>
                            )}

                            {/* View Full Profile Button */}
                            <button
                                onClick={viewFullProfile}
                                className="relative mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/35 border border-purple-500/30 text-purple-300 text-sm font-medium transition-all"
                            >
                                <User className="h-4 w-4" />
                                View Full Profile
                                <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        {/* Category XP */}
                        <div className="p-5 space-y-3 border-b border-white/8">
                            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest">Category XP</h3>
                            <div className="space-y-3">
                                {CATEGORY_META.map(cat => (
                                    <XPCategoryBar
                                        key={cat.key}
                                        label={cat.label}
                                        xp={profile[cat.key]}
                                        max={maxCategoryXP}
                                        barClass={cat.bar}
                                        textClass={cat.text}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Public Roadmaps */}
                        <div className="p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                                    <Globe className="h-3.5 w-3.5" />
                                    Public Roadmaps
                                </h3>
                                <span className="text-xs text-white/30">{roadmaps.length} shared</span>
                            </div>

                            {roadmaps.length === 0 ? (
                                <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-6 text-center space-y-1">
                                    <Lock className="h-6 w-6 text-white/20 mx-auto" />
                                    <p className="text-sm text-white/30">No public roadmaps yet</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {roadmaps.map(rm => (
                                        <button
                                            key={rm._id}
                                            onClick={() => openRoadmap(rm._id)}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/8 bg-white/3 hover:bg-white/8 hover:border-white/15 transition-all text-left group"
                                        >
                                            <Map className="h-4 w-4 text-purple-400 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-white/85 leading-snug break-words group-hover:text-purple-300 transition-colors">
                                                    {rm.title || rm.goal}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${rm.difficulty === 'hard' ? 'bg-red-500/20 text-red-300' : rm.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>
                                                        {rm.difficulty}
                                                    </span>
                                                    <span className="text-[10px] text-white/30 flex items-center gap-1">
                                                        <Clock className="h-2.5 w-2.5" />{rm.duration}w
                                                    </span>
                                                    <span className="text-[10px] text-purple-300 font-medium">{rm.progress}% done</span>
                                                    {rm.isCustom && (
                                                        <span className="text-[10px] text-teal-400/80 flex items-center gap-0.5">
                                                            <PenLine className="h-2.5 w-2.5" />Custom
                                                        </span>
                                                    )}
                                                    {(rm.starCount || 0) > 0 && (
                                                        <span className="text-[10px] text-yellow-400/80 flex items-center gap-0.5">
                                                            <Star className="h-2.5 w-2.5 fill-yellow-400/60" />{rm.starCount}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-1.5 h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                                                        style={{ width: `${rm.progress}%` }} />
                                                </div>
                                            </div>
                                            <ExternalLink className="h-3.5 w-3.5 text-white/20 group-hover:text-purple-400 flex-shrink-0 transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
