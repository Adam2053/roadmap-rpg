import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import FriendRequest from '@/models/FriendRequest'

/* ================================================================
   DELETE /api/connections/friend/[userId]
   Unfriends the target user. Both sides lose one closeFriendCount.
   Also handles cancelling a pending sent request.
================================================================ */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId: targetId } = await params
        const authUser = await getAuthUser(req)
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await connectDB()

        const request = await FriendRequest.findOne({
            $or: [
                { senderId: authUser.userId, receiverId: targetId },
                { senderId: targetId, receiverId: authUser.userId },
            ],
        })

        if (!request) return NextResponse.json({ error: 'No connection found' }, { status: 404 })

        if (request.status === 'accepted') {
            // Unfriend — decrement both counts
            await Promise.all([
                FriendRequest.deleteOne({ _id: request._id }),
                User.findByIdAndUpdate(request.senderId, { $inc: { closeFriendCount: -1 } }),
                User.findByIdAndUpdate(request.receiverId, { $inc: { closeFriendCount: -1 } }),
            ])
        } else if (request.status === 'pending' && request.senderId.toString() === authUser.userId) {
            // Cancel a pending request (sender-only action)
            await FriendRequest.deleteOne({ _id: request._id })
        } else {
            return NextResponse.json({ error: 'Cannot remove this connection' }, { status: 403 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Unfriend error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
