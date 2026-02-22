import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Roadmap from '@/models/Roadmap'
import RoadmapStar from '@/models/RoadmapStar'

/* ================================================================
   POST /api/roadmap/[id]/star
   Toggles the authenticated user's star on a public roadmap.
   Rules:
     – Only public roadmaps can be starred
     – You cannot star your own roadmap
     – Idempotent toggle: star → unstar → star …
   Returns: { starred: boolean, starCount: number }
================================================================ */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const authUser = await getAuthUser(req)
        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        const roadmap = await Roadmap.findById(id)
        if (!roadmap) {
            return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 })
        }

        // Must be public to be starred
        if (!roadmap.isPublic) {
            return NextResponse.json({ error: 'Only public roadmaps can be starred' }, { status: 403 })
        }

        // Cannot star your own roadmap
        if (roadmap.userId.toString() === authUser.userId) {
            return NextResponse.json({ error: 'You cannot star your own roadmap' }, { status: 403 })
        }

        // Toggle: try to remove first; if nothing was removed, create it
        const existing = await RoadmapStar.findOne({ userId: authUser.userId, roadmapId: id })

        let starred: boolean
        if (existing) {
            // Unstar
            await RoadmapStar.deleteOne({ _id: existing._id })
            roadmap.starCount = Math.max(0, (roadmap.starCount || 0) - 1)
            starred = false
        } else {
            // Star
            await RoadmapStar.create({ userId: authUser.userId, roadmapId: id })
            roadmap.starCount = (roadmap.starCount || 0) + 1
            starred = true
        }

        await roadmap.save()

        return NextResponse.json({ starred, starCount: roadmap.starCount })
    } catch (error) {
        console.error('Star toggle error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/* ================================================================
   GET /api/roadmap/[id]/star
   Returns whether the calling user has starred this roadmap,
   plus the current star count. Used for initial page load.
================================================================ */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const authUser = await getAuthUser(req)
        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        const roadmap = await Roadmap.findById(id).select('starCount userId isPublic').lean() as {
            starCount: number; userId: { toString(): string }; isPublic: boolean
        } | null

        if (!roadmap) {
            return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 })
        }

        const isOwner = roadmap.userId.toString() === authUser.userId

        const starred = isOwner
            ? false
            : !!(await RoadmapStar.exists({ userId: authUser.userId, roadmapId: id }))

        return NextResponse.json({ starred, starCount: roadmap.starCount || 0, isOwner })
    } catch (error) {
        console.error('Star fetch error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
