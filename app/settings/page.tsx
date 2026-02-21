'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    User, Globe, Lock, Copy, Check, Loader2,
    ArrowLeft, Zap, Trophy, Flame, Calendar, Shield, Pencil, LogOut
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'

interface Settings {
    userId: string
    name: string
    email: string
    isProfilePublic: boolean
    totalXP: number
    level: number
    streak: number
    memberSince: string
}

export default function SettingsPage() {
    const router = useRouter()
    const { user, logout } = useAuthStore()

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        logout()
        router.push('/login')
        toast.success('Signed out successfully')
    }

    const [settings, setSettings] = useState<Settings | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [idCopied, setIdCopied] = useState(false)
    const [editingName, setEditingName] = useState(false)
    const [nameInput, setNameInput] = useState('')

    const fetchSettings = useCallback(async () => {
        try {
            const res = await fetch('/api/settings')
            if (!res.ok) { router.replace('/login'); return }
            const data = await res.json()
            setSettings(data)
            setNameInput(data.name)
        } catch {
            toast.error('Failed to load settings')
        } finally {
            setLoading(false)
        }
    }, [router])

    useEffect(() => { fetchSettings() }, [fetchSettings])

    const patchSettings = async (updates: Partial<{ isProfilePublic: boolean; name: string }>) => {
        setSaving(true)
        try {
            const res = await fetch('/api/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            })
            if (!res.ok) { toast.error('Failed to save'); return }
            const data = await res.json()
            setSettings(prev => prev ? { ...prev, ...data } : prev)
            toast.success('Settings saved ✓')
        } catch {
            toast.error('Network error')
        } finally {
            setSaving(false)
            setEditingName(false)
        }
    }

    const copyUserId = () => {
        if (!settings?.userId) return
        const fallback = (text: string) => {
            const ta = document.createElement('textarea')
            ta.value = text
            ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;'
            document.body.appendChild(ta)
            ta.focus(); ta.select()
            try { document.execCommand('copy'); toast.success('User ID copied!') }
            catch { toast.info(`Your ID: ${text}`, { duration: 8000 }) }
            finally { document.body.removeChild(ta) }
        }

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(settings.userId).then(() => {
                toast.success('User ID copied!')
            }).catch(() => fallback(settings.userId))
        } else {
            fallback(settings.userId)
        }
        setIdCopied(true)
        setTimeout(() => setIdCopied(false), 2000)
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                <p className="text-sm text-muted-foreground">Loading settings…</p>
            </div>
        )
    }

    if (!settings) return null

    const memberYear = new Date(settings.memberSince).getFullYear()

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">

            {/* Back */}
            <button onClick={() => router.back()}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
                <ArrowLeft className="h-4 w-4" />
                Back
            </button>

            {/* Title */}
            <div>
                <h1 className="text-2xl font-black">Settings</h1>
                <p className="text-sm text-muted-foreground mt-1">Manage your account and privacy preferences</p>
            </div>

            {/* ── Account Overview ── */}
            <div className="glass rounded-2xl p-5 sm:p-6 space-y-4">
                <h2 className="font-bold text-sm text-white/50 uppercase tracking-widest flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Account
                </h2>

                {/* Avatar + Stats */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-500/10 to-indigo-500/5 border border-purple-500/20 rounded-xl">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/40 to-indigo-500/40 border border-purple-500/40 flex items-center justify-center text-2xl font-black text-purple-200 flex-shrink-0">
                        {settings.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-lg break-words">{settings.name}</p>
                        <p className="text-sm text-white/40 truncate">{settings.email}</p>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                            <span className="flex items-center gap-1 text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-2 py-0.5">
                                <Trophy className="h-3 w-3" />Lv.{settings.level}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-full px-2 py-0.5">
                                <Zap className="h-3 w-3" />{settings.totalXP.toLocaleString()} XP
                            </span>
                            {settings.streak > 0 && (
                                <span className="flex items-center gap-1 text-xs text-orange-300 bg-orange-500/10 border border-orange-500/20 rounded-full px-2 py-0.5">
                                    <Flame className="h-3 w-3" />{settings.streak}d streak
                                </span>
                            )}
                            <span className="flex items-center gap-1 text-xs text-white/30 bg-white/5 border border-white/8 rounded-full px-2 py-0.5">
                                <Calendar className="h-3 w-3" />Since {memberYear}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Name edit */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-white/50">Display Name</label>
                    {editingName ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                value={nameInput}
                                onChange={e => setNameInput(e.target.value)}
                                maxLength={100}
                                className="flex-1 bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500/50"
                                placeholder="Your name"
                                autoFocus
                            />
                            <div className="flex gap-2 sm:flex-shrink-0">
                                <button
                                    onClick={() => patchSettings({ name: nameInput })}
                                    disabled={saving || !nameInput.trim()}
                                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-medium text-white transition-all disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                                </button>
                                <button
                                    onClick={() => { setEditingName(false); setNameInput(settings.name) }}
                                    className="flex-1 sm:flex-initial px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-all whitespace-nowrap"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-3 bg-white/3 border border-white/8 rounded-lg">
                            <span className="text-sm">{settings.name}</span>
                            <button
                                onClick={() => setEditingName(true)}
                                className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors"
                            >
                                <Pencil className="h-3.5 w-3.5" />Edit
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Your User ID ── */}
            <div className="glass rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="font-bold text-sm text-white/50 uppercase tracking-widest flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Your User ID
                        </h2>
                        <p className="text-xs text-white/30 mt-1">
                            Share this ID so others can find and view your public profile from the Leaderboard search.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-white/3 border border-white/10 rounded-xl font-mono">
                    <code className="flex-1 text-sm text-purple-300 break-all">{settings.userId}</code>
                    <button
                        onClick={copyUserId}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex-shrink-0"
                    >
                        {idCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        {idCopied ? 'Copied!' : 'Copy'}
                    </button>
                </div>

                <div className="flex flex-col gap-1.5 text-xs bg-white/3 rounded-lg px-3 py-2.5">
                    <div className="flex items-center gap-1.5 text-white/30">
                        <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>Public profile URL</span>
                    </div>
                    <code className="text-purple-400/70 break-all leading-relaxed pl-0.5">
                        {typeof window !== 'undefined' ? `${window.location.origin}/profile/${settings.userId}` : `/profile/${settings.userId}`}
                    </code>
                </div>
            </div>

            {/* ── Privacy ── */}
            <div className="glass rounded-2xl p-5 sm:p-6 space-y-4">
                <h2 className="font-bold text-sm text-white/50 uppercase tracking-widest flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Privacy
                </h2>

                {/* Profile visibility */}
                <div className="flex items-center justify-between gap-4 p-4 bg-white/3 border border-white/8 rounded-xl">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            {settings.isProfilePublic
                                ? <Globe className="h-4 w-4 text-emerald-400" />
                                : <Lock className="h-4 w-4 text-white/30" />}
                            <p className="font-medium text-sm">Profile Visibility</p>
                        </div>
                        <p className="text-xs text-white/30 mt-0.5">
                            {settings.isProfilePublic
                                ? 'Your profile is visible to all logged-in users. Others can find you by name or User ID.'
                                : 'Your profile is private. Only you can see your stats.'}
                        </p>
                    </div>
                    <button
                        onClick={() => patchSettings({ isProfilePublic: !settings.isProfilePublic })}
                        disabled={saving}
                        className={`relative flex-shrink-0 w-12 h-6 rounded-full border transition-all duration-300 disabled:opacity-50 ${settings.isProfilePublic ? 'bg-emerald-500 border-emerald-400' : 'bg-white/10 border-white/20'}`}
                    >
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${settings.isProfilePublic ? 'left-6' : 'left-0.5'}`} />
                    </button>
                </div>

                <p className="text-xs text-white/20 leading-relaxed px-1">
                    Roadmap visibility is managed individually per-roadmap from the roadmap detail page. Private roadmaps are never shown on your profile or shared via links.
                </p>
            </div>

            {/* ── Sign Out ── */}
            <div className="glass rounded-2xl p-5 sm:p-6">
                <h2 className="font-bold text-sm text-white/50 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <LogOut className="h-4 w-4" />
                    Session
                </h2>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl border border-red-500/25 bg-red-500/8 text-red-400 hover:bg-red-500/15 hover:border-red-500/40 text-sm font-semibold transition-all active:scale-98"
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </button>
            </div>

        </div>
    )
}
