import mongoose, { Document, Schema } from 'mongoose'

export interface IFollow extends Document {
    followerId: mongoose.Types.ObjectId  // the person who pressed "Follow"
    followedId: mongoose.Types.ObjectId  // the person being followed (the "mentor")
    createdAt: Date
}

const FollowSchema = new Schema<IFollow>(
    {
        followerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        followedId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
)

// One follow per (follower, followed) pair
FollowSchema.index({ followerId: 1, followedId: 1 }, { unique: true })
// Fast lookup: everyone following a given user
FollowSchema.index({ followedId: 1 })
// Fast lookup: everyone a given user follows
FollowSchema.index({ followerId: 1 })

delete mongoose.models['Follow']
const Follow = mongoose.model<IFollow>('Follow', FollowSchema)
export default Follow
