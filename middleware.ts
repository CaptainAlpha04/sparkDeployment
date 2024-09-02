import { NextResponse } from 'next/server';
import {getCookie} from './app/utils/cookies';

async function fetchUserProfilePic(sessionId: string) {
    try {
        const response = await fetch('/api/getUserProfilePic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user profile picture');
            return false;
        } else {
            return true;
        }
        
    } catch (error) {
        console.error('Error fetching user profile picture:', error);
        return false;
    }
        
}

export function middleware(req: any) {

    const cookies = document.cookie;
    const sessionId = getCookie('sessionId', cookies);
    // Example: Retrieve the authentication token from cookies
    const token = req.cookies.get('authToken');

    // Define the path you want to protect
    const protectedPaths = ['/admin', '/settings'];

    // Check if the current request is for a protected path
    if (protectedPaths.includes(req.nextUrl.pathname)) {
        // If token doesn't exist, redirect to the login page
        if (!token) {
            return NextResponse.redirect(new URL('/auth/login', req.url));
        }
    }

    // Allow the request to continue to the page
    return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/settings'], // Define routes to protect
};
