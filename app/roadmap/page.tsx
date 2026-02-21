'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Zap, Loader2, Sparkles, Target, Clock, Brain, Dumbbell } from 'lucide-react'
import { toast } from 'sonner'

const schema = z.object({
  goal: z.string().min(3, 'Describe your goal (min 3 chars)').max(500),
  durationWeeks: z.coerce.number().min(1, 'Min 1 week').max(52, 'Max 52 weeks'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  hoursPerDay: z.coerce.number().min(0.5, 'Min 0.5 hours').max(16, 'Max 16 hours'),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced']),
})

type FormData = z.infer<typeof schema>

const GOAL_EXAMPLES = [
  'Learn to play guitar from scratch',
  'Run my first 5K in 8 weeks',
  'Launch a SaaS product',
  'Learn Spanish to conversational level',
  'Build muscle and lose 10kg',
  'Get promoted to senior developer',
]

export default function RoadmapGeneratorPage() {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      durationWeeks: 4,
      difficulty: 'medium',
      hoursPerDay: 1,
      skillLevel: 'beginner',
    },
  })

  const difficulty = watch('difficulty')
  const skillLevel = watch('skillLevel')

  const onSubmit = async (data: FormData) => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error || 'Failed to generate roadmap')
        return
      }

      toast.success('Roadmap generated! 🗺️')
      router.push(`/roadmap/${json.roadmap._id}`)
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 text-sm text-purple-300 mb-4">
          <Sparkles className="h-4 w-4" />
          AI-Powered Generation
        </div>
        <h1 className="text-4xl font-black mb-3">
          Build Your <span className="gradient-text">Quest</span>
        </h1>
        <p className="text-muted-foreground">
          Tell us your goal and Gemini AI will craft a personalized weekly roadmap with daily tasks and XP rewards.
        </p>
      </div>

      <div className="glass rounded-3xl p-8 gradient-border">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Goal */}
          <div>
            <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-400" />
              What's your goal?
            </label>
            <textarea
              {...register('goal')}
              placeholder="e.g. Learn to play guitar from complete beginner to playing my first song"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
            />
            {errors.goal && <p className="text-red-400 text-xs mt-1">{errors.goal.message}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              {GOAL_EXAMPLES.map(eg => (
                <button
                  key={eg}
                  type="button"
                  onClick={() => setValue('goal', eg)}
                  className="text-xs bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 rounded-lg px-3 py-1.5 transition-all text-muted-foreground hover:text-purple-300"
                >
                  {eg}
                </button>
              ))}
            </div>
          </div>

          {/* Duration + Hours */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400" />
                Duration (weeks)
              </label>
              <input
                {...register('durationWeeks')}
                type="number"
                min="1"
                max="52"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              {errors.durationWeeks && (
                <p className="text-red-400 text-xs mt-1">{errors.durationWeeks.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-400" />
                Hours per day
              </label>
              <input
                {...register('hoursPerDay')}
                type="number"
                min="0.5"
                max="16"
                step="0.5"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              {errors.hoursPerDay && (
                <p className="text-red-400 text-xs mt-1">{errors.hoursPerDay.message}</p>
              )}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-semibold mb-3 flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-orange-400" />
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['easy', 'medium', 'hard'] as const).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setValue('difficulty', d)}
                  className={`py-3 rounded-xl border text-sm font-semibold capitalize transition-all ${
                    difficulty === d
                      ? d === 'hard'
                        ? 'bg-red-500/20 border-red-500/50 text-red-300'
                        : d === 'medium'
                        ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                        : 'bg-green-500/20 border-green-500/50 text-green-300'
                      : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
                  }`}
                >
                  {d === 'easy' ? '🌱 Easy' : d === 'medium' ? '⚔️ Medium' : '🔥 Hard'}
                </button>
              ))}
            </div>
          </div>

          {/* Skill Level */}
          <div>
            <label className="block text-sm font-semibold mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-400" />
              Current Skill Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['beginner', 'intermediate', 'advanced'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setValue('skillLevel', s)}
                  className={`py-3 rounded-xl border text-sm font-semibold capitalize transition-all ${
                    skillLevel === s
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                      : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
                  }`}
                >
                  {s === 'beginner' ? '🌱 Beginner' : s === 'intermediate' ? '⚔️ Intermediate' : '🏆 Advanced'}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 text-lg shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.01]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating your quest...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                Generate Roadmap with AI
              </>
            )}
          </button>

          {isGenerating && (
            <p className="text-center text-sm text-muted-foreground animate-pulse">
              ✨ Gemini AI is crafting your personalized roadmap... This may take 10-20 seconds.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
