export interface UserProfile {
  _id: string
  name: string
  email: string
  totalXP: number
  level: number
  streak: number
  bodyXP: number
  skillsXP: number
  mindsetXP: number
  careerXP: number
  createdAt: string
}

export interface TaskProgress {
  _id: string
  userId: string
  roadmapId: string
  week: number
  day: string
  taskTitle: string
  completed: boolean
  xpEarned: number
  category: string
}

export interface RoadmapDocument {
  _id: string
  userId: string
  goal: string
  difficulty: string
  duration: number
  weeklyPlan: import('./gemini').RoadmapWeek[]
  progress: number
  createdAt: string
}
