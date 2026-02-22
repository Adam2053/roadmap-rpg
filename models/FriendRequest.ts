import mongoose, { Document, Schema } from 'mongoose'

export type FriendRequestStatus = 'pending' | 'accepted' | 'declined'

export interface IFriendRequest extends Document {
    senderId: mongoose.Types.ObjectId
    receiverId: mongoose.Types.ObjectId
    status: FriendRequestStatus
    // Cooldown: sender cannot re-request until this date (set on decline)
    resendAfter: Date | null
    createdAt: Date
    updatedAt: Date
    // Pending requests auto-expire after 14 days
    expiresAt: Date
}

const FriendRequestSchema = new Schema<IFriendRequest>(
    {
        senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined'],
            default: 'pending',
        },
        resendAfter: { type: Date, default: null },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // +14 days
            index: { expireAfterSeconds: 0 },  // MongoDB TTL — only fires on 'pending' docs
            // accepted docs don't expire (will be cleaned via app logic if needed)
        },
    },
    { timestamps: true }
)

// Only one active relationship between any two users
FriendRequestSchema.index({ senderId: 1, receiverId: 1 }, { unique: true })
// Fast inbox lookup
FriendRequestSchema.index({ receiverId: 1, status: 1 })
// Fast outbox lookup
FriendRequestSchema.index({ senderId: 1, status: 1 })

delete mongoose.models['FriendRequest']
const FriendRequest = mongoose.model<IFriendRequest>('FriendRequest', FriendRequestSchema)
export default FriendRequest
