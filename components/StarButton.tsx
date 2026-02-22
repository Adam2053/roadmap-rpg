'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { toast } from 'sonner'

interface StarButtonProps {
    roadmapId: string
    initialStarred: boolean
    initialCount: number
    isOwner: boolean        // owner cannot star their own roadmap
    isPublic: boolean       // private roadmaps can't be starred
    size?: 'sm' | 'md'     // visual size variant
    showLabel?: boolean     // show "Star" / "Starred" text
}

export default function StarButton({
    roadmapId,
    initialStarred,
    initialCount,
    isOwner,
    isPublic,
    size = 'md',
    showLabel = true,
}: StarButtonProps) {
    const [starred, setStarred] = useState(initialStarred)
    const [count, setCount] = useState(initialCount)
    const [loading, setLoading] = useState(false)
    const [animating, setAnimating] = useState(false)

    const canStar = isPublic && !isOwner

    const handleToggle = async (e: React.MouseEvent) => {
        // Prevent the click from bubbling to parent links/cards
        e.preventDefault()
        e.stopPropagation()

        if (!canStar || loading) return

        // Optimistic update
        const nextStarred = !starred
        const nextCount = nextStarred ? count + 1 : Math.max(0, count - 1)
        setStarred(nextStarred)
        setCount(nextCount)
        setAnimating(true)
        setTimeout(() => setAnimating(false), 400)

        setLoading(true)
        try {
            const res = await fetch(`/api/roadmap/${roadmapId}/star`, { method: 'POST' })
            const json = await res.json()
            if (!res.ok) {
                // Revert optimistic update
                setStarred(starred)
                setCount(count)
                toast.error(json.error || 'Failed to star roadmap')
                return
            }
            // Sync with server truth
            setStarred(json.starred)
            setCount(json.starCount)
            if (json.starred) {
                toast.success('⭐ Roadmap starred!')
            }
        } catch {
            setStarred(starred)
            setCount(count)
            toast.error('Network error')
        } finally {
            setLoading(false)
        }
    }

    const iconSz = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
    const textSz = size === 'sm' ? 'text-[11px]' : 'text-xs'

    // Non-public or owner: just show count, no interaction
    if (!canStar) {
        return (
            <div className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 ${isOwner
                    ? 'bg-yellow-500/8 border border-yellow-500/15 text-yellow-400/60'
                    : 'bg-white/5 border border-white/8 text-white/30'
                }`}>
                <Star className={`${iconSz} ${starred ? 'fill-current' : ''}`} />
                <span className={`${textSz} font-semibold tabular-nums`}>{count}</span>
                {showLabel && (
                    <span className={`${textSz} hidden sm:inline`}>
                        {isOwner ? 'received' : 'stars'}
                    </span>
                )}
            </div>
        )
    }

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            title={starred ? 'Remove star' : 'Star this roadmap'}
            className={`group inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border transition-all duration-200 select-none ${starred
                    ? 'bg-yellow-500/15 border-yellow-500/35 text-yellow-300 hover:bg-yellow-500/25 hover:border-yellow-500/50'
                    : 'bg-white/5 border-white/10 text-white/50 hover:bg-yellow-500/10 hover:border-yellow-500/25 hover:text-yellow-300'
                } ${loading ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
        >
            <Star
                className={`${iconSz} flex-shrink-0 transition-transform duration-200 ${animating ? 'scale-125' : 'scale-100'
                    } ${starred ? 'fill-yellow-400 text-yellow-400' : 'group-hover:text-yellow-400'}`}
            />
            <span className={`${textSz} font-semibold tabular-nums`}>{count}</span>
            {showLabel && (
                <span className={`${textSz} hidden sm:inline`}>
                    {starred ? 'Starred' : 'Star'}
                </span>
            )}
        </button>
    )
}
