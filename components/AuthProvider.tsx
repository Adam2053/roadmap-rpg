'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

const PUBLIC_ROUTES = ['/', '/login', '/register']

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const { user } = await res.json()
          setUser(user)
          if (pathname === '/login' || pathname === '/register') {
            router.replace('/dashboard')
          }
        } else {
          setUser(null)
          if (!PUBLIC_ROUTES.includes(pathname)) {
            router.replace('/login')
          }
        }
      } catch {
        setUser(null)
        if (!PUBLIC_ROUTES.includes(pathname)) {
          router.replace('/login')
        }
      }
    }
    fetchUser()
  }, [pathname, router, setUser, setLoading])

  return <>{children}</>
}
