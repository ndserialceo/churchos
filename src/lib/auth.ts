import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { NextRequest } from "next/server"
import { prisma } from "./prisma"

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required")
}
const secret = JWT_SECRET

const ACCESS_TOKEN_EXPIRY = "15m"
const REFRESH_TOKEN_EXPIRY_DAYS = 7

export interface JwtPayload {
  userId: string
  email: string
  role: string
  branchId: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (password.length < 8) errors.push("Password must be at least 8 characters")
  if (!/[A-Z]/.test(password)) errors.push("Password must contain at least one uppercase letter")
  if (!/[a-z]/.test(password)) errors.push("Password must contain at least one lowercase letter")
  if (!/[0-9]/.test(password)) errors.push("Password must contain at least one number")
  return { valid: errors.length === 0, errors }
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, secret, { expiresIn: ACCESS_TOKEN_EXPIRY })
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: "refresh" }, secret, { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` })
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload
    if ((decoded as unknown as Record<string, unknown>).type === "refresh") return null
    return decoded
  } catch {
    return null
  }
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, secret) as Record<string, unknown>
    if (decoded.type !== "refresh") return null
    return { userId: decoded.userId as string }
  } catch {
    return null
  }
}

const ACCESS_COOKIE = "cs_access"
const REFRESH_COOKIE = "cs_refresh"
const CSRF_COOKIE = "cs_csrf"

export function getCookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    ...(maxAge !== undefined ? { maxAge } : {}),
  }
}

export function getCsrfCookieOptions(maxAge?: number) {
  return {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    ...(maxAge !== undefined ? { maxAge } : {}),
  }
}

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies()
  cookieStore.set(ACCESS_COOKIE, accessToken, getCookieOptions(15 * 60))
  cookieStore.set(REFRESH_COOKIE, refreshToken, getCookieOptions(REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60))
}

export async function clearAuthCookies() {
  const cookieStore = await cookies()
  cookieStore.set(ACCESS_COOKIE, "", { ...getCookieOptions(0), maxAge: 0 })
  cookieStore.set(REFRESH_COOKIE, "", { ...getCookieOptions(0), maxAge: 0 })
  cookieStore.set(CSRF_COOKIE, "", { ...getCookieOptions(0), maxAge: 0 })
}

export function getCsrfToken(): string {
  const array = new Uint8Array(32)
  globalThis.crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("")
}

export function generateCsrfPair() {
  const token = getCsrfToken()
  return { token, cookie: token }
}

export async function createRefreshToken(userId: string, replacedBy?: string) {
  const token = signRefreshToken(userId)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS)

  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
      replacedBy: replacedBy || null,
    },
  })
  return token
}

export async function rotateRefreshToken(oldToken: string) {
  const payload = verifyRefreshToken(oldToken)
  if (!payload) return null

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: oldToken },
  })

  if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
    if (storedToken?.isRevoked) {
      await prisma.refreshToken.updateMany({
        where: { userId: payload.userId, isRevoked: false },
        data: { isRevoked: true },
      })
    }
    return null
  }

  const newRefreshToken = await createRefreshToken(payload.userId, oldToken)

  await prisma.refreshToken.update({
    where: { token: oldToken },
    data: { isRevoked: true, replacedBy: newRefreshToken },
  })

  const userPayload = await getUserPayload(payload.userId)
  if (!userPayload) return null
  return { accessToken: signAccessToken(userPayload), refreshToken: newRefreshToken }
}

async function getUserPayload(userId: string): Promise<JwtPayload | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, branchId: true, isActive: true },
  })
  if (!user || !user.isActive) return null
  return { userId: user.id, email: user.email, role: user.role, branchId: user.branchId }
}

export async function authenticateFromCookies(request: NextRequest): Promise<JwtPayload | null> {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value
  if (accessToken) {
    const payload = verifyAccessToken(accessToken)
    if (payload) return payload
  }

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value
  if (refreshToken) {
    const result = await rotateRefreshToken(refreshToken)
    if (result) return verifyAccessToken(result.accessToken)
  }

  return null
}

export function getAuthenticatedUser(request: NextRequest): JwtPayload | null {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value
  if (!accessToken) return null
  return verifyAccessToken(accessToken)
}

export function requireAuth(request: NextRequest): JwtPayload {
  const user = getAuthenticatedUser(request)
  if (!user) throw new Error("Unauthorized")
  return user
}

export function requireRole(request: NextRequest, roles: string[]): JwtPayload {
  const user = requireAuth(request)
  if (!roles.includes(user.role)) throw new Error("Forbidden")
  return user
}

export function getBranchId(request: NextRequest, userOverride?: JwtPayload): string {
  const user = userOverride || getAuthenticatedUser(request)
  if (!user) throw new Error("Unauthorized")
  return user.branchId
}

export async function logAudit(params: {
  userId?: string
  branchId?: string
  action: string
  entity: string
  entityId?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId || null,
      branchId: params.branchId || null,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId || null,
      oldValues: params.oldValues ? JSON.parse(JSON.stringify(params.oldValues)) : undefined,
      newValues: params.newValues ? JSON.parse(JSON.stringify(params.newValues)) : undefined,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
    },
  })
}
