import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;
    
    console.log('🛡️ Middleware - Path:', pathname);
    console.log('🛡️ Middleware - Token exists:', !!token);

    // TEMPORARILY DISABLED - Let dashboard layout handle authentication
    // if (!token && (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding"))) {
    //   console.log('🛡️ Middleware - Redirecting to login (no token)');
    //   return NextResponse.redirect(new URL("/auth/login", req.url));
    // }

    console.log('🛡️ Middleware - Allowing access (middleware disabled)');
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        console.log('🛡️ Middleware authorized callback - Path:', pathname);
        console.log('🛡️ Middleware authorized callback - Token exists:', !!token);
        
        // TEMPORARILY ALLOW ALL - Let dashboard layout handle authentication
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
  ],
}; 