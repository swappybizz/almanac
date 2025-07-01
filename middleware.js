// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/login(.*)",      // allow /login and all nested paths
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();   // enforce auth on all other routes
  }
});

export const config = {
  matcher: [
    "/((?!_next|.*\\.(?:js|css|png|jpg|svg|ico)).*)",  // catch pages
    "/api/(.*)",                                       // API routes
  ],
};