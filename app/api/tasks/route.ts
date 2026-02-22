import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, calcLevel } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import Roadmap from '@/models/Roadmap'
import TaskProgress from '@/models/TaskProgress'
import User from '@/models/User'

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req)
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { roadmapId, week, day, taskTitle, completed } = body

    if (!roadmapId || !week || !day || !taskTitle || typeof completed !== 'boolean') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await connectDB()

    // Verify roadmap belongs to user and get task details
    const roadmap = await Roadmap.findOne({ _id: roadmapId, userId: authUser.userId })
    if (!roadmap) return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 })

    // Find the task in the roadmap to get XP and category (server-side, not from client)
    const weekData = roadmap.weeklyPlan.find(w => w.week === week)
    if (!weekData) return NextResponse.json({ error: 'Week not found' }, { status: 404 })

    const dayData = weekData.days.find(d => d.day === day)
    if (!dayData) return NextResponse.json({ error: 'Day not found' }, { status: 404 })

    const task = dayData.tasks.find(t => t.title === taskTitle)
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    // ── Is this a custom (user-built) roadmap? ───────────────────────────
    // Custom roadmap XP goes to customXP — NOT totalXP/category fields.
    // This keeps the competitive leaderboard (sorted by totalXP) fair.
    const isCustomRoadmap = roadmap.isCustom === true

    // Find existing progress
    const existing = await TaskProgress.findOne({
      userId: authUser.userId,
      roadmapId,
      taskTitle,
    })

    const wasCompleted = existing?.completed || false
    const xpToAward = task.xp
    const category = task.category

    if (!existing) {
      await TaskProgress.create({
        userId: authUser.userId,
        roadmapId,
        week,
        day,
        taskTitle,
        completed,
        xpEarned: completed ? xpToAward : 0,
        category,
        completedAt: completed ? new Date() : null,
      })
    } else {
      existing.completed = completed
      existing.xpEarned = completed ? xpToAward : 0
      existing.completedAt = completed ? new Date() : null
      await existing.save()
    }

    // Update user XP (only if status changed)
    if (completed !== wasCompleted) {
      const xpDelta = completed ? xpToAward : -xpToAward

      const user = await User.findById(authUser.userId)
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

      if (isCustomRoadmap) {
        // ── Custom roadmap: credit customXP only ──────────────────────────
        // totalXP, level, and category XP are intentionally NOT updated.
        // The leaderboard reads totalXP, so this change has zero leaderboard impact.
        user.customXP = Math.max(0, (user.customXP || 0) + xpDelta)
      } else {
        // ── AI roadmap: credit totalXP + category as usual ────────────────
        const categoryField =
          category === 'Body'
            ? 'bodyXP'
            : category === 'Skills'
              ? 'skillsXP'
              : category === 'Mindset'
                ? 'mindsetXP'
                : 'careerXP'

        user.totalXP = Math.max(0, user.totalXP + xpDelta)
        user[categoryField as keyof typeof user] = Math.max(
          0,
          (user[categoryField as keyof typeof user] as number) + xpDelta
        ) as never
        user.level = calcLevel(user.totalXP)
      }

      // Streak logic — same regardless of roadmap type (activity = activity)
      if (completed) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null
        if (lastActive) {
          lastActive.setHours(0, 0, 0, 0)
          const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
          if (diffDays === 0) {
            // Same day — no change
          } else if (diffDays === 1) {
            user.streak = user.streak + 1
            user.lastActiveDate = today
          } else {
            user.streak = 1
            user.lastActiveDate = today
          }
        } else {
          user.streak = 1
          user.lastActiveDate = today
        }
      }

      await user.save()

      // Recalculate roadmap progress
      const totalTasks = roadmap.weeklyPlan.reduce(
        (acc, w) => acc + w.days.reduce((a, d) => a + d.tasks.length, 0),
        0
      )
      const completedCount = await TaskProgress.countDocuments({
        userId: authUser.userId,
        roadmapId,
        completed: true,
      })
      roadmap.progress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0
      await roadmap.save()

      return NextResponse.json({
        success: true,
        xpDelta: isCustomRoadmap ? 0 : xpDelta,   // client only shows XP pop for AI roadmaps
        customXpDelta: isCustomRoadmap ? xpDelta : 0,
        isCustomRoadmap,
        newTotalXP: user.totalXP,
        newLevel: user.level,
        newStreak: user.streak,
        roadmapProgress: roadmap.progress,
      })
    }

    return NextResponse.json({ success: true, xpDelta: 0 })
  } catch (error) {
    console.error('Task complete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
