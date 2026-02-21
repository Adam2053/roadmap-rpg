import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export interface RoadmapTask {
  title: string
  description: string
  duration_minutes: number
  xp: number
  category: 'Body' | 'Skills' | 'Mindset' | 'Career'
}

export interface RoadmapDay {
  day: string
  tasks: RoadmapTask[]
}

export interface RoadmapWeek {
  week: number
  focus: string
  milestone: string
  days: RoadmapDay[]
}

export interface GeneratedRoadmap {
  title: string
  goal: string
  total_duration_weeks: number
  difficulty: string
  weekly_plan: RoadmapWeek[]
}

export interface RoadmapInput {
  goal: string
  durationWeeks: number
  difficulty: 'easy' | 'medium' | 'hard'
  hoursPerDay: number
  skillLevel: 'beginner' | 'intermediate' | 'advanced'
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function buildPrompt(input: RoadmapInput): string {
  return `You are an expert curriculum designer and senior instructor. Your job is to create a highly structured, skill-oriented learning roadmap that reads like a professional course syllabus — NOT a generic daily schedule.

User Profile:
- Goal: ${input.goal}
- Duration: ${input.durationWeeks} weeks
- Difficulty: ${input.difficulty}
- Available study time per day: ${input.hoursPerDay} hours (= ${Math.round(input.hoursPerDay * 60)} minutes)
- Current level: ${input.skillLevel}

PHILOSOPHY — THINK LIKE A COURSE CURRICULUM DESIGNER:
- First, enumerate every concrete skill, concept, and sub-topic the learner must master to achieve the goal.
- Order them progressively: foundations → core skills → intermediate techniques → advanced topics → capstone projects.
- Each daily "task" represents ONE specific, atomic skill or lesson (like a chapter in a course).
- Task TITLE must name the exact skill or concept — be precise (e.g. "HTML Semantic Elements", "CSS Flexbox Layout", "JavaScript Promises & Async/Await", "Squat & Deadlift Form").
- Task DESCRIPTION must be a rich, course-content-style explanation (2-4 sentences) that covers:
    1. What this skill/concept is and WHY it matters for the goal
    2. Exactly what to study, watch, read, or implement (be specific — name techniques, patterns, or exercises)
    3. A hands-on practice activity or mini-project to reinforce the skill
    4. What success looks like — what the learner should be able to do confidently after completing this lesson
- Week FOCUS must be a curriculum module title (e.g. "Module 3: CSS Layouts & Responsive Design" or "Phase 2: Strength Fundamentals").
- Week MILESTONE must be a concrete, demonstrable deliverable — something the learner can show/demo/measure (e.g. "Deploy a pixel-perfect responsive landing page", "Complete a 5K run under 35 minutes").
- Weekend days = review, consolidation exercises, or project-building — NOT rest.

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON. No markdown, no explanation, no backticks.
2. The response must exactly match the schema below.
3. Total task duration_minutes per day must fit within ${Math.round(input.hoursPerDay * 60)} minutes.
4. XP values: foundational/easy task = 20-50 XP, core skill/medium = 50-100 XP, advanced/hard = 100-200 XP.
5. Categories must be exactly one of: "Body", "Skills", "Mindset", "Career".
6. Include ALL 7 days (Monday through Sunday) for EVERY week.
7. Generate ALL ${input.durationWeeks} weeks (week 1 through week ${input.durationWeeks}) — do not stop early.
8. NEVER use vague descriptions like "Practice your skills", "Work on your goal", or "Continue learning". Every description must contain SPECIFIC, ACTIONABLE learning content tied to a named skill.
9. Cover the full curriculum breadth needed for a ${input.skillLevel} to achieve "${input.goal}", distributing topics logically across all ${input.durationWeeks} weeks.

Return this EXACT JSON structure (no deviations):
{
  "title": "<concise 2-5 word roadmap title in Title Case — extract the core skill/goal, e.g. 'Full Stack Development (MERN)', 'Video Editing with DaVinci Resolve', 'Marathon Runner Training', 'Python Data Science'. NO filler words like 'I want to' or 'Become a'. Just the skill/role name.>",
  "goal": "${input.goal}",
  "total_duration_weeks": ${input.durationWeeks},
  "difficulty": "${input.difficulty}",
  "weekly_plan": [
    {
      "week": 1,
      "focus": "Module 1: <specific curriculum module name>",
      "milestone": "<concrete deliverable the learner can demonstrate or measure by end of week>",
      "days": [
        {
          "day": "Monday",
          "tasks": [
            {
              "title": "<exact skill or concept name — e.g. 'HTML Document Structure & Semantic Tags'>",
              "description": "<2-4 sentence course-content explanation: what it is & why it matters, what exactly to study/practice, a specific hands-on activity, and what success looks like>",
              "duration_minutes": 60,
              "xp": 50,
              "category": "Skills"
            }
          ]
        }
      ]
    }
  ]
}

Now generate the complete ${input.durationWeeks}-week skill-oriented curriculum for a ${input.skillLevel} at ${input.difficulty} difficulty aiming to: ${input.goal}`
}

function validateRoadmap(data: unknown): data is GeneratedRoadmap {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  if (typeof d.title !== 'string' || d.title.trim().length === 0) return false
  if (typeof d.goal !== 'string') return false
  if (typeof d.total_duration_weeks !== 'number') return false
  if (typeof d.difficulty !== 'string') return false
  if (!Array.isArray(d.weekly_plan) || d.weekly_plan.length === 0) return false

  for (const week of d.weekly_plan as unknown[]) {
    if (!week || typeof week !== 'object') return false
    const w = week as Record<string, unknown>
    if (typeof w.week !== 'number') return false
    if (typeof w.focus !== 'string') return false
    if (typeof w.milestone !== 'string') return false
    if (!Array.isArray(w.days)) return false

    for (const day of w.days as unknown[]) {
      if (!day || typeof day !== 'object') return false
      const dy = day as Record<string, unknown>
      if (typeof dy.day !== 'string') return false
      if (!Array.isArray(dy.tasks)) return false

      for (const task of dy.tasks as unknown[]) {
        if (!task || typeof task !== 'object') return false
        const t = task as Record<string, unknown>
        if (typeof t.title !== 'string') return false
        if (typeof t.description !== 'string') return false
        if (typeof t.duration_minutes !== 'number') return false
        if (typeof t.xp !== 'number') return false
        if (!['Body', 'Skills', 'Mindset', 'Career'].includes(t.category as string)) return false
      }
    }
  }

  return true
}

async function callGemini(prompt: string): Promise<GeneratedRoadmap> {
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 32768,
    },
  })

  const text = result.response.text().trim()

  // Strip any potential markdown code blocks
  const jsonText = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  const parsed = JSON.parse(jsonText)
  return parsed
}

/**
 * Distils a raw user goal string into a short, clean roadmap title.
 * Uses Gemini with a tiny prompt — much faster than the full roadmap call.
 * Falls back to a regex-stripped version of the goal on any error.
 *
 * Examples:
 *   "I want to learn video editing in da vinci resolve" → "Video Editing DaVinci Resolve"
 *   "Become a full stack developer using MERN stack"   → "Full Stack Development (MERN)"
 *   "I want to run a 5K marathon in under 30 minutes"  → "5K Marathon Runner"
 */
export async function extractTitle(rawGoal: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: `You are a naming expert. Convert this learning goal into a short, professional course title.

Rules:
- 2 to 5 words maximum
- Title Case (capitalise every major word)
- No punctuation at the end
- Remove ALL filler like "I want to", "learn how to", "become a", "I want to be", "I would like to"
- Preserve specific tech/tool/skill names exactly (e.g. DaVinci Resolve, MERN, Python, React, etc.)
- Output ONLY the title — nothing else, no quotes, no explanation

Examples:
Goal: "I want to learn video editing in da vinci resolve" → Video Editing DaVinci Resolve
Goal: "Become a full stack developer using MERN stack"   → Full Stack Development (MERN)
Goal: "I want to run a 5K marathon in under 30 minutes"  → 5K Marathon Training
Goal: "Learn Python for data science and machine learning" → Python Data Science & ML

Goal: "${rawGoal.trim()}"`,
        }],
      }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 30 },
    })
    const raw = result.response.text().trim()
    // Strip any accidental quotes/punctuation Gemini adds
    const title = raw.replace(/^["'`]|["'`]$/g, '').replace(/[.!?]+$/, '').trim()
    if (title && title.length >= 2 && title.length <= 100) return title
  } catch {
    // fall through to regex fallback
  }

  // Regex fallback: strip common filler phrases, then title-case the rest
  const stripped = rawGoal
    .replace(/^(i want to|i would like to|i'd like to|learn how to|how to|become a|i want to become a?|i am trying to|my goal is to)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
  const fallback = stripped
    .split(' ')
    .slice(0, 5)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  return fallback || rawGoal.substring(0, 50)
}


export async function generateRoadmap(input: RoadmapInput): Promise<GeneratedRoadmap> {
  const prompt = buildPrompt(input)

  // First attempt
  try {
    const result = await callGemini(prompt)
    if (validateRoadmap(result)) {
      // Ensure all 7 days are present for each week
      result.weekly_plan = result.weekly_plan.map(week => {
        const existingDays = new Map(week.days.map(d => [d.day, d]))
        week.days = DAYS.map(dayName => existingDays.get(dayName) || { day: dayName, tasks: [] })
        return week
      })
      return result
    }
    throw new Error('Invalid roadmap structure returned')
  } catch (firstError) {
    console.error('Gemini first attempt failed:', firstError)

    // Retry once
    try {
      const retryPrompt = prompt + '\n\nIMPORTANT: Your previous response was invalid JSON. Return ONLY raw JSON, nothing else.'
      const result = await callGemini(retryPrompt)
      if (validateRoadmap(result)) {
        result.weekly_plan = result.weekly_plan.map(week => {
          const existingDays = new Map(week.days.map(d => [d.day, d]))
          week.days = DAYS.map(dayName => existingDays.get(dayName) || { day: dayName, tasks: [] })
          return week
        })
        return result
      }
      throw new Error('Invalid roadmap structure on retry')
    } catch (retryError) {
      console.error('Gemini retry failed:', retryError)
      throw new Error('AI roadmap generation failed. Please try again.')
    }
  }
}
