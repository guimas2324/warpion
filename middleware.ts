import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/pricing', '/privacy', '/terms']

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const token = request.cookies.get('sb-iaolheyyewciibkqlyzq-auth-token')
  const isAuthPage = pathname.startsWith('/login') ||
                     pathname.startsWith('/register')
  const isApiRoute = pathname.startsWith('/api')
  const isPublicPage = PUBLIC_PATHS.includes(pathname)

  if (!token && !isAuthPage && !isApiRoute && !isPublicPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/chat', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
