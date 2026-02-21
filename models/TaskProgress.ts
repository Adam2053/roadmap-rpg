import mongoose, { Document, Schema } from 'mongoose'

export interface ITaskProgress extends Document {
  userId: mongoose.Types.ObjectId
  roadmapId: mongoose.Types.ObjectId
  week: number
  day: string
  taskTitle: string
  completed: boolean
  xpEarned: number
  category: string
  completedAt: Date | null
}

const TaskProgressSchema = new Schema<ITaskProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    roadmapId: { type: Schema.Types.ObjectId, ref: 'Roadmap', required: true, index: true },
    week: { type: Number, required: true },
    day: { type: String, required: true },
    taskTitle: { type: String, required: true },
    completed: { type: Boolean, default: false },
    xpEarned: { type: Number, default: 0, min: 0 },
    category: { type: String, enum: ['Body', 'Skills', 'Mindset', 'Career'], required: true },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

TaskProgressSchema.index({ userId: 1, roadmapId: 1, week: 1, day: 1 })
TaskProgressSchema.index({ userId: 1, roadmapId: 1, taskTitle: 1 }, { unique: true })

const TaskProgress =
  mongoose.models.TaskProgress || mongoose.model<ITaskProgress>('TaskProgress', TaskProgressSchema)
export default TaskProgress
