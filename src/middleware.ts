import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;
    
    // TEMPORARILY DISABLED - Let dashboard layout handle authentication
    // if (!token && (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding"))) {
    //   return NextResponse.redirect(new URL("/auth/login", req.url));
    // }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
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