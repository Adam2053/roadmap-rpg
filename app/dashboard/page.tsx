'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Zap, Flame, Trophy, Map, Plus, Clock, ChevronRight, Loader2, Star, Globe, PenLine, UserCheck, HeartHandshake } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import XPBar from '@/components/XPBar'
import { DashboardSkeleton } from '@/components/Skeleton'
import RoadmapTypeModal from '@/components/RoadmapTypeModal'

interface RoadmapSummary {
  _id: string
  goal: string
  title: string
  skillLevel: string
  difficulty: string
  duration: number
  progress: number
  isPublic: boolean
  isCustom: boolean
  starCount: number
  createdAt: string
}

function calcLevel(xp: number) {
  return Math.floor(0.1 * Math.sqrt(xp))
}

function xpToNextLevel(level: number) {
  const nextLevelXP = Math.pow((level + 1) / 0.1, 2)
  const currentLevelXP = Math.pow(level / 0.1, 2)
  return { required: Math.round(nextLevelXP - currentLevelXP), base: Math.round(currentLevelXP) }
}

export default function DashboardPage() {
  const { user, isLoading } = useAuthStore()
  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[]>([])
  const [roadmapsLoading, setRoadmapsLoading] = useState(true)
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [connCounts, setConnCounts] = useState({ followerCount: 0, closeFriendCount: 0 })

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch('/api/roadmap')
        if (res.ok) {
          const { roadmaps } = await res.json()
          setRoadmaps(roadmaps)
        }
      } finally {
        setRoadmapsLoading(false)
      }
    }
    fetch_()

    // Fetch connection counts from settings
    fetch('/api/settings').then(r => r.ok ? r.json() : null).then(d => {
      if (d) setConnCounts({ followerCount: d.followerCount || 0, closeFriendCount: d.closeFriendCount || 0 })
    }).catch(() => { })
  }, [])

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <DashboardSkeleton />
      </div>
    )
  }

  if (!user) return null

  const level = user.level
  const { required: xpRequired, base: xpBase } = xpToNextLevel(level)
  const currentLevelXP = user.totalXP - xpBase
  const progressPct = Math.min(100, (currentLevelXP / xpRequired) * 100)
  const maxCategoryXP = Math.max(1000, user.bodyXP, user.skillsXP, user.mindsetXP, user.careerXP)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Hero greeting */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900/60 via-indigo-900/60 to-purple-900/60 border border-purple-500/20 p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-indigo-600/5" />
        <div className="relative">
          <p className="text-purple-300 text-sm font-medium mb-1">Welcome back, Hero 👋</p>
          <h1 className="text-3xl font-black mb-1">{user.name}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 rounded-full px-4 py-1.5">
              <Trophy className="h-4 w-4 text-yellow-400" />
              <span className="font-bold text-yellow-300">Level {level}</span>
            </div>
            <div className="flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-1.5">
              <Flame className="h-4 w-4 text-orange-400" />
              <span className="font-bold text-orange-300">{user.streak} day streak</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 rounded-full px-4 py-1.5">
              <Zap className="h-4 w-4 text-blue-400" />
              <span className="font-bold text-blue-300">{user.totalXP.toLocaleString()} XP</span>
            </div>
            <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5">
              <UserCheck className="h-4 w-4 text-purple-400" />
              <span className="font-bold text-purple-300">{connCounts.followerCount}</span>
              <span className="text-purple-300/60 text-sm">followers</span>
            </div>
            <div className="flex items-center gap-2 bg-indigo-500/15 border border-indigo-500/25 rounded-full px-4 py-1.5">
              <HeartHandshake className="h-4 w-4 text-indigo-400" />
              <span className="font-bold text-indigo-300">{connCounts.closeFriendCount}</span>
              <span className="text-indigo-300/60 text-sm">/ 10 friends</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total XP', value: user.totalXP.toLocaleString(), icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Current Level', value: level.toString(), icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Mentor Followers', value: connCounts.followerCount.toString(), icon: UserCheck, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: `Close Friends`, value: `${connCounts.closeFriendCount} / 10`, icon: HeartHandshake, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
        ].map(stat => (
          <div key={stat.label} className="glass rounded-2xl p-5">
            <div className={`${stat.bg} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="text-2xl font-black">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Level Progress + Category XP */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Level progress */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              Level Progress
            </h2>
            <span className="text-xs text-muted-foreground">Lv.{level} → Lv.{level + 1}</span>
          </div>
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">{Math.max(0, currentLevelXP).toLocaleString()} XP</span>
              <span className="text-muted-foreground">{xpRequired.toLocaleString()} XP needed</span>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-1000"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {Math.max(0, xpRequired - currentLevelXP).toLocaleString()} XP until next level
          </p>
        </div>

        {/* Category XP */}
        <div className="glass rounded-2xl p-6">
          <h2 className="font-bold text-lg mb-4">Category XP</h2>
          <div className="space-y-4">
            <XPBar label="Body" current={user.bodyXP} max={maxCategoryXP} colorClass="xp-bar-body" icon="💪" />
            <XPBar label="Skills" current={user.skillsXP} max={maxCategoryXP} colorClass="xp-bar-skills" icon="🧠" />
            <XPBar label="Mindset" current={user.mindsetXP} max={maxCategoryXP} colorClass="xp-bar-mindset" icon="✨" />
            <XPBar label="Career" current={user.careerXP} max={maxCategoryXP} colorClass="xp-bar-career" icon="🚀" />
          </div>
        </div>
      </div>

      {/* Active Roadmaps */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-xl">Your Roadmaps</h2>
          <button
            onClick={() => setShowTypeModal(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Roadmap
          </button>
        </div>

        {roadmapsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          </div>
        ) : roadmaps.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Map className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">No roadmaps yet</h3>
            <p className="text-muted-foreground mb-6">Create your first roadmap to begin leveling up.</p>
            <button
              onClick={() => setShowTypeModal(true)}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create First Roadmap
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {roadmaps.map(rm => (
              <Link
                key={rm._id}
                href={`/roadmap/${rm._id}`}
                className="glass rounded-2xl p-5 hover:bg-white/10 transition-all duration-300 group overflow-hidden w-full block"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {rm.isPublic && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400/80 font-medium">
                          <Globe className="h-3 w-3" /> Public
                        </span>
                      )}
                      {rm.isCustom && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-teal-400/80 font-medium">
                          <PenLine className="h-3 w-3" /> Custom
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors break-words">
                      {rm.title || rm.goal}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium whitespace-nowrap ${rm.difficulty === 'hard' ? 'bg-red-500/20 text-red-300' :
                        rm.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-green-500/20 text-green-300'
                        }`}>
                        {rm.difficulty}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        {rm.duration}w
                      </span>
                      {rm.isPublic && (
                        <span className="flex items-center gap-1 text-xs text-yellow-400/80 whitespace-nowrap">
                          <Star className="h-3 w-3 fill-yellow-400/60 text-yellow-400/60" />
                          {rm.starCount || 0}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-purple-400 transition-colors flex-shrink-0" />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{rm.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                      style={{ width: `${rm.progress}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showTypeModal && <RoadmapTypeModal onClose={() => setShowTypeModal(false)} />}
    </div>
  )
}
