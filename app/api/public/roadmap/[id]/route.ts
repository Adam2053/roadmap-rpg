import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Roadmap from '@/models/Roadmap'
import User from '@/models/User'

/* ============================================================
   GET /api/public/roadmap/[id]
   No auth required — returns full roadmap + creator info
   only if isPublic === true. Returns 404 if private.
============================================================ */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await connectDB()

        const roadmap = await Roadmap.findById(id).lean() as {
            _id: unknown
            userId: unknown
            goal: string
            title: string
            skillLevel: string
            difficulty: string
            duration: number
            weeklyPlan: unknown[]
            progress: number
            isPublic: boolean
            createdAt: Date
        } | null

        if (!roadmap || !roadmap.isPublic) {
            return NextResponse.json({ error: 'Roadmap not found or is private' }, { status: 404 })
        }

        const creator = await User.findById(roadmap.userId)
            .select('name level totalXP')
            .lean() as { _id: unknown; name: string; level: number; totalXP: number } | null

        return NextResponse.json({
            roadmap,
            creator: creator
                ? { name: creator.name, level: creator.level, userId: (creator._id as { toString(): string }).toString() }
                : null,
        })
    } catch (error) {
        console.error('Public roadmap fetch error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
