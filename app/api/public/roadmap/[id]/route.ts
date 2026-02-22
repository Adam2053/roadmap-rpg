import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Roadmap from '@/models/Roadmap'
import RoadmapStar from '@/models/RoadmapStar'
import User from '@/models/User'

/* ============================================================
   GET /api/public/roadmap/[id]
   No auth required — returns full roadmap + creator info
   only if isPublic === true. Returns 404 if private.
   Also returns star info for the calling user (if logged in).
============================================================ */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await connectDB()

        const roadmap = await Roadmap.findById(id).lean() as {
            _id: unknown
            userId: { toString(): string }
            goal: string
            title: string
            skillLevel: string
            difficulty: string
            duration: number
            weeklyPlan: unknown[]
            progress: number
            isPublic: boolean
            isCustom: boolean
            starCount: number
            createdAt: Date
        } | null

        if (!roadmap || !roadmap.isPublic) {
            return NextResponse.json({ error: 'Roadmap not found or is private' }, { status: 404 })
        }

        const creator = await User.findById(roadmap.userId)
            .select('name level totalXP')
            .lean() as { _id: unknown; name: string; level: number; totalXP: number } | null

        // Star info — optional auth (public page can be viewed without login)
        let starred = false
        let isOwner = false
        const authUser = await getAuthUser(req).catch(() => null)
        if (authUser) {
            isOwner = roadmap.userId.toString() === authUser.userId
            if (!isOwner) {
                starred = !!(await RoadmapStar.exists({ userId: authUser.userId, roadmapId: id }))
            }
        }

        return NextResponse.json({
            roadmap,
            creator: creator
                ? { name: creator.name, level: creator.level, userId: (creator._id as { toString(): string }).toString() }
                : null,
            starInfo: {
                starred,
                starCount: roadmap.starCount || 0,
                isOwner,
            },
        })
    } catch (error) {
        console.error('Public roadmap fetch error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
