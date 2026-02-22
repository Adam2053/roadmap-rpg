import mongoose, { Document, Schema } from 'mongoose'

export interface IRoadmapStar extends Document {
    userId: mongoose.Types.ObjectId    // the user who gave the star
    roadmapId: mongoose.Types.ObjectId // the roadmap that was starred
    createdAt: Date
}

const RoadmapStarSchema = new Schema<IRoadmapStar>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        roadmapId: { type: Schema.Types.ObjectId, ref: 'Roadmap', required: true },
    },
    { timestamps: true }
)

// Compound unique index: one star per user per roadmap
RoadmapStarSchema.index({ userId: 1, roadmapId: 1 }, { unique: true })
// Fast lookup: all stars for a roadmap
RoadmapStarSchema.index({ roadmapId: 1 })
// Fast lookup: all roadmaps starred by a user
RoadmapStarSchema.index({ userId: 1 })

delete mongoose.models['RoadmapStar']
const RoadmapStar = mongoose.model<IRoadmapStar>('RoadmapStar', RoadmapStarSchema)
export default RoadmapStar
