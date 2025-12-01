import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Helper function to check if student has completed discovery quiz
function hasCompletedDiscoveryQuiz(userBio: string | null | undefined): boolean {
  if (!userBio) return false;
  
  try {
    const bioData = JSON.parse(userBio);
    return bioData.discoveryCompleted === true;
  } catch (error) {
    return false;
  }
}

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
    
    // Handle admin routes separately
    if (pathname.startsWith("/admin")) {
      console.log('🛡️ Admin route detected:', pathname);
      if (!token) {
        console.log('🛡️ ❌ No token for admin route, redirecting to login');
        return NextResponse.redirect(new URL("/auth/login", req.url));
      }
      if (token.role !== 'ADMIN') {
        console.log('🛡️ ❌ Non-admin user trying to access admin route, redirecting to dashboard');
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      console.log('🛡️ ✅ Admin user, allowing access to admin route');
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
    
    // Check if student has completed Phase 2 (detailed profile with education info)
    // Only redirect when trying to apply or use restricted features, not for general browsing
    if (token && token.emailVerified && token.profileCompleted && token.role === 'STUDENT') {
      // Check if they have completed the detailed profile (Phase 2) by looking for education fields
      const hasDetailedProfile = !!(token.university || token.highSchool || token.major || token.subjects);
      
      // Only redirect on specific action pages, not general dashboard browsing
      const restrictedPaths = [
        '/dashboard/projects/apply',
        // '/dashboard/chat', // Chat is now allowed for all students
        '/api/applications/',
        // '/api/chat' // Chat API is now allowed
      ];
      
      const isRestrictedAction = restrictedPaths.some(path => pathname.startsWith(path));
      
      if (!hasDetailedProfile && isRestrictedAction) {
        console.log('🛡️ ❌ Student trying to use restricted feature without completed Phase 2, redirecting to profile page from:', pathname);
        return NextResponse.redirect(new URL("/dashboard/profile?action=required", req.url));
      }
    }
    
    // If user is verified but profile not completed, redirect to appropriate onboarding
    // IMPORTANT: profileCompleted now means "Phase II complete" (has CV data)
    // Phase I complete means they have onboardingPhase set and can access dashboard
    if (token && token.emailVerified && !token.profileCompleted) {
      console.log('🛡️ ⚠️ User verified but Phase II NOT completed (profileCompleted: false)');
      console.log('🛡️ Onboarding phase:', token.onboardingPhase);
      
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
        const url = new URL(req.url);
        const isOnboardingComplete = url.searchParams.get('onboarding_complete') === 'true';
        const isPhase2Transition = url.searchParams.get('phase') === '2' || url.searchParams.get('phase') === 'cv_building';
        
        // Allow Phase 2 (CV builder) transition even if session hasn't updated yet
        if (isPhase2Transition && token.role === 'STUDENT') {
          console.log('🛡️ ✅ Allowing Phase II transition for student (session may not be updated yet)');
          return NextResponse.next();
        }
        
        if (isOnboardingComplete && pathname === '/dashboard/profile') {
          console.log('🛡️ ✅ Allowing onboarding completion flow to profile page');
          return NextResponse.next();
        }
        
        // CRITICAL FIX: If onboardingPhase is 'complete' or 'cv_building', allow dashboard access
        // Phase I is done, Phase II (CV) is optional and triggered when applying
        if (token.onboardingPhase === 'complete' || token.onboardingPhase === 'cv_building') {
          console.log('🛡️ ✅ Phase I complete (onboardingPhase:', token.onboardingPhase, '), allowing dashboard access');
          return NextResponse.next();
        }
        
        if (!token.role) {
          console.log('🛡️ ❌ No role set, redirecting to role selection from:', pathname);
          return NextResponse.redirect(new URL("/auth/role-selection", req.url));
        } else if (token.role === 'COMPANY') {
          console.log('🛡️ ❌ Company role but profile incomplete, redirecting to company onboarding from:', pathname);
          return NextResponse.redirect(new URL("/onboarding/company", req.url));
        } else if (token.role === 'STUDENT') {
          console.log('🛡️ ❌ Student role but Phase I incomplete, redirecting to setup-profile from:', pathname);
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
    "/admin/:path*",
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/auth/role-selection",
    "/auth/setup-profile",
  ],
}; 