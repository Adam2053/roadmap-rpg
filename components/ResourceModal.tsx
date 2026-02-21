'use client'

import { useEffect, useState, useRef } from 'react'
import {
    X, Plus, Trash2, ExternalLink, Loader2,
    Youtube, Globe, FileText, BookOpen, Music, Link2,
} from 'lucide-react'
import { toast } from 'sonner'

export type ResourceType = 'video' | 'audio' | 'website' | 'article' | 'book' | 'other'

export interface TaskResource {
    _id: string
    type: ResourceType
    url: string
    label: string
    createdAt: string
}

interface Props {
    roadmapId: string
    week: number
    weekFocus: string   // e.g. "Module 3: CSS Layouts & Responsive Design"
    onClose: () => void
}

const RESOURCE_TYPES: { type: ResourceType; label: string; icon: React.ReactNode; color: string }[] = [
    { type: 'video', label: 'Video', icon: <Youtube className="h-4 w-4" />, color: 'bg-red-500/20    text-red-300    border-red-500/30' },
    { type: 'website', label: 'Website', icon: <Globe className="h-4 w-4" />, color: 'bg-blue-500/20   text-blue-300   border-blue-500/30' },
    { type: 'article', label: 'Article', icon: <FileText className="h-4 w-4" />, color: 'bg-green-500/20  text-green-300  border-green-500/30' },
    { type: 'book', label: 'Book', icon: <BookOpen className="h-4 w-4" />, color: 'bg-amber-500/20  text-amber-300  border-amber-500/30' },
    { type: 'audio', label: 'Audio', icon: <Music className="h-4 w-4" />, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    { type: 'other', label: 'Other', icon: <Link2 className="h-4 w-4" />, color: 'bg-white/10      text-white/70   border-white/10' },
]

const MAX_RESOURCES = 8

function typeConfig(type: ResourceType) {
    return RESOURCE_TYPES.find(r => r.type === type) ?? RESOURCE_TYPES[5]
}

export default function ResourceModal({ roadmapId, week, weekFocus, onClose }: Props) {
    const [resources, setResources] = useState<TaskResource[]>([])
    const [loading, setLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [selectedType, setSelectedType] = useState<ResourceType>('video')
    const [url, setUrl] = useState('')
    const [label, setLabel] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const overlayRef = useRef<HTMLDivElement>(null)

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    // Fetch module resources
    useEffect(() => {
        const fetch_ = async () => {
            try {
                const params = new URLSearchParams({ roadmapId, week: String(week) })
                const res = await fetch(`/api/tasks/resources?${params}`)
                if (!res.ok) throw new Error()
                const data = await res.json()
                setResources(data.resources)
            } catch {
                toast.error('Failed to load resources')
            } finally {
                setLoading(false)
            }
        }
        fetch_()
    }, [roadmapId, week])

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!url.trim() || !label.trim()) return
        setSubmitting(true)
        try {
            const res = await fetch('/api/tasks/resources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roadmapId, week, type: selectedType, url: url.trim(), label: label.trim() }),
            })
            const data = await res.json()
            if (!res.ok) { toast.error(data.error || 'Failed to add resource'); return }
            setResources(prev => [...prev, data.resource])
            setUrl(''); setLabel(''); setShowForm(false)
            toast.success('Resource added!')
        } catch {
            toast.error('Network error')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (resourceId: string) => {
        setDeletingId(resourceId)
        try {
            const res = await fetch(`/api/tasks/resources/${resourceId}`, { method: 'DELETE' })
            if (!res.ok) { toast.error('Failed to delete resource'); return }
            setResources(prev => prev.filter(r => r._id !== resourceId))
            toast.success('Resource removed')
        } catch {
            toast.error('Network error')
        } finally {
            setDeletingId(null)
        }
    }

    const canAdd = resources.length < MAX_RESOURCES

    return (
        <div
            ref={overlayRef}
            onClick={e => { if (e.target === overlayRef.current) onClose() }}
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
                            {/* Slot counter */}
                            <span className="ml-auto text-xs text-white/30 tabular-nums">
                                {resources.length}/{MAX_RESOURCES}
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

                {/* Slot progress bar */}
                <div className="h-0.5 bg-white/5">
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                        style={{ width: `${(resources.length / MAX_RESOURCES) * 100}%` }}
                    />
                </div>

                {/* Body */}
                <div className="p-4 sm:p-5 space-y-3 max-h-[60vh] sm:max-h-[65vh] overflow-y-auto">
                    {/* Resource list */}
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                        </div>
                    ) : resources.length === 0 && !showForm ? (
                        <div className="text-center py-8 space-y-2">
                            <div className="text-3xl">📚</div>
                            <p className="text-sm text-white/40">No resources yet for this module</p>
                            <p className="text-xs text-white/25">Add videos, websites, articles, books and more</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {resources.map(resource => {
                                const cfg = typeConfig(resource.type)
                                const isDeleting = deletingId === resource._id
                                return (
                                    <div
                                        key={resource._id}
                                        className="group flex items-center gap-3 p-3 rounded-xl border border-white/6 bg-white/3 hover:bg-white/5 hover:border-white/10 transition-all"
                                    >
                                        <span className={`flex-shrink-0 p-1.5 rounded-lg border ${cfg.color}`}>
                                            {cfg.icon}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white/90 truncate">{resource.label}</p>
                                            <p className="text-xs text-white/35 truncate">{resource.url}</p>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <a
                                                href={resource.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/80 transition-all"
                                                title="Open link"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </a>
                                            <button
                                                onClick={() => handleDelete(resource._id)}
                                                disabled={isDeleting}
                                                className="p-1.5 rounded-lg hover:bg-red-500/15 text-white/20 hover:text-red-400 transition-all disabled:opacity-50"
                                                title="Remove resource"
                                            >
                                                {isDeleting
                                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    : <Trash2 className="h-3.5 w-3.5" />
                                                }
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Add form */}
                    {showForm && (
                        <form onSubmit={handleAdd} className="space-y-3 p-4 rounded-xl border border-purple-500/20 bg-purple-500/5">
                            <p className="text-xs font-semibold text-purple-300">New Resource</p>

                            {/* Type selector */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                {RESOURCE_TYPES.map(({ type, label: lbl, icon, color }) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setSelectedType(type)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${selectedType === type
                                                ? color + ' ring-1 ring-current'
                                                : 'bg-white/3 border-white/8 text-white/40 hover:bg-white/6 hover:text-white/60'
                                            }`}
                                    >
                                        {icon}{lbl}
                                    </button>
                                ))}
                            </div>

                            {/* Label */}
                            <div>
                                <label className="text-xs text-white/40 mb-1 block">Label *</label>
                                <input
                                    type="text"
                                    value={label}
                                    onChange={e => setLabel(e.target.value)}
                                    placeholder="e.g. CSS Tricks – Complete Flexbox Guide"
                                    maxLength={200}
                                    required
                                    autoFocus
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
                                />
                            </div>

                            {/* URL */}
                            <div>
                                <label className="text-xs text-white/40 mb-1 block">URL *</label>
                                <input
                                    type="url"
                                    value={url}
                                    onChange={e => setUrl(e.target.value)}
                                    placeholder="https://..."
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-2 pt-1">
                                <button
                                    type="submit"
                                    disabled={submitting || !url.trim() || !label.trim()}
                                    className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2 rounded-lg transition-all"
                                >
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                    Save Resource
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); setUrl(''); setLabel('') }}
                                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer — Add button */}
                {!showForm && (
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                        {canAdd ? (
                            <button
                                onClick={() => setShowForm(true)}
                                className="w-full flex items-center justify-center gap-2 border border-dashed border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/5 text-purple-400/70 hover:text-purple-300 text-sm font-medium py-2.5 rounded-xl transition-all"
                            >
                                <Plus className="h-4 w-4" />
                                Add Resource
                            </button>
                        ) : (
                            <p className="text-center text-xs text-white/25 py-2">
                                Maximum {MAX_RESOURCES} resources reached. Remove one to add another.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
