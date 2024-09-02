import { NextResponse,NextRequest } from 'next/server';
import client from  '@/app/lib/redis' 

export async function POST(request: NextRequest) {
  const { sessionId } = await request.json();

  try {
    await client.del(sessionId);
    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Error logging out' }, { status: 500 });
  }
}
