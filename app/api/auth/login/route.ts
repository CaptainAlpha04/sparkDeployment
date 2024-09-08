// app/api/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import client from '@/app/lib/redis'; // Adjust import path if needed
import { db } from '@/app/firebaseconfig';
import { doc, getDoc } from 'firebase/firestore';
import { generateSessionId } from '@/app/utils/session';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  try {
    const userDoc = await getDoc(doc(db, 'users', email));

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const match = await bcrypt.compare(password, userData.password);

      if (match) {
        const sessionId = generateSessionId();
        await client.set(sessionId, JSON.stringify(userData));
        return NextResponse.json({ sessionId });
      } else {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: 'User does not exist' }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Error logging in' }, { status: 500 });
  }
}
