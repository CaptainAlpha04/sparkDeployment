import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/firebaseconfig';
import { doc, getDoc } from 'firebase/firestore';
import client from '@/app/lib/redis';

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json();

  try {
    // Fetch session ID and user data from Redis
    const userData = await client.get(sessionId);

    if (!userData) {
      return NextResponse.json({ authenticated: false, error: 'Invalid session' }, { status: 401 });
    }
    const userDocRef = doc(db, 'users', userData.email);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const user = userDoc.data();
      return NextResponse.json({
        authenticated: true,
        userData: {
          ...user,
          profilePic: user.profilePic || '/user.png', // Ensure a default profile picture
        },
      });
    } else {
      return NextResponse.json({ authenticated: false, error: 'User not found' }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ authenticated: false, error: 'Failed to fetch user data' }, { status: 500 });
  }
}
