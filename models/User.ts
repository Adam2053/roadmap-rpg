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
  isProfilePublic: boolean
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
    // Privacy: default to PRIVATE — users must explicitly opt in to public
    isProfilePublic: { type: Boolean, default: false },
  },
  { timestamps: true }
)

// Force fresh compile every time so schema changes (like isProfilePublic)
// are always applied and never stripped by Mongoose strict mode
delete mongoose.models['User']
const User = mongoose.model<IUser>('User', UserSchema)
export default User
