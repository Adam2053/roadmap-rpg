import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import mongoose from 'mongoose'

/* ============================================================
   GET /api/users/search?q=<userId or name>
   Searches users by exact userId OR partial case-insensitive name.
   Requires auth. Returns basic public info only.
============================================================ */
export async function GET(req: NextRequest) {
    try {
        const authUser = await getAuthUser(req)
        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const q = req.nextUrl.searchParams.get('q')?.trim()
        if (!q || q.length < 2) {
            return NextResponse.json({ users: [] })
        }

        await connectDB()

        /* eslint-disable @typescript-eslint/no-explicit-any */
        const conditions: any[] = [
            { name: { $regex: q, $options: 'i' } },
        ]

        // Also match by exact ObjectId if q looks like a valid one
        if (mongoose.Types.ObjectId.isValid(q)) {
            conditions.push({ _id: new mongoose.Types.ObjectId(q) })
        }

        const users = await User.find({ $or: conditions })
            .select('name level totalXP isProfilePublic')
            .limit(8)
            .lean() as { _id: unknown; name: string; level: number; totalXP: number; isProfilePublic: boolean }[]

        return NextResponse.json({
            users: users.map(u => ({
                userId: (u._id as { toString(): string }).toString(),
                name: u.name,
                level: u.level,
                totalXP: u.totalXP,
                isProfilePublic: u.isProfilePublic ?? false,
            })),
        })
    } catch (error) {
        console.error('User search error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
