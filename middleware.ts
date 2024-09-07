import { NextRequest, NextResponse } from 'next/server';

async function getSession(sessionId: string): Promise<[boolean, any]> {
    try {
        const response = await fetch('http://localhost:3000/api/checkSession', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }
    
        const data = await response.json();
        const userData = data.authenticated ? data.userData : null;
        const isAdmin = userData?.admin;
        return [isAdmin, data];
        
    } catch (error) {
        console.error('Error fetching user data:', error);
        return [false, null];
    }   
}

export async function middleware(req: NextRequest) {

    const sessionId = req.cookies.get('sessionId')?.value;
    // Example: Retrieve the authentication token from cookies
    const [isAdmin, token] = await getSession(sessionId || '');

    // Define the path you want to protect
    const protectedPaths = ['/admin', '/settings'];
    const adminOnlyPaths = ['/admin'];

    // Check if the current request is for a protected path
    if (protectedPaths.includes(req.nextUrl.pathname)) {
        // If token doesn't exist, redirect to the login page
        if (!token) {
            console.log('User is not authenticated. Redirecting to login page');
            return NextResponse.redirect(new URL('/auth/login', req.url));
        }
    }

    if (adminOnlyPaths.includes(req.nextUrl.pathname)) {
        if (!isAdmin) {
            console.log('User is not authenticated. Redirecting to login page');
            return NextResponse.redirect(new URL('/auth', req.url));
        }
    }

    // Allow the request to continue to the page
    return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/settings'], // Define routes to protect
};
