
import { NextResponse } from 'next/server'

export function middleware(request) {
  // Skip middleware for API routes and static files
  if (
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check if user has the correct password cookie
  const authCookie = request.cookies.get('wedding-auth')
  const correctPassword = process.env.SITE_PASSWORD || 'wedding2025'

  if (authCookie?.value === correctPassword) {
    return NextResponse.next()
  }

  // Redirect to login page
  if (request.nextUrl.pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
