import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;
    
    console.log('🛡️ Middleware triggered for:', pathname);
    console.log('🛡️ Token exists:', !!token);
    console.log('🛡️ User email verified:', token?.emailVerified);
    
    // Allow auth pages without restrictions
    if (pathname.startsWith("/auth/")) {
      return NextResponse.next();
    }
    
    // Allow API routes without restrictions
    if (pathname.startsWith("/api/")) {
      return NextResponse.next();
    }
    
    // Allow public pages
    if (pathname === "/" || pathname.startsWith("/pricing")) {
      return NextResponse.next();
    }
    
    // If no token and trying to access protected routes
    if (!token && (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding"))) {
      console.log('🛡️ No token, redirecting to login');
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
    
    // CRITICAL FIX: Only redirect to verification if user is NOT verified AND trying to access protected areas
    if (token && !token.emailVerified) {
      // Allow access to verification page itself
      if (pathname === "/auth/verify-code") {
        return NextResponse.next();
      }
      
      // Only redirect to verification if trying to access dashboard/onboarding
      if (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding")) {
        console.log('🛡️ Email not verified, redirecting to verification');
        return NextResponse.redirect(new URL("/auth/verify-code", req.url));
      }
      
      // For other pages, allow access (don't force verification everywhere)
      return NextResponse.next();
    }
    
    // If user is verified but profile not completed, redirect to role selection
    if (token && token.emailVerified && !token.profileCompleted) {
      // Allow access to auth flow pages
      if (pathname.startsWith("/auth/")) {
        return NextResponse.next();
      }
      
      // Redirect to role selection if trying to access other areas
      if (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding")) {
        console.log('🛡️ Profile not completed, redirecting to role selection');
        return NextResponse.redirect(new URL("/auth/role-selection", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Always return true, let the middleware function handle the logic
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/auth/role-selection",
    "/auth/setup-profile",
  ],
}; 