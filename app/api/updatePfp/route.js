import { NextRequest, NextResponse } from 'next/server';
import client from '@/app/lib/redis';
import { db } from '@/app/firebaseconfig';
import { doc, updateDoc } from 'firebase/firestore';

export async function POST(req) {
  const { sessionId, profilePic } = await req.json();

  try {
    const userData = await client.get(sessionId);
    if (!userData) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userDocRef = doc(db, 'users', userData.email);
    await updateDoc(userDocRef, { profilePic });

    // Optionally update session data in Redis
    userData.profilePic = profilePic;
    await client.set(sessionId, JSON.stringify(userData));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update profile picture:', error);
    return NextResponse.json({ error: 'Failed to update profile picture' }, { status: 500 });
  }
}