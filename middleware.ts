import { NextRequest, NextResponse } from 'next/server';

async function getSession(sessionId: string): Promise<[boolean, any]> {
    try {
        // Use environment variable or construct the URL dynamically
        const baseUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}`;
        
        const response = await fetch(`${baseUrl}/api/checkSession`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }
    
        const data = await response.json();
        const isAdmin = data.authenticated && data.userData?.admin;
        return [isAdmin, data];  // Return the entire 'data' object here
        
    } catch (error) {
        console.error('Error fetching user data:', error);
        return [false, null];
    }
}

export async function middleware(req: NextRequest) {

    const sessionId = req.cookies.get('sessionId')?.value;
    const [isAdmin, data] = await getSession(sessionId || '');

    const protectedPaths = ['/admin', '/settings'];
    const loggedInRestrictedPaths = ['/auth/login', '/auth/register'];
    const adminOnlyPaths = ['/admin'];

    // Check if the current request is for a protected path
    if (protectedPaths.includes(req.nextUrl.pathname)) {
        if (!data?.authenticated) {
            console.log('User is not authenticated. Redirecting to login page');
            return NextResponse.redirect(new URL('/auth/login', req.url));
        }
    }

    // // If user is already logged in, redirect to the home page and disallow access to login and register pages
    // if (loggedInRestrictedPaths.includes(req.nextUrl.pathname)) {
    //     if (data?.authenticated) {
    //         console.log('User is already authenticated. Redirecting to home page');
    //         return NextResponse.redirect(new URL('/', req.url));
    //     }
    // }

    // If the current request is for an admin-only path
    if (adminOnlyPaths.includes(req.nextUrl.pathname)) {
        if (!isAdmin) {
            console.log('User is not an admin. Redirecting to login page');
            return NextResponse.redirect(new URL('/auth/login', req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/settings'], // Define routes to protect
};