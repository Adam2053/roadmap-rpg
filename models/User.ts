import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
  name: string
  email: string
  password: string
  totalXP: number
  level: number
  streak: number
  lastActiveDate: Date | null
  bodyXP: number
  skillsXP: number
  mindsetXP: number
  careerXP: number
  // XP from custom (user-built) roadmaps — intentionally separate from
  // totalXP so the competitive leaderboard (sorted by totalXP) stays fair.
  customXP: number
  isProfilePublic: boolean
  // Connection fields
  followerCount: number           // denormalized # of people following this user as a mentor
  closeFriendCount: number        // denormalized # of accepted close-friend connections
  allowCloseFriendRequests: boolean // when false, no new close-friend requests can be sent
  createdAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    totalXP: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 0, min: 0 },
    streak: { type: Number, default: 0, min: 0 },
    lastActiveDate: { type: Date, default: null },
    bodyXP: { type: Number, default: 0, min: 0 },
    skillsXP: { type: Number, default: 0, min: 0 },
    mindsetXP: { type: Number, default: 0, min: 0 },
    careerXP: { type: Number, default: 0, min: 0 },
    customXP: { type: Number, default: 0, min: 0 },
    // Privacy: default to PRIVATE — users must explicitly opt in to public
    isProfilePublic: { type: Boolean, default: false },
    // Connection counts (denormalized)
    followerCount: { type: Number, default: 0, min: 0 },
    closeFriendCount: { type: Number, default: 0, min: 0 },
    // Privacy toggle: when false no new close-friend requests can be sent to this user
    allowCloseFriendRequests: { type: Boolean, default: true },
  },
  { timestamps: true }
)

// Force fresh compile every time so schema changes are always applied
delete mongoose.models['User']
const User = mongoose.model<IUser>('User', UserSchema)
export default User
