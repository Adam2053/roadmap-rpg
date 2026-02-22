'use client'

import { useRouter } from 'next/navigation'
import { Sparkles, PenLine, X, Zap, Layers } from 'lucide-react'

interface RoadmapTypeModalProps {
    onClose: () => void
}

export default function RoadmapTypeModal({ onClose }: RoadmapTypeModalProps) {
    const router = useRouter()

    const handleAI = () => {
        onClose()
        router.push('/roadmap')
    }

    const handleCustom = () => {
        onClose()
        router.push('/roadmap/custom')
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative w-full max-w-lg glass rounded-3xl border border-white/10 shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Decorative gradient top bar */}
                <div className="h-1 w-full bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500" />

                <div className="p-6 sm:p-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black mb-1">Create New Roadmap</h2>
                            <p className="text-sm text-muted-foreground">How would you like to build your quest?</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-white transition-all flex-shrink-0"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Options */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        {/* AI Generated */}
                        <button
                            onClick={handleAI}
                            className="group relative text-left p-5 rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 hover:from-purple-500/20 hover:to-indigo-500/15 hover:border-purple-500/40 transition-all duration-300 overflow-hidden"
                        >
                            {/* Glow */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />

                            <div className="relative">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border border-purple-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <Sparkles className="h-6 w-6 text-purple-300" />
                                </div>
                                <h3 className="font-bold text-base mb-1 group-hover:text-purple-300 transition-colors">AI Generated</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Let Gemini AI craft a personalized roadmap with daily tasks and XP rewards tailored to your goal.
                                </p>
                                <div className="flex items-center gap-1.5 mt-3">
                                    <span className="flex items-center gap-1 text-xs text-purple-400 font-medium">
                                        <Zap className="h-3 w-3" />
                                        Smart & Personalized
                                    </span>
                                </div>
                            </div>
                        </button>

                        {/* Custom */}
                        <button
                            onClick={handleCustom}
                            className="group relative text-left p-5 rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 hover:from-emerald-500/20 hover:to-teal-500/15 hover:border-emerald-500/40 transition-all duration-300 overflow-hidden"
                        >
                            {/* Glow */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />

                            <div className="relative">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border border-emerald-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <PenLine className="h-6 w-6 text-emerald-300" />
                                </div>
                                <h3 className="font-bold text-base mb-1 group-hover:text-emerald-300 transition-colors">Custom Roadmap</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Build your own roadmap from scratch. Define your weeks, days, tasks, and XP values manually.
                                </p>
                                <div className="flex items-center gap-1.5 mt-3">
                                    <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                                        <Layers className="h-3 w-3" />
                                        Full Control
                                    </span>
                                </div>
                            </div>
                        </button>
                    </div>

                    <p className="text-center text-xs text-white/25 mt-5">
                        You can always convert or edit your roadmap later
                    </p>
                </div>
            </div>
        </div>
    )
}
