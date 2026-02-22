import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import Follow from '@/models/Follow'
import FriendRequest from '@/models/FriendRequest'

/* ================================================================
   GET /api/connections/status/[userId]
   Returns the calling user's connection status with another user:
   {
     isMe: boolean
     following: boolean          // I follow them as mentor
     followerCount: number       // their total follower count
     friendStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted'
     closeFriendCount: number    // their close friend count (count only, no list)
     allowCloseFriendRequests: boolean
     myCloseFriendCount: number  // my own count (to enforce 10 limit)
   }
================================================================ */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId: targetId } = await params
        const authUser = await getAuthUser(req)
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await connectDB()

        const [target, me] = await Promise.all([
            User.findById(targetId).select('followerCount closeFriendCount allowCloseFriendRequests').lean() as Promise<{
                followerCount: number; closeFriendCount: number; allowCloseFriendRequests: boolean
            } | null>,
            User.findById(authUser.userId).select('closeFriendCount').lean() as Promise<{ closeFriendCount: number } | null>,
        ])

        if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        const isMe = targetId === authUser.userId

        if (isMe) {
            return NextResponse.json({
                isMe: true,
                following: false,
                followerCount: target.followerCount || 0,
                friendStatus: 'none',
                closeFriendCount: target.closeFriendCount || 0,
                allowCloseFriendRequests: target.allowCloseFriendRequests ?? true,
                myCloseFriendCount: target.closeFriendCount || 0,
            })
        }

        const [followDoc, friendDoc] = await Promise.all([
            Follow.exists({ followerId: authUser.userId, followedId: targetId }),
            FriendRequest.findOne({
                $or: [
                    { senderId: authUser.userId, receiverId: targetId },
                    { senderId: targetId, receiverId: authUser.userId },
                ],
            }).select('senderId status').lean() as Promise<{ senderId: { toString(): string }; status: string } | null>,
        ])

        let friendStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted' = 'none'
        if (friendDoc) {
            if (friendDoc.status === 'accepted') {
                friendStatus = 'accepted'
            } else if (friendDoc.status === 'pending') {
                friendStatus = friendDoc.senderId.toString() === authUser.userId
                    ? 'pending_sent'
                    : 'pending_received'
            }
        }

        return NextResponse.json({
            isMe: false,
            following: !!followDoc,
            followerCount: target.followerCount || 0,
            friendStatus,
            closeFriendCount: target.closeFriendCount || 0,
            allowCloseFriendRequests: target.allowCloseFriendRequests ?? true,
            myCloseFriendCount: me?.closeFriendCount || 0,
        })
    } catch (error) {
        console.error('Connection status error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
