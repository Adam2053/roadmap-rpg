import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Roadmap from '@/models/Roadmap'
import TaskResource from '@/models/TaskResource'

const MAX_RESOURCES = 8  // per module (week)

/* =====================================================================
   GET  /api/tasks/resources
   Modes:
     1. ?roadmapId=X&week=N          → returns resources[] for that module
     2. ?roadmapId=X&countsOnly=true → returns { weekCounts: { 1:3, 2:1 } }
                                        for the entire roadmap (used on initial load)
===================================================================== */
export async function GET(req: NextRequest) {
    try {
        const authUser = await getAuthUser(req)
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const roadmapId = searchParams.get('roadmapId')
        const weekParam = searchParams.get('week')
        const countsOnly = searchParams.get('countsOnly') === 'true'

        if (!roadmapId) {
            return NextResponse.json({ error: 'Missing roadmapId' }, { status: 400 })
        }

        await connectDB()

        // ── Mode 2: return per-week counts for the entire roadmap ────────────
        if (countsOnly) {
            const allResources = await TaskResource.find({
                userId: authUser.userId,
                roadmapId,
            }).select('week')

            const weekCounts: Record<number, number> = {}
            for (const r of allResources) {
                weekCounts[r.week] = (weekCounts[r.week] || 0) + 1
            }
            return NextResponse.json({ weekCounts })
        }

        // ── Mode 1: return full resources for one module ─────────────────────
        if (!weekParam) {
            return NextResponse.json({ error: 'Missing week param' }, { status: 400 })
        }

        const resources = await TaskResource.find({
            userId: authUser.userId,
            roadmapId,
            week: Number(weekParam),
        }).sort({ createdAt: 1 })

        return NextResponse.json({ resources })
    } catch (error) {
        console.error('Get resources error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/* =====================================================================
   POST /api/tasks/resources
   Body: { roadmapId, week, type, url, label }
===================================================================== */
export async function POST(req: NextRequest) {
    try {
        const authUser = await getAuthUser(req)
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { roadmapId, week, type, url, label } = body

        if (!roadmapId || week === undefined || !type || !url || !label) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const validTypes = ['video', 'audio', 'website', 'article', 'book', 'other']
        if (!validTypes.includes(type)) {
            return NextResponse.json({ error: 'Invalid resource type' }, { status: 400 })
        }

        try { new URL(url) } catch {
            return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
        }

        await connectDB()

        // Verify roadmap belongs to the user
        const roadmap = await Roadmap.findOne({ _id: roadmapId, userId: authUser.userId })
        if (!roadmap) return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 })

        // Enforce max resources per module
        const count = await TaskResource.countDocuments({
            userId: authUser.userId,
            roadmapId,
            week: Number(week),
        })

        if (count >= MAX_RESOURCES) {
            return NextResponse.json(
                { error: `Maximum ${MAX_RESOURCES} resources allowed per module` },
                { status: 400 }
            )
        }

        const resource = await TaskResource.create({
            userId: authUser.userId,
            roadmapId,
            week: Number(week),
            type,
            url: url.trim(),
            label: label.trim().substring(0, 200),
        })

        return NextResponse.json({ resource }, { status: 201 })
    } catch (error) {
        console.error('Create resource error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
