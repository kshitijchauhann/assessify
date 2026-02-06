import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;

        // Admin Route Protection
        if (path.startsWith("/admin")) {
            // CRITICAL: Allow access to admin signup page so users can create the first admin account
            if (path === "/admin/signup") {
                return NextResponse.next();
            }

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
            authorized: ({ token, req }) => {
                // Allow access to admin signup page without login
                if (req.nextUrl.pathname === "/admin/signup") {
                    return true;
                }
                // Require login for all other matched paths
                return !!token;
            },
        },
    }
);

export const config = {
    matcher: ["/admin/:path*", "/dashboard/:path*"],
};
