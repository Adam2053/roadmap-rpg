import { create } from 'zustand'

export interface UserState {
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
}

interface AuthStore {
  user: UserState | null
  isLoading: boolean
  setUser: (user: UserState | null) => void
  updateXP: (delta: number, category: string, newLevel: number, newStreak: number, newTotal: number) => void
  logout: () => void
  setLoading: (v: boolean) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user, isLoading: false }),

  updateXP: (delta, category, newLevel, newStreak, newTotal) =>
    set((state) => {
      if (!state.user) return state
      const categoryField =
        category === 'Body'
          ? 'bodyXP'
          : category === 'Skills'
          ? 'skillsXP'
          : category === 'Mindset'
          ? 'mindsetXP'
          : 'careerXP'

      return {
        user: {
          ...state.user,
          totalXP: newTotal,
          level: newLevel,
          streak: newStreak,
          [categoryField]: Math.max(0, state.user[categoryField as keyof UserState] as number + delta),
        },
      }
    }),

  logout: () => set({ user: null }),

  setLoading: (v) => set({ isLoading: v }),
}))
