import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Roadmap from '@/models/Roadmap'

/* ─── XP Formula ──────────────────────────────────────────────────────
   XP is calculated server-side from task duration and roadmap difficulty.
   Users cannot set their own XP — this keeps the leaderboard fair.

   Multipliers:
     easy   → 0.8  xp/min
     medium → 1.2  xp/min  (default)
     hard   → 1.8  xp/min

   Hard cap: 300 XP per task.
──────────────────────────────────────────────────────────────────────── */
const DIFFICULTY_MULTIPLIER: Record<string, number> = {
    easy: 0.8,
    medium: 1.2,
    hard: 1.8,
}
const MAX_TASK_XP = 300

function calcTaskXP(duration_minutes: number, difficulty: string): number {
    const mult = DIFFICULTY_MULTIPLIER[difficulty] ?? 1.2
    return Math.min(MAX_TASK_XP, Math.max(1, Math.round(duration_minutes * mult)))
}

/* ─── POST /api/roadmap/custom ──────────────────────────────────────── */
export async function POST(req: NextRequest) {
    try {
        const authUser = await getAuthUser(req)
        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { title, goal, difficulty, skillLevel, weeklyPlan } = body

        /* ── Validate basics ── */
        if (!title || typeof title !== 'string' || title.trim().length < 1) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 })
        }
        if (!goal || typeof goal !== 'string' || goal.trim().length < 1) {
            return NextResponse.json({ error: 'Goal is required' }, { status: 400 })
        }
        if (!['easy', 'medium', 'hard'].includes(difficulty)) {
            return NextResponse.json({ error: 'Invalid difficulty' }, { status: 400 })
        }
        if (!['beginner', 'intermediate', 'advanced'].includes(skillLevel)) {
            return NextResponse.json({ error: 'Invalid skill level' }, { status: 400 })
        }
        if (!Array.isArray(weeklyPlan) || weeklyPlan.length === 0) {
            return NextResponse.json({ error: 'At least one week is required' }, { status: 400 })
        }
        if (weeklyPlan.length > 52) {
            return NextResponse.json({ error: 'Maximum 52 weeks allowed' }, { status: 400 })
        }

        /* ── Validate, sanitize, and auto-calculate XP for every task ── */
        const VALID_CATEGORIES = ['Body', 'Skills', 'Mindset', 'Career']
        const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

        const sanitizedPlan = weeklyPlan.map((week: {
            week: unknown; focus: unknown; milestone: unknown;
            days: Array<{
                day: unknown;
                tasks: Array<{
                    title: unknown; description: unknown;
                    duration_minutes: unknown; category: unknown;
                    // xp intentionally ignored — calculated server-side
                }>
            }>
        }, wi: number) => {
            if (typeof week.focus !== 'string' || !week.focus.trim()) {
                throw new Error(`Week ${wi + 1} is missing a focus/module name`)
            }

            const sanitizedDays = (week.days || [])
                .filter((d: { day: unknown }) => VALID_DAYS.includes(d.day as string))
                .map((day: {
                    day: unknown;
                    tasks: Array<{
                        title: unknown; description: unknown;
                        duration_minutes: unknown; category: unknown;
                    }>
                }) => ({
                    day: day.day,
                    tasks: (day.tasks || []).map((t) => {
                        const duration = Math.max(5, Math.min(480, Number(t.duration_minutes) || 30))
                        // ✅ XP is always calculated server-side — user input is ignored
                        const xp = calcTaskXP(duration, difficulty)

                        return {
                            title: String(t.title || 'Untitled Task').trim().substring(0, 200),
                            description: String(t.description || '').trim().substring(0, 1000),
                            duration_minutes: duration,
                            xp,
                            category: VALID_CATEGORIES.includes(t.category as string) ? t.category : 'Skills',
                        }
                    }),
                }))

            return {
                week: wi + 1,
                focus: String(week.focus).trim().substring(0, 200),
                milestone: String(week.milestone || `Complete Week ${wi + 1}`).trim().substring(0, 300),
                days: sanitizedDays,
            }
        })

        await connectDB()

        const roadmap = await Roadmap.create({
            userId: authUser.userId,
            goal: goal.trim().substring(0, 500),
            title: title.trim().substring(0, 200),
            skillLevel,
            difficulty,
            duration: Math.min(52, sanitizedPlan.length),
            weeklyPlan: sanitizedPlan,
            progress: 0,
            isPublic: false,
            // ✅ flag that marks this as a custom roadmap for the XP routing logic
            isCustom: true,
        })

        return NextResponse.json({ roadmap }, { status: 201 })
    } catch (error) {
        console.error('Custom roadmap create error:', error)
        const message = error instanceof Error ? error.message : 'Failed to create roadmap'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
