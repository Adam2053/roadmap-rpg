import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import FriendRequest from '@/models/FriendRequest'

/* ================================================================
   GET /api/connections/requests
   Returns the calling user's pending INCOMING friend requests.
   The list contains just enough info to render Accept/Decline UI.
   Returns: { requests: [...], count: number }
================================================================ */
export async function GET(req: NextRequest) {
    try {
        const authUser = await getAuthUser(req)
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await connectDB()

        const pending = await FriendRequest.find({
            receiverId: authUser.userId,
            status: 'pending',
        })
            .sort({ createdAt: -1 })
            .select('_id senderId createdAt')
            .lean() as { _id: unknown; senderId: unknown; createdAt: Date }[]

        // Hydrate sender info
        const senderIds = pending.map(p => p.senderId)
        const senders = await User.find({ _id: { $in: senderIds } })
            .select('_id name level totalXP')
            .lean() as { _id: unknown; name: string; level: number; totalXP: number }[]

        const senderMap = Object.fromEntries(
            senders.map(s => [(s._id as { toString(): string }).toString(), s])
        )

        const requests = pending.map(p => {
            const sid = (p.senderId as { toString(): string }).toString()
            const sender = senderMap[sid]
            return {
                requestId: (p._id as { toString(): string }).toString(),
                senderId: sid,
                senderName: sender?.name ?? 'Unknown',
                senderLevel: sender?.level ?? 0,
                senderXP: sender?.totalXP ?? 0,
                sentAt: p.createdAt,
            }
        })

        return NextResponse.json({ requests, count: requests.length })
    } catch (error) {
        console.error('Friend requests GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
