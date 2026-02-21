import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Roadmap from '@/models/Roadmap'
import TaskResource from '@/models/TaskResource'

/* ================================================================
   GET /api/public/resources?roadmapId=X[&week=N]
   No auth required.
   Modes:
     1. ?roadmapId=X&week=N      → full resource list for that module
     2. ?roadmapId=X&countsOnly=true  → { weekCounts: { 1:3, 2:1 } }

   Only works for public roadmaps. Resources shown are the ones
   the roadmap OWNER added (stored against their userId).
================================================================ */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const roadmapId = searchParams.get('roadmapId')
        const weekParam = searchParams.get('week')
        const countsOnly = searchParams.get('countsOnly') === 'true'

        if (!roadmapId) {
            return NextResponse.json({ error: 'Missing roadmapId' }, { status: 400 })
        }

        await connectDB()

        // Verify roadmap exists and is public — resolve owner userId
        const roadmap = await Roadmap.findById(roadmapId).select('userId isPublic').lean() as {
            _id: unknown
            userId: unknown
            isPublic: boolean
        } | null

        if (!roadmap || !roadmap.isPublic) {
            return NextResponse.json({ error: 'Roadmap not found or is private' }, { status: 404 })
        }

        const ownerId = roadmap.userId

        // ── Mode 2: per-week counts ────────────────────────────────────────
        if (countsOnly) {
            const allResources = await TaskResource.find({ userId: ownerId, roadmapId }).select('week')
            const weekCounts: Record<number, number> = {}
            for (const r of allResources) {
                weekCounts[r.week] = (weekCounts[r.week] || 0) + 1
            }
            return NextResponse.json({ weekCounts })
        }

        // ── Mode 1: full resources for one module ──────────────────────────
        if (!weekParam) {
            return NextResponse.json({ error: 'Missing week param' }, { status: 400 })
        }

        const resources = await TaskResource.find({
            userId: ownerId,
            roadmapId,
            week: Number(weekParam),
        }).sort({ createdAt: 1 }).lean()

        return NextResponse.json({ resources })
    } catch (error) {
        console.error('Public resources error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
