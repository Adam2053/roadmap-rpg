import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import FriendRequest from '@/models/FriendRequest'

const MAX_CLOSE_FRIENDS = 10

/* ================================================================
   POST /api/connections/friend/request
   Body: { targetUserId: string }
   Sends a close friend request.
   Rules:
     - Can't send to yourself
     - Target must have allowCloseFriendRequests: true
     - Neither party can be at the 10-friend limit
     - No existing pending or accepted request between the two
     - Cooldown: if sender was previously declined, must wait 7 days
================================================================ */
export async function POST(req: NextRequest) {
    try {
        const authUser = await getAuthUser(req)
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { targetUserId } = await req.json()
        if (!targetUserId) return NextResponse.json({ error: 'targetUserId required' }, { status: 400 })
        if (targetUserId === authUser.userId) {
            return NextResponse.json({ error: 'Cannot send request to yourself' }, { status: 403 })
        }

        await connectDB()

        const [sender, receiver] = await Promise.all([
            User.findById(authUser.userId).select('closeFriendCount name'),
            User.findById(targetUserId).select('closeFriendCount allowCloseFriendRequests name'),
        ])

        if (!receiver) return NextResponse.json({ error: 'User not found' }, { status: 404 })
        if (!sender) return NextResponse.json({ error: 'Sender not found' }, { status: 404 })

        if (!(receiver.allowCloseFriendRequests ?? true)) {
            return NextResponse.json({ error: `${receiver.name} is not accepting close friend requests` }, { status: 403 })
        }
        if ((sender.closeFriendCount || 0) >= MAX_CLOSE_FRIENDS) {
            return NextResponse.json({ error: 'You have reached the 10 close friends limit' }, { status: 403 })
        }
        if ((receiver.closeFriendCount || 0) >= MAX_CLOSE_FRIENDS) {
            return NextResponse.json({ error: 'This user has reached their close friends limit' }, { status: 403 })
        }

        // Check for existing relationship in either direction
        const existing = await FriendRequest.findOne({
            $or: [
                { senderId: authUser.userId, receiverId: targetUserId },
                { senderId: targetUserId, receiverId: authUser.userId },
            ],
        })

        if (existing) {
            if (existing.status === 'accepted') {
                return NextResponse.json({ error: 'Already close friends' }, { status: 409 })
            }
            if (existing.status === 'pending') {
                return NextResponse.json({ error: 'A request is already pending' }, { status: 409 })
            }
            // Status is 'declined' — check cooldown (resendAfter)
            if (existing.resendAfter && existing.resendAfter > new Date()) {
                const days = Math.ceil((existing.resendAfter.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                return NextResponse.json({ error: `Please wait ${days} more day(s) before re-sending` }, { status: 429 })
            }
            // Declined and cooldown passed — delete old doc and allow re-request
            await FriendRequest.deleteOne({ _id: existing._id })
        }

        await FriendRequest.create({
            senderId: authUser.userId,
            receiverId: targetUserId,
            status: 'pending',
            expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Friend request error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
