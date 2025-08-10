import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value
  const pathname = req.nextUrl.pathname

  // Halaman yang TIDAK boleh diakses jika sudah login
  const authPages = ["/login", "/register", "/daftar-admin"]

  if (authPages.includes(pathname) && token) {
    const userRole = req.cookies.get("userRole")?.value || "USER"
    const redirectUrl = userRole === "ADMIN" ? "/admin" : "/growth-stats"
    return NextResponse.redirect(new URL(redirectUrl, req.url))
  }

  // Halaman yang WAJIB login (selain authPages)
  const protectedPaths = ["/growth-stats", "/admin"]
  if (protectedPaths.some((path) => pathname.startsWith(path)) && !token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
}

// Aktifkan middleware di halaman tertentu saja
export const config = {
  matcher: ["/login", "/register", "/daftar-admin", "/growth-stats/:path*", "/admin/:path*"],
}
