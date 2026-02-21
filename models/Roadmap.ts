import mongoose, { Document, Schema } from 'mongoose'
import { RoadmapWeek } from '@/lib/gemini'

export interface IRoadmap extends Document {
  userId: mongoose.Types.ObjectId
  goal: string
  title: string
  skillLevel: string
  difficulty: string
  duration: number
  weeklyPlan: RoadmapWeek[]
  progress: number
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

const TaskSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    duration_minutes: { type: Number, required: true },
    xp: { type: Number, required: true },
    category: { type: String, enum: ['Body', 'Skills', 'Mindset', 'Career'], required: true },
  },
  { _id: false }
)

const DaySchema = new Schema(
  {
    day: { type: String, required: true },
    tasks: [TaskSchema],
  },
  { _id: false }
)

const WeekSchema = new Schema(
  {
    week: { type: Number, required: true },
    focus: { type: String, required: true },
    milestone: { type: String, required: true },
    days: [DaySchema],
  },
  { _id: false }
)

const RoadmapSchema = new Schema<IRoadmap>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    goal: { type: String, required: true, maxlength: 500 },
    title: { type: String, default: '', maxlength: 200 },
    skillLevel: { type: String, default: 'beginner', enum: ['beginner', 'intermediate', 'advanced'] },
    difficulty: { type: String, required: true, enum: ['easy', 'medium', 'hard'] },
    duration: { type: Number, required: true, min: 1 },
    weeklyPlan: [WeekSchema],
    progress: { type: Number, default: 0, min: 0, max: 100 },
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true }
)

// Delete cached model so schema changes (title, skillLevel) are always picked up
delete mongoose.models['Roadmap']
const Roadmap = mongoose.model<IRoadmap>('Roadmap', RoadmapSchema)
export default Roadmap

