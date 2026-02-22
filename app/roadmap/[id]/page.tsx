'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronDown, ChevronUp, CheckCircle2, Circle, Zap,
  RefreshCw, ArrowLeft, Loader2, Trophy, Clock,
  BookOpen, MessageSquare, ArrowRight, Trash2,
  Globe, Lock, Copy, Check
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import { RoadmapWeek, RoadmapTask } from '@/lib/gemini'
import CategoryBadge from '@/components/CategoryBadge'
import { RoadmapSkeleton } from '@/components/Skeleton'
import ResourceModal from '@/components/ResourceModal'
import DeleteRoadmapModal from '@/components/DeleteRoadmapModal'
import PublicResourceModal from '@/components/PublicResourceModal'
import StarButton from '@/components/StarButton'

/* ─── Types ─────────────────────────────────────────────── */
interface TaskProgressMap { [key: string]: boolean }

// Keyed by week number
interface WeekResourceCounts { [week: number]: number }

interface RoadmapData {
  _id: string
  goal: string
  title: string
  skillLevel: string
  difficulty: string
  duration: number
  weeklyPlan: RoadmapWeek[]
  progress: number
  isPublic: boolean
  isCustom: boolean
  starCount: number
}

interface StarInfo {
  starred: boolean
  starCount: number
  isOwner: boolean
}

interface ActiveResourceModal {
  week: number
  weekFocus: string
}

interface PublicCreator {
  name: string
  level: number
  userId: string
}

function taskKey(week: number, day: string, title: string) {
  return `${week}__${day}__${title}`
}

/* ─── Component ──────────────────────────────────────────── */
export default function RoadmapViewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, updateXP, setUser } = useAuthStore()

  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null)
  // Public (non-owner) view
  const [publicRoadmap, setPublicRoadmap] = useState<RoadmapData | null>(null)
  const [publicCreator, setPublicCreator] = useState<PublicCreator | null>(null)
  const [completedTasks, setCompletedTasks] = useState<TaskProgressMap>({})
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]))
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [pendingTasks, setPendingTasks] = useState<Set<string>>(new Set())
  const [activeResourceModal, setActiveResourceModal] = useState<ActiveResourceModal | null>(null)
  const [weekResourceCounts, setWeekResourceCounts] = useState<WeekResourceCounts>({})
  const [showPrompt, setShowPrompt] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [visibilityLoading, setVisibilityLoading] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  // Star state
  const [starInfo, setStarInfo] = useState<StarInfo | null>(null)
  // Public view extras
  const [publicWeekResourceCounts, setPublicWeekResourceCounts] = useState<WeekResourceCounts>({})
  const [activePublicResourceModal, setActivePublicResourceModal] = useState<{ week: number; focus: string } | null>(null)

  /* ── Fetch resource counts for all weeks (one shot) ────── */
  const fetchWeekCounts = useCallback(async (roadmapId: string) => {
    try {
      const params = new URLSearchParams({ roadmapId, countsOnly: 'true' })
      const res = await fetch(`/api/tasks/resources?${params}`)
      if (!res.ok) return
      const { weekCounts } = await res.json()
      setWeekResourceCounts(weekCounts || {})
    } catch {
      // non-fatal
    }
  }, [])

  /* ── Fetch roadmap (owner first, public API fallback) ─── */
  const fetchRoadmap = useCallback(async () => {
    // 1️⃣ Try owner API
    try {
      const res = await fetch(`/api/roadmap/${id}`)
      if (res.ok) {
        const { roadmap, taskProgress } = await res.json()
        setRoadmap(roadmap)
        setIsPublic(roadmap.isPublic ?? false)
        const progressMap: TaskProgressMap = {}
        for (const tp of taskProgress) {
          if (tp.completed) progressMap[taskKey(tp.week, tp.day, tp.taskTitle)] = true
        }
        setCompletedTasks(progressMap)
        fetchWeekCounts(roadmap._id)
        setLoading(false)
        return
      }
    } catch {
      // fall through to public API
    }
    // 2️⃣ Try public API (no auth needed, only works if isPublic)
    try {
      const res = await fetch(`/api/public/roadmap/${id}`)
      if (res.ok) {
        const data = await res.json()
        setPublicRoadmap(data.roadmap)
        setPublicCreator(data.creator)
        // Star info bundled in public API response
        if (data.starInfo) setStarInfo(data.starInfo)
        setLoading(false)
        return
      }
    } catch {
      // both failed
    }
    toast.error('Roadmap not found or is private')
    router.push('/dashboard')
    setLoading(false)
  }, [id, router, fetchWeekCounts])

  useEffect(() => { fetchRoadmap() }, [fetchRoadmap])

  /* ── Fetch star info for owner view of a public roadmap ─── */
  useEffect(() => {
    if (!roadmap) return
    const fetchStars = async () => {
      try {
        const res = await fetch(`/api/roadmap/${roadmap._id}/star`)
        if (res.ok) {
          const data = await res.json()
          setStarInfo(data)
        }
      } catch { /* non-fatal */ }
    }
    fetchStars()
  }, [roadmap])

  /* ── Fetch resource counts for public roadmap view ─────── */
  useEffect(() => {
    if (!publicRoadmap) return
    const load = async () => {
      try {
        const params = new URLSearchParams({ roadmapId: publicRoadmap._id, countsOnly: 'true' })
        const res = await fetch(`/api/public/resources?${params}`)
        if (res.ok) {
          const data = await res.json()
          setPublicWeekResourceCounts(data.weekCounts || {})
        }
      } catch { /* non-fatal */ }
    }
    load()
  }, [publicRoadmap])

  /* ── Toggle task ────────────────────────────────────────── */
  const toggleTask = async (week: number, day: string, task: RoadmapTask) => {
    const key = taskKey(week, day, task.title)
    const wasCompleted = completedTasks[key] || false
    const newCompleted = !wasCompleted
    if (pendingTasks.has(key)) return

    setCompletedTasks(prev => ({ ...prev, [key]: newCompleted }))
    setPendingTasks(prev => new Set(prev).add(key))

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roadmapId: id, week, day, taskTitle: task.title, completed: newCompleted }),
      })
      const json = await res.json()
      if (!res.ok) {
        setCompletedTasks(prev => ({ ...prev, [key]: wasCompleted }))
        toast.error(json.error || 'Failed to update task')
        return
      }
      if (json.xpDelta !== 0 || json.customXpDelta !== 0) {
        updateXP(json.xpDelta, task.category, json.newLevel, json.newStreak, json.newTotalXP)
        setRoadmap(prev => prev ? { ...prev, progress: json.roadmapProgress } : prev)
        if (newCompleted) {
          if (json.isCustomRoadmap) {
            // Custom roadmap — XP goes to personal pool, not leaderboard
            toast.success(`+${task.xp} Custom XP earned! 📝 (personal only)`)
          } else {
            toast.success(`+${task.xp} XP earned! ${task.category === 'Body' ? '💪' : task.category === 'Skills' ? '🧠' : task.category === 'Mindset' ? '✨' : '🚀'}`)
            if (json.newLevel > (user?.level || 0)) {
              toast.success(`🎉 Level Up! You're now Level ${json.newLevel}!`, { duration: 5000 })
            }
          }
        }
      }
    } catch {
      setCompletedTasks(prev => ({ ...prev, [key]: wasCompleted }))
      toast.error('Network error')
    } finally {
      setPendingTasks(prev => { const s = new Set(prev); s.delete(key); return s })
    }
  }

  /* ── Regenerate ─────────────────────────────────────────── */
  const regenerate = async () => {
    if (!confirm('Regenerate this roadmap? Your progress will be reset.')) return
    setRegenerating(true)
    try {
      const res = await fetch(`/api/roadmap/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty: roadmap?.difficulty, hoursPerDay: 1, skillLevel: 'beginner' }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error || 'Failed to regenerate'); return }
      setRoadmap(json.roadmap)
      setCompletedTasks({})
      setExpandedWeeks(new Set([1]))
      setWeekResourceCounts({})
      toast.success('Roadmap regenerated! ✨')
    } catch {
      toast.error('Network error')
    } finally {
      setRegenerating(false)
    }
  }

  /* ── Delete ─────────────────────────────────────────────── */
  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/roadmap/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error || 'Failed to delete roadmap'); return }
      if (user) {
        setUser({
          ...user, totalXP: json.newTotalXP, level: json.newLevel,
          bodyXP: json.newBodyXP, skillsXP: json.newSkillsXP,
          mindsetXP: json.newMindsetXP, careerXP: json.newCareerXP
        })
      }
      json.xpDeducted > 0
        ? toast.error(`Roadmap deleted — ${json.xpDeducted.toLocaleString()} XP deducted 📉`, { duration: 5000 })
        : toast.success('Roadmap deleted')
      router.push('/dashboard')
    } catch {
      toast.error('Network error — could not delete roadmap')
      throw new Error('delete failed')
    }
  }

  /* ── Toggle visibility ─────────────────────────────────── */
  const toggleVisibility = async () => {
    if (!roadmap) return
    setVisibilityLoading(true)
    const newVal = !isPublic
    try {
      const res = await fetch(`/api/roadmap/${roadmap._id}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: newVal }),
      })
      if (!res.ok) { toast.error('Failed to update visibility'); return }
      setIsPublic(newVal)
      toast.success(newVal ? '🌐 Roadmap is now public' : '🔒 Roadmap is now private')
    } catch {
      toast.error('Network error')
    } finally {
      setVisibilityLoading(false)
    }
  }

  /* ── Copy share link ────────────────────────────────────── */
  const copyShareLink = () => {
    if (!roadmap) return
    const url = `${window.location.origin}/roadmap/${roadmap._id}`

    // navigator.clipboard requires HTTPS or localhost — use a robust fallback
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(() => {
        setLinkCopied(true)
        toast.success('Link copied to clipboard!')
        setTimeout(() => setLinkCopied(false), 2000)
      }).catch(() => {
        fallbackCopy(url)
      })
    } else {
      fallbackCopy(url)
    }
  }

  const fallbackCopy = (text: string) => {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    try {
      document.execCommand('copy')
      setLinkCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      // Last resort — show the URL so the user can copy it manually
      toast.info(`Share link: ${text}`, { duration: 8000 })
    } finally {
      document.body.removeChild(ta)
    }
  }

  const toggleWeek = (w: number) => setExpandedWeeks(prev => { const s = new Set(prev); s.has(w) ? s.delete(w) : s.add(w); return s })
  const toggleDay = (k: string) => setExpandedDays(prev => { const s = new Set(prev); s.has(k) ? s.delete(k) : s.add(k); return s })

  /* ── Guards ─────────────────────────────────────────────── */
  if (loading) return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6">
      <RoadmapSkeleton />
    </div>
  )
  if (!roadmap && !publicRoadmap) return null

  /* ── Public / Visitor read-only view ─────────────────── */
  if (publicRoadmap) {
    const totalPubTasks = publicRoadmap.weeklyPlan.reduce((a, w) => a + w.days.reduce((b, d) => b + d.tasks.length, 0), 0)
    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-4 sm:space-y-6">
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" />Back
        </button>

        {/* Creator badge */}
        {publicCreator && (
          <div className="flex items-center gap-3 glass rounded-xl border border-white/10 px-4 py-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500/40 to-indigo-500/40 border border-purple-500/30 flex items-center justify-center text-sm font-black text-purple-200 flex-shrink-0">
              {publicCreator.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-white/30 uppercase tracking-widest">Created by</p>
              <p className="text-sm font-semibold leading-tight">{publicCreator.name}
                <span className="ml-2 text-xs font-normal text-yellow-400">Lv.{publicCreator.level}</span>
              </p>
            </div>
            <Link href={`/profile/${publicCreator.userId}`}
              className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors border border-purple-500/25 rounded-lg px-2.5 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 whitespace-nowrap">
              View Profile
            </Link>
          </div>
        )}

        {/* Header */}
        <div className="glass rounded-2xl gradient-border overflow-hidden">
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-md font-semibold border whitespace-nowrap ${publicRoadmap.difficulty === 'hard' ? 'bg-red-500/20 text-red-300 border-red-500/25' : publicRoadmap.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/25' : 'bg-green-500/20 text-green-300 border-green-500/25'}`}>
                {publicRoadmap.difficulty === 'easy' ? '🌱 Easy' : publicRoadmap.difficulty === 'medium' ? '⚔️ Medium' : '🔥 Hard'}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                <Clock className="h-3 w-3" />{publicRoadmap.duration}w
              </span>
              {publicRoadmap.isCustom && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-semibold border bg-teal-500/15 text-teal-300 border-teal-500/25 whitespace-nowrap">
                  ✍️ Custom
                </span>
              )}
              <span className="ml-auto flex items-center gap-1.5 text-xs bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 rounded-full px-2.5 py-1">
                <Globe className="h-3.5 w-3.5" />Public Roadmap
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black leading-tight">{publicRoadmap.title || publicRoadmap.goal}</h1>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-semibold">{publicRoadmap.progress}%</span>
              </div>
              <div className="h-2 sm:h-2.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${publicRoadmap.progress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">{totalPubTasks} tasks across {publicRoadmap.weeklyPlan.length} weeks</p>
            </div>

            {/* Star action row */}
            <div className="border-t border-white/6 pt-3 flex items-center gap-3">
              {starInfo !== null && (
                <StarButton
                  roadmapId={publicRoadmap._id}
                  initialStarred={starInfo.starred}
                  initialCount={starInfo.starCount}
                  isOwner={starInfo.isOwner}
                  isPublic={true}
                  size="md"
                  showLabel={true}
                />
              )}
              {!starInfo && (
                <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 bg-white/5 border border-white/8 text-white/30 text-xs">
                  ⭐ Loading…
                </div>
              )}
              <span className="text-xs text-white/25">
                {starInfo?.isOwner ? 'Community stars received' : 'Star this roadmap to help others discover it'}
              </span>
            </div>
          </div>
        </div>

        {/* Weekly Plan — read only */}
        <div className="space-y-2 sm:space-y-3">
          {publicRoadmap.weeklyPlan.map(week => {
            const isExp = expandedWeeks.has(week.week)
            return (
              <div key={week.week} className="glass rounded-2xl overflow-hidden">
                <div className="p-3 sm:p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-purple-300 font-bold text-xs sm:text-sm">{week.week}</span>
                    </div>
                    <button onClick={() => toggleWeek(week.week)} className="flex-1 min-w-0 text-left">
                      <h3 className="font-bold text-sm sm:text-base leading-snug break-words">{week.focus}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug break-words">{week.milestone}</p>
                    </button>
                    <button onClick={() => toggleWeek(week.week)} className="flex-shrink-0">
                      {isExp ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    {/* Resources button */}
                    <button
                      onClick={() => setActivePublicResourceModal({ week: week.week, focus: week.focus })}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-purple-500/15 hover:border-purple-500/30 hover:text-purple-300 text-white/40 transition-all flex-shrink-0"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      {publicWeekResourceCounts[week.week] ? (
                        <span>{publicWeekResourceCounts[week.week]}</span>
                      ) : null}
                    </button>
                  </div>
                </div>
                {isExp && (
                  <div className="border-t border-white/5 divide-y divide-white/5">
                    {week.days.map((dayData: RoadmapWeek['days'][number]) => {
                      if (dayData.tasks.length === 0) return null
                      const dk = `pub-${week.week}-${dayData.day}`
                      const isDayExp = expandedDays.has(dk)
                      return (
                        <div key={dayData.day}>
                          <button onClick={() => toggleDay(dk)}
                            className="w-full flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 hover:bg-white/5 transition-colors text-left gap-2">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                              <span className="text-xs sm:text-sm font-semibold text-purple-300 flex-shrink-0">{dayData.day}</span>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">{dayData.tasks.length} tasks</span>
                            </div>
                            {isDayExp ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                          </button>
                          {isDayExp && (
                            <div className="px-3 sm:px-5 pb-3 sm:pb-4 space-y-2 sm:space-y-3">
                              {dayData.tasks.map((task: RoadmapTask) => (
                                <div key={task.title} className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl border bg-white/3 border-white/5">
                                  <Circle className="h-5 w-5 text-white/20 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-start gap-x-2 gap-y-1 mb-1">
                                      <h4 className="font-semibold text-sm leading-snug">{task.title}</h4>
                                      <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
                                        <CategoryBadge category={task.category} />
                                        <span className="flex items-center gap-0.5 text-xs font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-md px-1.5 py-0.5 whitespace-nowrap">
                                          <Zap className="h-3 w-3" />{task.xp}
                                        </span>
                                      </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{task.description}</p>
                                    <span className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-2 whitespace-nowrap">
                                      <Clock className="h-3 w-3" />{task.duration_minutes} min
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Public Resource Modal */}
        {activePublicResourceModal && (
          <PublicResourceModal
            roadmapId={publicRoadmap._id}
            week={activePublicResourceModal.week}
            weekFocus={activePublicResourceModal.focus}
            onClose={() => setActivePublicResourceModal(null)}
          />
        )}
      </div>
    )
  }

  // From here on — owner view only (roadmap is guaranteed non-null)
  if (!roadmap) return null

  const totalTasks = roadmap.weeklyPlan.reduce((a, w) => a + w.days.reduce((b, d) => b + d.tasks.length, 0), 0)
  const completedCount = Object.values(completedTasks).filter(Boolean).length
  const xpAtRisk = roadmap.weeklyPlan.reduce((total, week) =>
    total + week.days.reduce((wt, day) =>
      wt + day.tasks.reduce((dt, task) =>
        dt + (completedTasks[taskKey(week.week, day.day, task.title)] ? task.xp : 0), 0), 0), 0)

  /* ── Skill level badge helper ───────────────────────────── */
  const skillLevel = roadmap.skillLevel || 'beginner'
  const skillLevels = ['beginner', 'intermediate', 'advanced'] as const
  const skillIdx = skillLevels.indexOf(skillLevel as typeof skillLevels[number])
  const nextSkill = skillLevels[skillIdx + 1]
  const skillIcons: Record<string, string> = { beginner: '🌱', intermediate: '⚔️', advanced: '🏆' }
  const skillColors: Record<string, string> = {
    beginner: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    intermediate: 'bg-blue-500/15    text-blue-300    border-blue-500/25',
    advanced: 'bg-purple-500/15  text-purple-300  border-purple-500/25',
  }

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-4 sm:space-y-6">

      {/* ── Back nav ── */}
      <button
        onClick={() => router.push('/dashboard')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      {/* ── Header card ── */}
      <div className="glass rounded-2xl gradient-border overflow-hidden">
        <div className="p-4 sm:p-6 space-y-4">

          {/* Row 1 — badges + action buttons */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-md font-semibold whitespace-nowrap ${roadmap.difficulty === 'hard' ? 'bg-red-500/20    text-red-300    border border-red-500/25' :
                roadmap.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/25' :
                  'bg-green-500/20  text-green-300  border border-green-500/25'
                }`}>
                {roadmap.difficulty === 'easy' ? '🌱 Easy' : roadmap.difficulty === 'medium' ? '⚔️ Medium' : '🔥 Hard'}
              </span>

              {roadmap.isCustom && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-semibold border bg-emerald-500/15 text-emerald-300 border-emerald-500/25 whitespace-nowrap">
                  ✍️ Custom
                </span>
              )}

              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-semibold border whitespace-nowrap ${skillColors[skillLevel]}`}>
                {skillIcons[skillLevel]}{' '}
                <span>{skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1)}</span>
                {nextSkill && (
                  <>
                    <ArrowRight className="h-3 w-3 opacity-40 flex-shrink-0" />
                    <span className={`opacity-50 ${skillColors[nextSkill].split(' ')[1]} hidden sm:inline`}>
                      {nextSkill.charAt(0).toUpperCase() + nextSkill.slice(1)}
                    </span>
                  </>
                )}
              </span>

              <span className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                <Clock className="h-3 w-3" />
                {roadmap.duration}w
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={regenerate}
                disabled={regenerating}
                title="Regenerate roadmap"
                className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 sm:px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-50"
              >
                {regenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                <span className="hidden sm:inline">Regenerate</span>
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                title="Delete roadmap"
                className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 px-2.5 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          </div>

          {/* Row 2 — Title */}
          <h1 className="text-xl sm:text-2xl font-black leading-tight">
            {roadmap.title || roadmap.goal}
          </h1>

          {/* Row 3 — Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-semibold">{roadmap.progress}%</span>
            </div>
            <div className="h-2 sm:h-2.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${roadmap.progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{completedCount}/{totalTasks} tasks completed</p>
          </div>

          {/* Row 4 — Visibility toggle + share link + stars */}
          <div className="border-t border-white/6 pt-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={toggleVisibility}
                disabled={visibilityLoading}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:opacity-50 ${isPublic
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                  : 'bg-white/5 border-white/12 text-white/40 hover:text-white/70 hover:bg-white/10'
                  }`}
              >
                {visibilityLoading
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : isPublic
                    ? <Globe className="h-3.5 w-3.5" />
                    : <Lock className="h-3.5 w-3.5" />
                }
                {isPublic ? 'Public' : 'Private'}
              </button>

              <div className="flex items-center gap-2">
                {/* Star count (owner view — display-only) */}
                {isPublic && starInfo && (
                  <StarButton
                    roadmapId={roadmap._id}
                    initialStarred={starInfo.starred}
                    initialCount={starInfo.starCount}
                    isOwner={true}
                    isPublic={isPublic}
                    size="sm"
                    showLabel={true}
                  />
                )}

                {isPublic && (
                  <button
                    onClick={copyShareLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-all"
                  >
                    {linkCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {linkCopied ? 'Copied!' : 'Copy share link'}
                  </button>
                )}
              </div>
            </div>
            {isPublic && (
              <p className="mt-2 text-[10px] text-white/25 leading-relaxed">
                This roadmap is visible on your public profile and can be shared via link.
              </p>
            )}
          </div>

          {/* Row 5 — View Prompt toggle */}
          <div className="border-t border-white/6 pt-3">
            <button
              onClick={() => setShowPrompt(p => !p)}
              className="flex items-center gap-2 text-xs text-white/35 hover:text-white/65 transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {showPrompt ? 'Hide' : 'View'} original prompt
              {showPrompt ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {showPrompt && (
              <p className="mt-2 text-xs text-white/50 bg-white/3 border border-white/6 rounded-xl px-3 py-2.5 leading-relaxed italic break-words">
                &ldquo;{roadmap.goal}&rdquo;
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Weekly Plan ── */}
      <div className="space-y-2 sm:space-y-3">
        {roadmap.weeklyPlan.map(week => {
          const weekCompleted = week.days.reduce((a, d) => a + d.tasks.filter(t => completedTasks[taskKey(week.week, d.day, t.title)]).length, 0)
          const weekTotal = week.days.reduce((a, d) => a + d.tasks.length, 0)
          const weekPct = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0
          const isExpanded = expandedWeeks.has(week.week)
          const weekResCount = weekResourceCounts[week.week] || 0

          return (
            <div key={week.week} className="glass rounded-2xl overflow-hidden">

              {/* Week header */}
              <div className="p-3 sm:p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-start gap-3">

                  {/* Week number badge */}
                  <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-300 font-bold text-xs sm:text-sm">{week.week}</span>
                  </div>

                  {/* Focus + milestone — clickable to expand */}
                  <button
                    onClick={() => toggleWeek(week.week)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-start gap-1.5">
                      <h3 className="font-bold text-sm sm:text-base leading-snug break-words">{week.focus}</h3>
                      {weekPct === 100 && <Trophy className="h-3.5 w-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug break-words">{week.milestone}</p>
                  </button>

                  {/* Right side: progress % + Resources + chevron */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs font-semibold text-purple-300 tabular-nums hidden xs:inline">
                      {weekPct}%
                    </span>

                    {/* ── Per-module Resources button ── */}
                    <button
                      onClick={() => setActiveResourceModal({ week: week.week, weekFocus: week.focus })}
                      title="Module resources"
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-indigo-500/25 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all whitespace-nowrap"
                    >
                      <BookOpen className="h-3 w-3" />
                      <span className="hidden sm:inline">Resources</span>
                      {weekResCount > 0 && (
                        <span className="bg-indigo-500/30 text-indigo-200 rounded-full px-1.5 py-px text-[10px] font-bold leading-none">
                          {weekResCount}
                        </span>
                      )}
                    </button>

                    <button onClick={() => toggleWeek(week.week)}>
                      {isExpanded
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      }
                    </button>
                  </div>
                </div>
              </div>

              {/* Week content */}
              {isExpanded && (
                <div className="border-t border-white/5 divide-y divide-white/5">
                  {week.days.map(dayData => {
                    if (dayData.tasks.length === 0) return null
                    const dayKey = `${week.week}-${dayData.day}`
                    const isDayExpanded = expandedDays.has(dayKey)
                    const dayCompleted = dayData.tasks.filter(t => completedTasks[taskKey(week.week, dayData.day, t.title)]).length

                    return (
                      <div key={dayData.day}>
                        {/* Day row */}
                        <button
                          onClick={() => toggleDay(dayKey)}
                          className="w-full flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 hover:bg-white/5 transition-colors text-left gap-2"
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <span className="text-xs sm:text-sm font-semibold text-purple-300 flex-shrink-0">
                              {dayData.day}
                            </span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {dayCompleted}/{dayData.tasks.length}
                              <span className="hidden sm:inline"> tasks</span>
                            </span>
                          </div>
                          {isDayExpanded
                            ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          }
                        </button>

                        {/* Task list */}
                        {isDayExpanded && (
                          <div className="px-3 sm:px-5 pb-3 sm:pb-4 space-y-2 sm:space-y-3">
                            {dayData.tasks.map(task => {
                              const key = taskKey(week.week, dayData.day, task.title)
                              const isCompleted = completedTasks[key] || false
                              const isPending = pendingTasks.has(key)

                              return (
                                <div
                                  key={task.title}
                                  className={`flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl border transition-all duration-200 ${isCompleted
                                    ? 'bg-purple-500/10 border-purple-500/20'
                                    : 'bg-white/3 border-white/5 hover:bg-white/5 hover:border-white/10'
                                    }`}
                                >
                                  {/* Checkbox */}
                                  <button
                                    onClick={() => toggleTask(week.week, dayData.day, task)}
                                    disabled={isPending}
                                    className="mt-0.5 flex-shrink-0 disabled:opacity-50"
                                  >
                                    {isPending ? <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
                                      : isCompleted ? <CheckCircle2 className="h-5 w-5 text-purple-400" />
                                        : <Circle className="h-5 w-5 text-muted-foreground hover:text-purple-400 transition-colors" />}
                                  </button>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-start gap-x-2 gap-y-1 mb-1">
                                      <h4 className={`font-semibold text-sm leading-snug ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                        {task.title}
                                      </h4>
                                      <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
                                        <CategoryBadge category={task.category} />
                                        <span className="flex items-center gap-0.5 text-xs font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-md px-1.5 py-0.5 whitespace-nowrap">
                                          <Zap className="h-3 w-3" />
                                          {task.xp}
                                        </span>
                                      </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{task.description}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="text-xs text-muted-foreground inline-flex items-center gap-1 whitespace-nowrap">
                                        <Clock className="h-3 w-3" />
                                        {task.duration_minutes} min
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Resource Modal (per-module) ── */}
      {activeResourceModal && roadmap && (
        <ResourceModal
          roadmapId={roadmap._id}
          week={activeResourceModal.week}
          weekFocus={activeResourceModal.weekFocus}
          onClose={() => {
            // Refresh the count for this week after modal closes
            const closedWeek = activeResourceModal.week
            const params = new URLSearchParams({ roadmapId: roadmap._id, countsOnly: 'true' })
            fetch(`/api/tasks/resources?${params}`)
              .then(r => r.json())
              .then(data => { setWeekResourceCounts(data.weekCounts || {}) })
              .catch(() => { })
            setActiveResourceModal(null)
          }}
        />
      )}

      {/* ── Delete Modal ── */}
      {showDeleteModal && roadmap && (
        <DeleteRoadmapModal
          roadmapTitle={roadmap.title || roadmap.goal}
          xpAtRisk={xpAtRisk}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  )
}
