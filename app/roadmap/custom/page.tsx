'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    PenLine, Plus, Trash2, ChevronDown, ChevronUp,
    Loader2, Save, ArrowLeft, Zap, Clock, Target,
    Dumbbell, Brain, Calendar, GripVertical, Check, Info
} from 'lucide-react'
import { toast } from 'sonner'

/* ─── Types ──────────────────────────────────────────────── */
type Category = 'Body' | 'Skills' | 'Mindset' | 'Career'
type Difficulty = 'easy' | 'medium' | 'hard'
type SkillLevel = 'beginner' | 'intermediate' | 'advanced'

interface CustomTask {
    id: string
    title: string
    description: string
    duration_minutes: number
    category: Category
}

interface CustomDay {
    day: string
    tasks: CustomTask[]
}

interface CustomWeek {
    id: string
    week: number
    focus: string
    milestone: string
    days: CustomDay[]
    expanded: boolean
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const CATEGORIES: Category[] = ['Body', 'Skills', 'Mindset', 'Career']
const CATEGORY_COLORS: Record<Category, string> = {
    Body: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    Skills: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    Mindset: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    Career: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
}
const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
    easy: 0.8,
    medium: 1.2,
    hard: 1.8,
}

/** Mirror of the server-side formula — for preview only */
function previewXP(duration_minutes: number, difficulty: Difficulty): number {
    const mult = DIFFICULTY_MULTIPLIER[difficulty] ?? 1.2
    return Math.min(300, Math.max(1, Math.round(duration_minutes * mult)))
}

function uid() {
    return Math.random().toString(36).slice(2, 9)
}

function makeDefaultDay(day: string): CustomDay {
    return { day, tasks: [] }
}

function makeDefaultWeek(weekNum: number): CustomWeek {
    return {
        id: uid(),
        week: weekNum,
        focus: '',
        milestone: '',
        days: DAYS.map(makeDefaultDay),
        expanded: weekNum === 1,
    }
}

function makeDefaultTask(): CustomTask {
    return {
        id: uid(),
        title: '',
        description: '',
        duration_minutes: 30,
        category: 'Skills',
    }
}

/* ─── TaskEditor ──────────────────────────────────────────── */
function TaskEditor({
    task,
    difficulty,
    onChange,
    onDelete,
}: {
    task: CustomTask
    difficulty: Difficulty
    onChange: (t: CustomTask) => void
    onDelete: () => void
}) {
    const xpPreview = previewXP(task.duration_minutes, difficulty)

    return (
        <div className="rounded-xl border border-white/8 bg-white/3 p-3 sm:p-4 space-y-3">
            <div className="flex items-start gap-2">
                <GripVertical className="h-4 w-4 text-white/20 mt-2.5 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    {/* Title + delete */}
                    <div className="flex items-start gap-2">
                        <input
                            value={task.title}
                            onChange={e => onChange({ ...task, title: e.target.value })}
                            placeholder="Task title (e.g. CSS Flexbox Layout)"
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/60 focus:border-transparent transition-all placeholder:text-white/25"
                        />
                        <button
                            onClick={onDelete}
                            className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Description */}
                    <textarea
                        value={task.description}
                        onChange={e => onChange({ ...task, description: e.target.value })}
                        placeholder="What should the learner do? (optional)"
                        rows={2}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/60 focus:border-transparent transition-all placeholder:text-white/25 resize-none"
                    />

                    {/* Meta row */}
                    <div className="flex flex-wrap gap-2 items-center">
                        {/* Category */}
                        <select
                            value={task.category}
                            onChange={e => onChange({ ...task, category: e.target.value as Category })}
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/60 transition-all text-white/80"
                        >
                            {CATEGORIES.map(c => (
                                <option key={c} value={c} className="bg-[#1a1a2e]">{c}</option>
                            ))}
                        </select>

                        {/* Duration */}
                        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5">
                            <Clock className="h-3 w-3 text-white/40" />
                            <input
                                type="number"
                                value={task.duration_minutes}
                                min={5}
                                max={480}
                                onChange={e => onChange({ ...task, duration_minutes: Math.max(5, Number(e.target.value)) })}
                                className="w-14 bg-transparent text-xs focus:outline-none text-white/80"
                            />
                            <span className="text-xs text-white/30">min</span>
                        </div>

                        {/* Auto-calculated XP preview (read-only) */}
                        <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-2.5 py-1.5" title="XP is calculated automatically from duration × difficulty. You cannot set it manually.">
                            <Zap className="h-3 w-3 text-yellow-400" />
                            <span className="text-xs font-bold text-yellow-300 tabular-nums">{xpPreview}</span>
                            <span className="text-xs text-yellow-400/60">XP</span>
                        </div>

                        {/* Category badge preview */}
                        <span className={`self-center inline-flex items-center text-xs px-2 py-1 rounded-md border font-medium ${CATEGORY_COLORS[task.category]}`}>
                            {task.category}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ─── DaySection ─────────────────────────────────────────── */
function DaySection({
    day,
    weekIdx,
    dayIdx,
    difficulty,
    onAddTask,
    onTaskChange,
    onTaskDelete,
}: {
    day: CustomDay
    weekIdx: number
    dayIdx: number
    difficulty: Difficulty
    onAddTask: (wi: number, di: number) => void
    onTaskChange: (wi: number, di: number, ti: number, t: CustomTask) => void
    onTaskDelete: (wi: number, di: number, ti: number) => void
}) {
    return (
        <div className="border-t border-white/5 px-3 sm:px-5 py-3">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-purple-300">{day.day}</span>
                <button
                    onClick={() => onAddTask(weekIdx, dayIdx)}
                    className="flex items-center gap-1 text-xs text-white/40 hover:text-purple-300 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 rounded-lg px-2 py-1 transition-all"
                >
                    <Plus className="h-3 w-3" />
                    Add Task
                </button>
            </div>

            {day.tasks.length === 0 ? (
                <p className="text-xs text-white/20 italic py-1">No tasks — click &quot;Add Task&quot; to create one</p>
            ) : (
                <div className="space-y-2">
                    {day.tasks.map((task, ti) => (
                        <TaskEditor
                            key={task.id}
                            task={task}
                            difficulty={difficulty}
                            onChange={t => onTaskChange(weekIdx, dayIdx, ti, t)}
                            onDelete={() => onTaskDelete(weekIdx, dayIdx, ti)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function CustomRoadmapPage() {
    const router = useRouter()
    const [title, setTitle] = useState('')
    const [goal, setGoal] = useState('')
    const [difficulty, setDifficulty] = useState<Difficulty>('medium')
    const [skillLevel, setSkillLevel] = useState<SkillLevel>('beginner')
    const [weeks, setWeeks] = useState<CustomWeek[]>([makeDefaultWeek(1)])
    const [saving, setSaving] = useState(false)
    const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())

    /* ── Week operations ──────────────────────────────────── */
    const addWeek = () => {
        setWeeks(prev => [...prev, makeDefaultWeek(prev.length + 1)])
    }

    const removeWeek = (idx: number) => {
        if (weeks.length <= 1) { toast.error('You need at least one week'); return }
        setWeeks(prev => {
            const next = prev.filter((_, i) => i !== idx)
            return next.map((w, i) => ({ ...w, week: i + 1 }))
        })
    }

    const toggleWeek = (idx: number) => {
        setWeeks(prev => prev.map((w, i) => i === idx ? { ...w, expanded: !w.expanded } : w))
    }

    const updateWeekField = (idx: number, field: 'focus' | 'milestone', val: string) => {
        setWeeks(prev => prev.map((w, i) => i === idx ? { ...w, [field]: val } : w))
    }

    /* ── Day operations ───────────────────────────────────── */
    const toggleDay = (key: string) => {
        setExpandedDays(prev => {
            const s = new Set(prev)
            s.has(key) ? s.delete(key) : s.add(key)
            return s
        })
    }

    /* ── Task operations ──────────────────────────────────── */
    const addTask = (wi: number, di: number) => {
        setWeeks(prev => {
            const clone = structuredClone(prev)
            clone[wi].days[di].tasks.push(makeDefaultTask())
            return clone
        })
        const key = `${wi}-${di}`
        setExpandedDays(prev => new Set(prev).add(key))
    }

    const updateTask = (wi: number, di: number, ti: number, task: CustomTask) => {
        setWeeks(prev => {
            const clone = structuredClone(prev)
            clone[wi].days[di].tasks[ti] = task
            return clone
        })
    }

    const deleteTask = (wi: number, di: number, ti: number) => {
        setWeeks(prev => {
            const clone = structuredClone(prev)
            clone[wi].days[di].tasks.splice(ti, 1)
            return clone
        })
    }

    /* ── Stats (preview XP using same server formula) ──────── */
    const totalTasks = weeks.reduce((a, w) => a + w.days.reduce((b, d) => b + d.tasks.length, 0), 0)
    const totalXP = weeks.reduce((a, w) =>
        a + w.days.reduce((b, d) =>
            b + d.tasks.reduce((c, t) => c + previewXP(t.duration_minutes, difficulty), 0), 0), 0)

    /* ── Save / Submit ────────────────────────────────────── */
    const handleSave = async () => {
        if (!title.trim()) { toast.error('Please add a roadmap title'); return }
        if (!goal.trim()) { toast.error('Please describe your goal'); return }
        if (weeks.some(w => !w.focus.trim())) { toast.error('Every week needs a focus/module name'); return }

        // Build weeklyPlan payload — xp is intentionally omitted; server calculates it
        const weeklyPlan = weeks.map(w => ({
            week: w.week,
            focus: w.focus.trim(),
            milestone: w.milestone.trim() || `Complete Week ${w.week}`,
            days: w.days.map(d => ({
                day: d.day,
                tasks: d.tasks.map(t => ({
                    title: t.title.trim() || 'Untitled Task',
                    description: t.description.trim() || '',
                    duration_minutes: Math.max(5, t.duration_minutes || 30),
                    category: t.category,
                    // xp is deliberately not sent — server auto-calculates it
                })),
            })),
        }))

        setSaving(true)
        try {
            const res = await fetch('/api/roadmap/custom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    goal: goal.trim(),
                    difficulty,
                    skillLevel,
                    durationWeeks: weeks.length,
                    weeklyPlan,
                }),
            })
            const json = await res.json()
            if (!res.ok) { toast.error(json.error || 'Failed to save roadmap'); return }
            toast.success('Custom roadmap created! 🗺️')
            router.push(`/roadmap/${json.roadmap._id}`)
        } catch {
            toast.error('Network error. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    /* ── Render ───────────────────────────────────────────── */
    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
            {/* Back */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm mb-6"
            >
                <ArrowLeft className="h-4 w-4" />
                Back
            </button>

            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 text-sm text-emerald-300 mb-4">
                    <PenLine className="h-4 w-4" />
                    Custom Roadmap Builder
                </div>
                <h1 className="text-4xl font-black mb-3">
                    Build Your <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Quest</span>
                </h1>
                <p className="text-muted-foreground">
                    Design your own roadmap with full control over weeks, tasks, and categories.
                </p>
            </div>

            {/* ── Fairness notice ── */}
            <div className="flex items-start gap-3 bg-blue-500/8 border border-blue-500/20 rounded-2xl px-4 py-3.5 mb-6">
                <Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-300/80 leading-relaxed">
                    <span className="font-semibold text-blue-300">Fair XP system:</span> XP for custom roadmaps is auto-calculated from task duration × difficulty (max 300 XP/task) and goes into your personal <span className="font-medium">Custom XP</span> pool — separate from the competitive leaderboard. Only AI-generated roadmap XP counts toward the leaderboard.
                </div>
            </div>

            {/* ── Basics card ── */}
            <div className="glass rounded-3xl p-6 sm:p-8 gradient-border mb-6 space-y-6">
                {/* Title */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                        <PenLine className="h-4 w-4 text-emerald-400" />
                        Roadmap Title
                    </label>
                    <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="e.g. Full Stack Development (MERN)"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-white/25"
                    />
                </div>

                {/* Goal */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                        <Target className="h-4 w-4 text-purple-400" />
                        Goal Description
                    </label>
                    <textarea
                        value={goal}
                        onChange={e => setGoal(e.target.value)}
                        placeholder="What do you want to achieve? (e.g. Learn full-stack web development with React and Node.js)"
                        rows={2}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-white/25 resize-none"
                    />
                </div>

                {/* Difficulty + Skill Level */}
                <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold mb-1">
                            <Dumbbell className="h-4 w-4 text-orange-400" />
                            Difficulty
                        </label>
                        <p className="text-xs text-white/35 mb-3">Also sets the XP multiplier for tasks</p>
                        <div className="grid grid-cols-3 gap-2">
                            {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => setDifficulty(d)}
                                    className={`py-2.5 rounded-xl border text-xs font-semibold capitalize transition-all ${difficulty === d
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
                        <p className="text-xs text-white/30 mt-2">
                            ×{DIFFICULTY_MULTIPLIER[difficulty]} XP/min · e.g. 30 min → {previewXP(30, difficulty)} XP
                        </p>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                            <Brain className="h-4 w-4 text-purple-400" />
                            Skill Level
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['beginner', 'intermediate', 'advanced'] as SkillLevel[]).map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setSkillLevel(s)}
                                    className={`py-2.5 rounded-xl border text-xs font-semibold capitalize transition-all ${skillLevel === s
                                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                                        : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
                                        }`}
                                >
                                    {s === 'beginner' ? '🌱' : s === 'intermediate' ? '⚔️' : '🏆'} {s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Stats strip ── */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <div className="flex items-center gap-2 glass rounded-xl px-3 py-2 text-xs">
                    <Calendar className="h-3.5 w-3.5 text-purple-400" />
                    <span className="text-muted-foreground">{weeks.length} week{weeks.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2 glass rounded-xl px-3 py-2 text-xs">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-muted-foreground">{totalTasks} task{totalTasks !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2 glass rounded-xl px-3 py-2 text-xs">
                    <Zap className="h-3.5 w-3.5 text-yellow-400" />
                    <span className="text-muted-foreground">{totalXP.toLocaleString()} custom XP (preview)</span>
                </div>
            </div>

            {/* ── Weekly Plan ── */}
            <div className="space-y-3 mb-6">
                {weeks.map((week, wi) => {
                    const weekTaskCount = week.days.reduce((a, d) => a + d.tasks.length, 0)
                    const weekXP = week.days.reduce((a, d) =>
                        a + d.tasks.reduce((b, t) => b + previewXP(t.duration_minutes, difficulty), 0), 0)

                    return (
                        <div key={week.id} className="glass rounded-2xl overflow-hidden">
                            {/* Week header */}
                            <div className="p-4 sm:p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg w-9 h-9 flex items-center justify-center flex-shrink-0">
                                        <span className="text-emerald-300 font-bold text-sm">{week.week}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <input
                                            value={week.focus}
                                            onChange={e => updateWeekField(wi, 'focus', e.target.value)}
                                            placeholder={`Week ${week.week} focus/module name (e.g. Module 1: Foundations)`}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-transparent transition-all placeholder:text-white/25 placeholder:font-normal"
                                        />
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {weekTaskCount > 0 && (
                                            <span className="hidden sm:flex items-center gap-1 text-xs text-yellow-400/70 bg-yellow-500/10 border border-yellow-500/15 rounded-lg px-2 py-1 mr-1">
                                                <Zap className="h-3 w-3" />{weekXP}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => toggleWeek(wi)}
                                            className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground transition-all"
                                        >
                                            {week.expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </button>
                                        <button
                                            onClick={() => removeWeek(wi)}
                                            className="p-2 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Milestone */}
                                <input
                                    value={week.milestone}
                                    onChange={e => updateWeekField(wi, 'milestone', e.target.value)}
                                    placeholder="Week milestone — what will the learner be able to do? (optional)"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-transparent transition-all placeholder:text-white/20"
                                />
                            </div>

                            {/* Days */}
                            {week.expanded && (
                                <div className="border-t border-white/5">
                                    {week.days.map((day, di) => {
                                        const dKey = `${wi}-${di}`
                                        const isDayOpen = expandedDays.has(dKey) || day.tasks.length > 0
                                        const dayXP = day.tasks.reduce((a, t) => a + previewXP(t.duration_minutes, difficulty), 0)
                                        return (
                                            <div key={day.day}>
                                                {/* Day row header */}
                                                <button
                                                    onClick={() => toggleDay(dKey)}
                                                    className="w-full flex items-center justify-between px-4 sm:px-5 py-2.5 hover:bg-white/5 transition-colors text-left"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-semibold text-purple-300">{day.day}</span>
                                                        {day.tasks.length > 0 && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {day.tasks.length} task{day.tasks.length !== 1 ? 's' : ''}
                                                                {' · '}
                                                                <span className="text-yellow-400">{dayXP} XP</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isDayOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                                                </button>

                                                {isDayOpen && (
                                                    <DaySection
                                                        day={day}
                                                        weekIdx={wi}
                                                        dayIdx={di}
                                                        difficulty={difficulty}
                                                        onAddTask={addTask}
                                                        onTaskChange={updateTask}
                                                        onTaskDelete={deleteTask}
                                                    />
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Add Week */}
            <button
                onClick={addWeek}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-white/15 hover:border-emerald-500/40 hover:bg-emerald-500/5 text-muted-foreground hover:text-emerald-300 transition-all text-sm font-medium mb-8"
            >
                <Plus className="h-4 w-4" />
                Add Week {weeks.length + 1}
            </button>

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 text-lg shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01]"
            >
                {saving ? (
                    <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Saving roadmap...
                    </>
                ) : (
                    <>
                        <Save className="h-5 w-5" />
                        Save Roadmap
                    </>
                )}
            </button>

            <p className="text-center text-xs text-white/25 mt-4">
                XP values are finalized server-side · You can add resources after saving
            </p>
        </div>
    )
}
