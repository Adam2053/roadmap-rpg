import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import User from '@/models/User'

/* ============================================================
   GET /api/settings
   Returns the calling user's own settings (safe fields only).

   PATCH /api/settings
   Body: { isProfilePublic?: boolean, name?: string }
   Updates the calling user's profile settings.
============================================================ */

export async function GET(req: NextRequest) {
    try {
        const authUser = await getAuthUser(req)
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await connectDB()
        const user = await User.findById(authUser.userId)
            .select('name email isProfilePublic totalXP level streak createdAt')
            .lean() as {
                _id: unknown
                name: string
                email: string
                isProfilePublic: boolean
                totalXP: number
                level: number
                streak: number
                createdAt: Date
            } | null

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        return NextResponse.json({
            userId: (user._id as { toString(): string }).toString(),
            name: user.name,
            email: user.email,
            isProfilePublic: user.isProfilePublic ?? false,
            totalXP: user.totalXP,
            level: user.level,
            streak: user.streak,
            memberSince: user.createdAt,
        })
    } catch (error) {
        console.error('Settings GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const authUser = await getAuthUser(req)
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const updates: Record<string, unknown> = {}

        if (typeof body.isProfilePublic === 'boolean') {
            updates.isProfilePublic = body.isProfilePublic
        }
        if (typeof body.name === 'string' && body.name.trim().length >= 1) {
            updates.name = body.name.trim().substring(0, 100)
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
        }

        await connectDB()
        const user = await User.findByIdAndUpdate(
            authUser.userId,
            { $set: updates },
            { new: true, strict: false }
        ).select('name email isProfilePublic').lean() as {
            name: string; email: string; isProfilePublic: boolean
        } | null

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        return NextResponse.json({
            success: true,
            name: user.name,
            email: user.email,
            isProfilePublic: user.isProfilePublic ?? false,
        })
    } catch (error) {
        console.error('Settings PATCH error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
