import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { generateRoadmap } from '@/lib/gemini'
import Roadmap from '@/models/Roadmap'

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { goal, durationWeeks, difficulty, hoursPerDay, skillLevel } = body

    // Validate inputs
    if (!goal || typeof goal !== 'string' || goal.trim().length < 3) {
      return NextResponse.json({ error: 'Goal must be at least 3 characters' }, { status: 400 })
    }
    if (!durationWeeks || durationWeeks < 1 || durationWeeks > 52) {
      return NextResponse.json({ error: 'Duration must be 1-52 weeks' }, { status: 400 })
    }
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json({ error: 'Invalid difficulty' }, { status: 400 })
    }
    if (!hoursPerDay || hoursPerDay < 0.5 || hoursPerDay > 16) {
      return NextResponse.json({ error: 'Hours per day must be 0.5-16' }, { status: 400 })
    }
    if (!['beginner', 'intermediate', 'advanced'].includes(skillLevel)) {
      return NextResponse.json({ error: 'Invalid skill level' }, { status: 400 })
    }

    await connectDB()

    // Generate roadmap — title is extracted by Gemini inside the same JSON response
    const generated = await generateRoadmap({
      goal: goal.trim().substring(0, 500),
      durationWeeks: Math.floor(durationWeeks),
      difficulty,
      hoursPerDay,
      skillLevel,
    })

    // Use the title Gemini returned; fall back to truncated raw goal for safety
    const title = generated.title?.trim() ||
      (goal.trim().length > 60 ? goal.trim().substring(0, 57) + '…' : goal.trim())

    const roadmap = await Roadmap.create({
      userId: authUser.userId,
      goal: goal.trim().substring(0, 500),
      title,
      skillLevel,
      difficulty,
      duration: Math.floor(durationWeeks),
      weeklyPlan: generated.weekly_plan,
      progress: 0,
    })

    return NextResponse.json({ roadmap }, { status: 201 })
  } catch (error) {
    console.error('Roadmap generate error:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate roadmap'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const roadmaps = await Roadmap.find({ userId: authUser.userId })
      .select('-weeklyPlan')
      .sort({ createdAt: -1 })
      .limit(20)

    // For any roadmap that doesn't have an AI title yet, apply a fast
    // regex-based fallback so dashboard cards never display the raw goal.
    const FILLER = /^(i want to|i would like to|i'd like to|learn how to|how to|become a?|i want to become a?|i am trying to|my goal is to)\s+/i
    const roadmapsWithTitle = roadmaps.map(rm => {
      const obj = rm.toObject()
      if (!obj.title || obj.title.trim() === '') {
        const stripped = obj.goal.replace(FILLER, '').replace(/\s+/g, ' ').trim()
        obj.title = stripped
          .split(' ')
          .slice(0, 5)
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      }
      return obj
    })

    return NextResponse.json({ roadmaps: roadmapsWithTitle })
  } catch (error) {
    console.error('Roadmap list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

