import { NextRequest, NextResponse } from 'next/server'
import { securityHeaders } from './security'

/**
 * Security middleware to add security headers and perform basic security checks
 */
export function securityMiddleware(request: NextRequest) {
  // Clone the response to add headers
  const response = NextResponse.next()
  
  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // Basic security checks
  const url = request.nextUrl
  const userAgent = request.headers.get('user-agent') || ''
  
  // Block suspicious user agents
  const suspiciousUserAgents = [
    'bot', 'crawler', 'spider', 'scanner', 'test', 'curl', 'wget'
  ]
  
  const isSuspicious = suspiciousUserAgents.some(agent => 
    userAgent.toLowerCase().includes(agent)
  )
  
  if (isSuspicious && !url.pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    )
  }
  
  // Prevent clickjacking on sensitive pages
  if (url.pathname.startsWith('/login') || url.pathname.startsWith('/admin')) {
    response.headers.set('X-Frame-Options', 'DENY')
  }
  
  return response
}

/**
 * Rate limiting middleware (simple implementation)
 */
const rateLimitStore = new Map()

export function rateLimitMiddleware(request: NextRequest, limit: number = 100, windowMs: number = 900000) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()
  
  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs })
    return NextResponse.next()
  }
  
  const record = rateLimitStore.get(ip)
  
  if (now > record.resetTime) {
    // Reset the counter
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs })
    return NextResponse.next()
  }
  
  if (record.count >= limit) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    )
  }
  
  record.count++
  return NextResponse.next()
}

/**
 * CSRF protection middleware
 */
export function csrfMiddleware(request: NextRequest) {
  if (request.method === 'GET') {
    return NextResponse.next()
  }
  
  // Skip CSRF for API routes that don't need it
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }
  
  const csrfToken = request.headers.get('x-csrf-token')
  const sessionToken = request.cookies.get('csrf-token')?.value
  
  if (!csrfToken || csrfToken !== sessionToken) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    )
  }
  
  return NextResponse.next()
}

/**
 * Input validation middleware
 */
export function inputValidationMiddleware(request: NextRequest) {
  if (request.method === 'GET') {
    return NextResponse.next()
  }
  
  // Check for suspicious patterns in query parameters
  const searchParams = request.nextUrl.searchParams
  const suspiciousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<\?php/gi,
    /union.*select/gi
  ]
  
  for (const [key, value] of searchParams.entries()) {
    if (suspiciousPatterns.some(pattern => pattern.test(value))) {
      return NextResponse.json(
        { error: 'Suspicious input detected' },
        { status: 400 }
      )
    }
  }
  
  return NextResponse.next()
}