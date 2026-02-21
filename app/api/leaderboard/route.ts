import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import User from '@/models/User'

/* =====================================================================
   GET /api/leaderboard
   Returns top 5 users by totalXP + the calling user's own rank & stats
   (so they can see where they stand even if not in the top 5)
===================================================================== */
export async function GET(req: NextRequest) {
    try {
        const authUser = await getAuthUser(req)
        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        // Top 5 by totalXP — only expose safe public fields
        const top5 = await User.find({})
            .sort({ totalXP: -1 })
            .limit(5)
            .select('name totalXP level bodyXP skillsXP mindsetXP careerXP streak')
            .lean()

        // Caller's rank (1-indexed position when sorted by XP desc)
        const meDoc = await User.findById(authUser.userId).select('totalXP').lean() as { totalXP: number } | null
        const myXP = meDoc?.totalXP ?? 0
        const higherCount = await User.countDocuments({ totalXP: { $gt: myXP } })
        const myRank = higherCount + 1

        // Total user count — useful context for the UI
        const totalUsers = await User.countDocuments()

        const leaderboard = top5.map((u, i) => ({
            rank: i + 1,
            name: u.name as string,
            totalXP: u.totalXP as number,
            level: u.level as number,
            bodyXP: u.bodyXP as number,
            skillsXP: u.skillsXP as number,
            mindsetXP: u.mindsetXP as number,
            careerXP: u.careerXP as number,
            streak: u.streak as number,
            isMe: (u._id as { toString(): string }).toString() === authUser.userId,
        }))

        return NextResponse.json({ leaderboard, myRank, totalUsers })
    } catch (error) {
        console.error('Leaderboard error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
