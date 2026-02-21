'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Trash2, Loader2, X } from 'lucide-react'

interface Props {
    roadmapTitle: string
    xpAtRisk: number
    onConfirm: () => Promise<void>
    onCancel: () => void
}

export default function DeleteRoadmapModal({ roadmapTitle, xpAtRisk, onConfirm, onCancel }: Props) {
    const [deleting, setDeleting] = useState(false)
    const overlayRef = useRef<HTMLDivElement>(null)

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !deleting) onCancel() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onCancel, deleting])

    const handleConfirm = async () => {
        setDeleting(true)
        try {
            await onConfirm()
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div
            ref={overlayRef}
            onClick={e => { if (e.target === overlayRef.current && !deleting) onCancel() }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        >
            <div
                className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-red-500/20 shadow-2xl overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(20,10,10,0.99) 0%, rgba(15,8,8,0.99) 100%)' }}
            >
                {/* Red accent bar at top */}
                <div className="h-1 w-full bg-gradient-to-r from-red-600 via-red-500 to-orange-500" />

                <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="h-5 w-5 text-red-400" />
                            </div>
                            <div>
                                <h2 className="font-bold text-white text-base">Delete Roadmap</h2>
                                <p className="text-xs text-white/40 mt-0.5">This action cannot be undone</p>
                            </div>
                        </div>
                        {!deleting && (
                            <button
                                onClick={onCancel}
                                className="p-1.5 rounded-lg hover:bg-white/8 text-white/30 hover:text-white/70 transition-all"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Roadmap name */}
                    <div className="bg-white/4 border border-white/8 rounded-xl px-4 py-3">
                        <p className="text-xs text-white/40 mb-1">Roadmap to delete</p>
                        <p className="font-semibold text-white/90 text-sm leading-snug">{roadmapTitle}</p>
                    </div>

                    {/* What will happen */}
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">What will be deleted</p>
                        <ul className="space-y-1.5">
                            {[
                                { icon: '🗺️', text: 'The entire roadmap and weekly plan' },
                                { icon: '✅', text: 'All task completion history' },
                                { icon: '🔗', text: 'All saved resources for every task' },
                                {
                                    icon: '⚡',
                                    text: xpAtRisk > 0
                                        ? `${xpAtRisk.toLocaleString()} XP will be deducted from your profile`
                                        : 'No XP earned yet (nothing to deduct)',
                                    highlight: xpAtRisk > 0,
                                },
                            ].map((item, i) => (
                                <li
                                    key={i}
                                    className={`flex items-start gap-2.5 text-xs rounded-lg px-3 py-2 ${item.highlight
                                        ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                                        : 'text-white/50'
                                        }`}
                                >
                                    <span className="flex-shrink-0">{item.icon}</span>
                                    <span>{item.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <button
                            onClick={onCancel}
                            disabled={deleting}
                            className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm font-medium transition-all disabled:opacity-40"
                        >
                            Keep Roadmap
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={deleting}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold transition-all shadow-lg shadow-red-900/40"
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Deleting…
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4" />
                                    Yes, Delete
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
