import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, calcLevel } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { generateRoadmap, extractTitle } from '@/lib/gemini'
import Roadmap from '@/models/Roadmap'
import TaskProgress from '@/models/TaskProgress'
import TaskResource from '@/models/TaskResource'
import User from '@/models/User'

/* =========================
   GET ROADMAP
========================= */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const authUser = await getAuthUser(req)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const roadmap = await Roadmap.findOne({
      _id: id,
      userId: authUser.userId,
    })

    if (!roadmap) {
      return NextResponse.json(
        { error: 'Roadmap not found' },
        { status: 404 }
      )
    }

    const taskProgress = await TaskProgress.find({
      userId: authUser.userId,
      roadmapId: id,
    })

    // ── Lazy title backfill ──────────────────────────────────────────────────
    // Old roadmaps have no title. Extract one with a fast Gemini call,
    // save it, and return it — happens only once per roadmap.
    if (!roadmap.title || roadmap.title.trim() === '') {
      try {
        const generatedTitle = await extractTitle(roadmap.goal)
        roadmap.title = generatedTitle
        await roadmap.save()
      } catch {
        // Non-fatal — leave title empty; UI will fall back to goal
      }
    }

    return NextResponse.json({ roadmap, taskProgress })
  } catch (error) {
    console.error('Get roadmap error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/* =========================
   UPDATE / REGENERATE ROADMAP
========================= */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const authUser = await getAuthUser(req)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { difficulty, hoursPerDay, skillLevel } = body

    await connectDB()

    const roadmap = await Roadmap.findOne({
      _id: id,
      userId: authUser.userId,
    })

    if (!roadmap) {
      return NextResponse.json(
        { error: 'Roadmap not found' },
        { status: 404 }
      )
    }

    // Regenerate roadmap using AI
    const generated = await generateRoadmap({
      goal: roadmap.goal,
      durationWeeks: roadmap.duration,
      difficulty: difficulty || roadmap.difficulty,
      hoursPerDay: hoursPerDay || 1,
      skillLevel: skillLevel || 'beginner',
    })

    roadmap.weeklyPlan = generated.weekly_plan
    roadmap.difficulty = difficulty || roadmap.difficulty
    roadmap.progress = 0

    await roadmap.save()

    // Clear old task progress
    await TaskProgress.deleteMany({
      userId: authUser.userId,
      roadmapId: id,
    })

    return NextResponse.json({ roadmap })
  } catch (error) {
    console.error('Regenerate roadmap error:', error)
    const message =
      error instanceof Error ? error.message : 'Failed to regenerate'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/* =========================
   DELETE ROADMAP
   Steps:
   1. Aggregate all XP earned from completed tasks (per category)
   2. Deduct XP from user & recalculate level
   3. Delete TaskProgress → TaskResources → Roadmap (in order)
   4. Return fresh user stats to client
========================= */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const authUser = await getAuthUser(req)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    // Verify ownership before doing anything destructive
    const roadmap = await Roadmap.findOne({ _id: id, userId: authUser.userId })
    if (!roadmap) {
      return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 })
    }

    // ── 1. Aggregate earned XP by category ───────────────────────────────
    const completedProgress = await TaskProgress.find({
      userId: authUser.userId,
      roadmapId: id,
      completed: true,
    })

    const xpByCategory: Record<string, number> = {
      Body: 0,
      Skills: 0,
      Mindset: 0,
      Career: 0,
    }
    let totalXPToDeduct = 0

    for (const tp of completedProgress) {
      const cat = tp.category as string
      const xp = tp.xpEarned || 0
      if (cat in xpByCategory) {
        xpByCategory[cat] += xp
        totalXPToDeduct += xp
      }
    }

    // ── 2. Deduct XP from user & recalculate level ────────────────────────
    const user = await User.findById(authUser.userId)
    if (user && totalXPToDeduct > 0) {
      user.totalXP = Math.max(0, user.totalXP - totalXPToDeduct)
      user.bodyXP = Math.max(0, user.bodyXP - xpByCategory['Body'])
      user.skillsXP = Math.max(0, user.skillsXP - xpByCategory['Skills'])
      user.mindsetXP = Math.max(0, user.mindsetXP - xpByCategory['Mindset'])
      user.careerXP = Math.max(0, user.careerXP - xpByCategory['Career'])
      user.level = calcLevel(user.totalXP)
      await user.save()
    }

    // ── 3. Delete all traces — TaskProgress → TaskResources → Roadmap ─────
    await TaskProgress.deleteMany({ userId: authUser.userId, roadmapId: id })
    await TaskResource.deleteMany({ userId: authUser.userId, roadmapId: id })
    await Roadmap.deleteOne({ _id: id, userId: authUser.userId })

    return NextResponse.json({
      success: true,
      xpDeducted: totalXPToDeduct,
      newTotalXP: user?.totalXP ?? 0,
      newLevel: user?.level ?? 0,
      newBodyXP: user?.bodyXP ?? 0,
      newSkillsXP: user?.skillsXP ?? 0,
      newMindsetXP: user?.mindsetXP ?? 0,
      newCareerXP: user?.careerXP ?? 0,
    })
  } catch (error) {
    console.error('Delete roadmap error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}