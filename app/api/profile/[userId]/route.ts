import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import Roadmap from '@/models/Roadmap'

/* ============================================================
   GET /api/profile/[userId]
   Returns public profile + public roadmaps.
   If isProfilePublic === false and the caller is NOT the owner,
   returns { isPrivate: true, name } so the UI can show a
   "private profile" screen without leaking any stats.
============================================================ */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params
        const authUser = await getAuthUser(req)
        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        const user = await User.findById(userId)
            .select('name totalXP level bodyXP skillsXP mindsetXP careerXP streak isProfilePublic createdAt')
            .lean() as {
                _id: unknown
                name: string
                totalXP: number
                level: number
                bodyXP: number
                skillsXP: number
                mindsetXP: number
                careerXP: number
                streak: number
                isProfilePublic: boolean
                createdAt: Date
            } | null

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const isOwner = userId === authUser.userId
        const isPublic = user.isProfilePublic ?? false

        // Private profile — only let the owner see full data
        if (!isPublic && !isOwner) {
            return NextResponse.json({
                isPrivate: true,
                profile: { name: user.name },
            })
        }

        const publicRoadmaps = await Roadmap.find({ userId, isPublic: true })
            .select('_id title goal difficulty duration progress skillLevel createdAt')
            .sort({ createdAt: -1 })
            .limit(20)
            .lean()

        return NextResponse.json({
            isPrivate: false,
            profile: {
                userId: (user._id as { toString(): string }).toString(),
                name: user.name,
                totalXP: user.totalXP,
                level: user.level,
                bodyXP: user.bodyXP,
                skillsXP: user.skillsXP,
                mindsetXP: user.mindsetXP,
                careerXP: user.careerXP,
                streak: user.streak,
                memberSince: user.createdAt,
                isMe: isOwner,
            },
            publicRoadmaps,
        })
    } catch (error) {
        console.error('Profile fetch error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
