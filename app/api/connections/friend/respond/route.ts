import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import FriendRequest from '@/models/FriendRequest'

const DECLINE_COOLDOWN_DAYS = 7

/* ================================================================
   POST /api/connections/friend/respond
   Body: { requestId: string, action: 'accept' | 'decline' }
   The authenticated user (receiver) responds to a pending request.
================================================================ */
export async function POST(req: NextRequest) {
    try {
        const authUser = await getAuthUser(req)
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { requestId, action } = await req.json()
        if (!requestId || !['accept', 'decline'].includes(action)) {
            return NextResponse.json({ error: 'requestId and action (accept|decline) required' }, { status: 400 })
        }

        await connectDB()

        const request = await FriendRequest.findById(requestId)
        if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 })
        if (request.receiverId.toString() !== authUser.userId) {
            return NextResponse.json({ error: 'Not your request to respond to' }, { status: 403 })
        }
        if (request.status !== 'pending') {
            return NextResponse.json({ error: 'Request is no longer pending' }, { status: 409 })
        }

        if (action === 'accept') {
            // Update both users' closeFriendCount
            await Promise.all([
                User.findByIdAndUpdate(request.senderId, { $inc: { closeFriendCount: 1 } }),
                User.findByIdAndUpdate(request.receiverId, { $inc: { closeFriendCount: 1 } }),
            ])
            request.status = 'accepted'
            // Accepted friendships don't expire — null out the TTL field
            request.expiresAt = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000)
        } else {
            // Decline: set 7-day cooldown then delete (keep record for cooldown enforcement)
            request.status = 'declined'
            request.resendAfter = new Date(Date.now() + DECLINE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000)
            // Let the TTL clean this up in 14 days; or delete immediately after cooldown
        }

        await request.save()
        return NextResponse.json({ success: true, status: request.status })
    } catch (error) {
        console.error('Friend respond error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
