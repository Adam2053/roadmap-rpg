import { SignJWT, jwtVerify, JWTPayload as JoseJWTPayload } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)

// Extend jose's JWTPayload so it satisfies the index signature SignJWT requires
export interface AppJWTPayload extends JoseJWTPayload {
  userId: string
  email: string
  name: string
}

export async function signToken(payload: AppJWTPayload): Promise<string> {
  return await new SignJWT(payload as JoseJWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<AppJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as AppJWTPayload
  } catch {
    return null
  }
}

export async function getAuthUser(req?: NextRequest): Promise<AppJWTPayload | null> {
  let token: string | undefined

  if (req) {
    token = req.cookies.get('token')?.value
  } else {
    const cookieStore = await cookies()
    token = cookieStore.get('token')?.value
  }

  if (!token) return null
  return verifyToken(token)
}

export function calcLevel(totalXP: number): number {
  return Math.floor(0.1 * Math.sqrt(totalXP))
}
