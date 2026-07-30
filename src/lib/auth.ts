import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { NextRequest } from "next/server"
import { prisma } from "./prisma"

const JWT_SECRET = process.env.JWT_SECRET || "churchos-secret-change-in-production"

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

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7)
  }
  const cookie = request.cookies.get("token")
  return cookie?.value || null
}

export function getAuthenticatedUser(request: NextRequest): JwtPayload | null {
  const token = getTokenFromRequest(request)
  if (!token) return null
  return verifyToken(token)
}

export function requireAuth(request: NextRequest): JwtPayload {
  const user = getAuthenticatedUser(request)
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

export function requireRole(request: NextRequest, roles: string[]): JwtPayload {
  const user = requireAuth(request)
  if (!roles.includes(user.role)) {
    throw new Error("Forbidden")
  }
  return user
}

export function getBranchId(request: NextRequest, userOverride?: JwtPayload): string {
  const user = userOverride || getAuthenticatedUser(request)
  if (!user) throw new Error("Unauthorized")
  return user.branchId
}