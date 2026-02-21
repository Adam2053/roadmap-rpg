import mongoose, { Document, Schema } from 'mongoose'

export type ResourceType = 'video' | 'audio' | 'website' | 'article' | 'book' | 'other'

export interface ITaskResource extends Document {
    userId: mongoose.Types.ObjectId
    roadmapId: mongoose.Types.ObjectId
    week: number          // module / week number — resources are now per-module
    type: ResourceType
    url: string
    label: string
    createdAt: Date
}

const TaskResourceSchema = new Schema<ITaskResource>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        roadmapId: { type: Schema.Types.ObjectId, ref: 'Roadmap', required: true, index: true },
        week: { type: Number, required: true },
        type: {
            type: String,
            enum: ['video', 'audio', 'website', 'article', 'book', 'other'],
            required: true,
        },
        url: { type: String, required: true, maxlength: 2000 },
        label: { type: String, required: true, maxlength: 200 },
    },
    { timestamps: true }
)

// Compound index for fast per-module lookups
TaskResourceSchema.index({ userId: 1, roadmapId: 1, week: 1 })

// Force fresh compile so schema changes are always applied
delete mongoose.models['TaskResource']
const TaskResource = mongoose.model<ITaskResource>('TaskResource', TaskResourceSchema)
export default TaskResource
