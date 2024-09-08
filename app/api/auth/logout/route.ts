// app/api/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import client from '@/app/lib/redis'; // Import Upstash Redis client

export async function POST(request: NextRequest) {
  const { sessionId } = await request.json();
  console.log(sessionId)

  try {
    // Delete session from Upstash Redis
    await client.del(sessionId);
    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out:', error);
    return NextResponse.json({ error: 'Error logging out' }, { status: 500 });
  }
}
