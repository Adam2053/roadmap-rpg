import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import Follow from '@/models/Follow'

/* ================================================================
   POST /api/connections/follow
   Body: { targetUserId: string }
   Toggles the calling user's mentor-follow on a target user.
   Rules:
     - Cannot follow yourself
     - Target must exist and have a public profile
   Returns: { following: boolean, followerCount: number }
================================================================ */
export async function POST(req: NextRequest) {
    try {
        const authUser = await getAuthUser(req)
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { targetUserId } = await req.json()
        if (!targetUserId) return NextResponse.json({ error: 'targetUserId required' }, { status: 400 })
        if (targetUserId === authUser.userId) {
            return NextResponse.json({ error: 'You cannot follow yourself' }, { status: 403 })
        }

        await connectDB()

        const target = await User.findById(targetUserId).select('isProfilePublic followerCount')
        if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })
        if (!target.isProfilePublic) {
            return NextResponse.json({ error: 'Cannot follow a private profile' }, { status: 403 })
        }

        const existing = await Follow.findOne({ followerId: authUser.userId, followedId: targetUserId })

        let following: boolean
        if (existing) {
            // Unfollow
            await Follow.deleteOne({ _id: existing._id })
            target.followerCount = Math.max(0, (target.followerCount || 0) - 1)
            following = false
        } else {
            // Follow
            await Follow.create({ followerId: authUser.userId, followedId: targetUserId })
            target.followerCount = (target.followerCount || 0) + 1
            following = true
        }

        await target.save()

        return NextResponse.json({ following, followerCount: target.followerCount })
    } catch (error) {
        console.error('Follow toggle error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
