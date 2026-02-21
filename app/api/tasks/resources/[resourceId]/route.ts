import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import TaskResource from '@/models/TaskResource'

/* ===========================
   DELETE /api/tasks/resources/[resourceId]
=========================== */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ resourceId: string }> }
) {
    try {
        const { resourceId } = await params

        const authUser = await getAuthUser(req)
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await connectDB()

        const resource = await TaskResource.findOneAndDelete({
            _id: resourceId,
            userId: authUser.userId,
        })

        if (!resource) {
            return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete resource error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
