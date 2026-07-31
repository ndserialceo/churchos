import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicPaths = ["/login"]
const authApiPaths = ["/api/auth/login", "/api/auth/refresh"]

// NOTE: In-memory rate limiting resets on server restart and is per-invocation in
// serverless environments. For production, replace with Redis or database-backed
// rate limiting (e.g., @upstash/ratelimit with Redis).
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60_000
const RATE_LIMIT_MAX = 60
const AUTH_RATE_LIMIT_MAX = 10

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded?.split(",")[0]?.trim() || "unknown"
  return ip
}

function checkRateLimit(key: string, max: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  entry.count++
  return entry.count <= max
}

function setSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self' data:;"
  )
  return response
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const rateLimitKey = getRateLimitKey(request)

  // Rate limiting
  if (pathname.startsWith("/api")) {
    const isAuthApi = authApiPaths.some((p) => pathname.startsWith(p))
    const max = isAuthApi ? AUTH_RATE_LIMIT_MAX : RATE_LIMIT_MAX

    if (!checkRateLimit(rateLimitKey, max)) {
      const response = NextResponse.json({ success: false, error: "Too many requests" }, { status: 429 })
      return setSecurityHeaders(response)
    }
  }

  // Public paths - no auth required
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    const response = NextResponse.next()
    return setSecurityHeaders(response)
  }

  // Auth API paths - no access token check (handled by route handlers)
  if (authApiPaths.some((p) => pathname.startsWith(p))) {
    const response = NextResponse.next()
    return setSecurityHeaders(response)
  }

  // API routes - check access token validity
  if (pathname.startsWith("/api")) {
    const accessToken = request.cookies.get("cs_access")?.value
    if (!accessToken) {
      const response = NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
      return setSecurityHeaders(response)
    }

    const response = NextResponse.next()
    return setSecurityHeaders(response)
  }

  // Page routes - check access token presence (detailed validation in route handlers)
  const accessToken = request.cookies.get("cs_access")?.value
  if (!accessToken) {
    const response = NextResponse.redirect(new URL("/login", request.url))
    return setSecurityHeaders(response)
  }

  const response = NextResponse.next()
  return setSecurityHeaders(response)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
