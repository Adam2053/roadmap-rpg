'use client'

import { useEffect, useState } from 'react'
import {
    X, ExternalLink, Loader2, BookOpen,
    Youtube, Globe, FileText, Music, Link2
} from 'lucide-react'
import { toast } from 'sonner'

type ResourceType = 'video' | 'audio' | 'website' | 'article' | 'book' | 'other'

interface TaskResource {
    _id: string
    type: ResourceType
    url: string
    label: string
}

interface Props {
    roadmapId: string
    week: number
    weekFocus: string
    onClose: () => void
}

const RESOURCE_TYPES = [
    { type: 'video' as const, label: 'Video', icon: <Youtube className="h-4 w-4" />, color: 'bg-red-500/20    text-red-300    border-red-500/30' },
    { type: 'website' as const, label: 'Website', icon: <Globe className="h-4 w-4" />, color: 'bg-blue-500/20   text-blue-300   border-blue-500/30' },
    { type: 'article' as const, label: 'Article', icon: <FileText className="h-4 w-4" />, color: 'bg-green-500/20  text-green-300  border-green-500/30' },
    { type: 'book' as const, label: 'Book', icon: <BookOpen className="h-4 w-4" />, color: 'bg-amber-500/20  text-amber-300  border-amber-500/30' },
    { type: 'audio' as const, label: 'Audio', icon: <Music className="h-4 w-4" />, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    { type: 'other' as const, label: 'Other', icon: <Link2 className="h-4 w-4" />, color: 'bg-white/10      text-white/70   border-white/10' },
]

function typeConfig(type: ResourceType) {
    return RESOURCE_TYPES.find(r => r.type === type) ?? RESOURCE_TYPES[5]
}

export default function PublicResourceModal({ roadmapId, week, weekFocus, onClose }: Props) {
    const [resources, setResources] = useState<TaskResource[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    useEffect(() => {
        const load = async () => {
            try {
                const params = new URLSearchParams({ roadmapId, week: String(week) })
                const res = await fetch(`/api/public/resources?${params}`)
                if (!res.ok) throw new Error()
                const data = await res.json()
                setResources(data.resources)
            } catch {
                toast.error('Failed to load resources')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [roadmapId, week])

    return (
        <div
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
        >
            <div
                className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(20,20,35,0.98) 0%, rgba(15,15,28,0.98) 100%)' }}
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-white/8">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <BookOpen className="h-4 w-4 text-purple-400 flex-shrink-0" />
                            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                                Module Resources
                            </span>
                            <span className="ml-auto text-xs text-white/30 tabular-nums">
                                {resources.length} resource{resources.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <h2 className="font-bold text-sm leading-snug text-white/90 line-clamp-2">{weekFocus}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="mt-0.5 flex-shrink-0 p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Resource bar */}
                <div className="h-0.5 bg-white/5">
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, (resources.length / 8) * 100)}%` }}
                    />
                </div>

                {/* Body */}
                <div className="p-4 sm:p-5 max-h-[60vh] sm:max-h-[65vh] overflow-y-auto space-y-3">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                        </div>
                    ) : resources.length === 0 ? (
                        <div className="text-center py-10 space-y-2">
                            <div className="text-3xl">📚</div>
                            <p className="text-sm text-white/40">No resources shared for this module yet</p>
                            <p className="text-xs text-white/25">The creator hasn't added any learning resources here</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {resources.map(resource => {
                                const cfg = typeConfig(resource.type)
                                return (
                                    <a
                                        key={resource._id}
                                        href={resource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center gap-3 p-3 rounded-xl border border-white/6 bg-white/3 hover:bg-white/8 hover:border-white/15 transition-all"
                                    >
                                        <span className={`flex-shrink-0 p-1.5 rounded-lg border ${cfg.color}`}>
                                            {cfg.icon}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white/90 truncate group-hover:text-purple-300 transition-colors">{resource.label}</p>
                                            <p className="text-xs text-white/35 truncate">{resource.url}</p>
                                        </div>
                                        <ExternalLink className="h-3.5 w-3.5 text-white/20 group-hover:text-purple-400 flex-shrink-0 transition-colors" />
                                    </a>
                                )
                            })}
                        </div>
                    )}

                    {/* Read-only notice */}
                    {resources.length > 0 && (
                        <p className="text-center text-[10px] text-white/20 pt-1">
                            Resources curated by the roadmap creator · Read-only view
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
