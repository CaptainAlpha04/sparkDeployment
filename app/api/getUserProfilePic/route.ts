import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/firebaseconfig';
import { doc, getDoc } from 'firebase/firestore';
import client from '@/app/lib/redis';

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json();

  try {
    // Fetch session ID and user email from Redis
    const userDataString = await client.get(sessionId);
    if (!userDataString) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userData = JSON.parse(userDataString);
    const userDocRef = doc(db, 'users', userData.email);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const user = userDoc.data();
      return NextResponse.json({ profilePic: user.profilePic || '/default-avatar.png' });
    } else {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile picture' }, { status: 500 });
  }
}
