import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;
    
    console.log('🛡️ ===================== MIDDLEWARE START =====================');
    console.log('🛡️ Middleware triggered for path:', pathname);
    console.log('🛡️ Token exists:', !!token);
    if (token) {
      console.log('🛡️ Token data:', {
        email: token.email,
        id: token.id,
        role: token.role,
        emailVerified: token.emailVerified,
        profileCompleted: token.profileCompleted
      });
    }
    
    // Allow auth pages without restrictions
    if (pathname.startsWith("/auth/")) {
      console.log('🛡️ Auth page - allowing access to:', pathname);
      return NextResponse.next();
    }
    
    // Allow API routes without restrictions
    if (pathname.startsWith("/api/")) {
      console.log('🛡️ API route - allowing access to:', pathname);
      return NextResponse.next();
    }
    
    // Allow public pages
    if (pathname === "/" || pathname.startsWith("/pricing")) {
      console.log('🛡️ Public page - allowing access to:', pathname);
      return NextResponse.next();
    }
    
    // If no token and trying to access protected routes
    if (!token && (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding"))) {
      console.log('🛡️ ❌ No token found, redirecting to login from:', pathname);
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
    
    // CRITICAL FIX: Only redirect to verification if user is NOT verified AND trying to access protected areas
    if (token && !token.emailVerified) {
      console.log('🛡️ ⚠️ User has token but email NOT verified');
      
      // Allow access to verification page itself
      if (pathname === "/auth/verify-code") {
        console.log('🛡️ Allowing access to verification page');
        return NextResponse.next();
      }
      
      // Only redirect to verification if trying to access dashboard/onboarding
      if (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding")) {
        console.log('🛡️ ❌ Email not verified, redirecting to verification from:', pathname);
        return NextResponse.redirect(new URL("/auth/verify-code", req.url));
      }
      
      // For other pages, allow access (don't force verification everywhere)
      console.log('🛡️ Email not verified but allowing access to non-protected page:', pathname);
      return NextResponse.next();
    }
    
    // If user is verified but profile not completed, redirect to appropriate onboarding
    if (token && token.emailVerified && !token.profileCompleted) {
      console.log('🛡️ ⚠️ User verified but profile NOT completed');
      
      // Allow access to auth flow pages
      if (pathname.startsWith("/auth/")) {
        console.log('🛡️ Allowing access to auth page for profile completion:', pathname);
        return NextResponse.next();
      }
      
      // Allow access to onboarding pages (this is where they complete their profile!)
      if (pathname.startsWith("/onboarding")) {
        console.log('🛡️ Allowing access to onboarding for profile completion:', pathname);
        return NextResponse.next();
      }
      
             // Redirect to role selection ONLY if they don't have a role yet OR trying to access dashboard
       if (pathname.startsWith("/dashboard")) {
         if (!token.role) {
           console.log('🛡️ ❌ No role set, redirecting to role selection from:', pathname);
           return NextResponse.redirect(new URL("/auth/role-selection", req.url));
         } else if (token.role === 'COMPANY') {
           console.log('🛡️ ❌ Company role but profile incomplete, redirecting to company onboarding from:', pathname);
           return NextResponse.redirect(new URL("/onboarding/company", req.url));
         } else if (token.role === 'STUDENT') {
           console.log('🛡️ ❌ Student role but profile incomplete, redirecting to profile setup from:', pathname);
           return NextResponse.redirect(new URL("/auth/setup-profile", req.url));
         }
       }
    }

    console.log('🛡️ ✅ All checks passed, allowing access to:', pathname);
    console.log('🛡️ ===================== MIDDLEWARE END =====================');
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        console.log('🛡️ Authorized callback - Token exists:', !!token);
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