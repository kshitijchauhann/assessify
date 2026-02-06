import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;

        // Admin Route Protection
        if (path.startsWith("/admin")) {
            // If not admin, redirect to dashboard (or login/error page)
            if (token?.role !== "admin") {
                return NextResponse.redirect(new URL("/dashboard", req.url));
            }
        }

        // User Dashboard Protection
        // Usually only logged in users can see this (handled by withAuth default), 
        // but we can ensure admins don't accidentally use the user dashboard if that involves taking tests etc?
        // Requirement: "admin cannot enter user's dashboard"
        if (path.startsWith("/dashboard")) {
            if (token?.role === "admin") {
                return NextResponse.redirect(new URL("/admin", req.url));
            }
        }
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    matcher: ["/admin/:path*", "/dashboard/:path*"],
};
