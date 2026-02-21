import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Roadmap from '@/models/Roadmap'

/* ============================================================
   PATCH /api/roadmap/[id]/visibility
   Body: { isPublic: boolean }
   Toggles the public/private visibility of a roadmap.
   Only the owner is authorised.
============================================================ */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const authUser = await getAuthUser(req)
        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { isPublic } = body
        if (typeof isPublic !== 'boolean') {
            return NextResponse.json({ error: 'isPublic must be a boolean' }, { status: 400 })
        }

        await connectDB()

        const roadmap = await Roadmap.findOneAndUpdate(
            { _id: id, userId: authUser.userId },
            { isPublic },
            { new: true }
        ).select('_id isPublic')

        if (!roadmap) {
            return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 })
        }

        return NextResponse.json({ isPublic: roadmap.isPublic })
    } catch (error) {
        console.error('Visibility toggle error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
