import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseconfig'

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/error', request.url).toString()); // Use absolute URL
  }

  try {
    const usersRef = collection(db, 'users');
    const userQuery = query(usersRef, where('verificationToken', '==', token));
    const querySnapshot = await getDocs(userQuery);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0].ref;
      await updateDoc(userDoc, {
        emailVerified: true,
        verificationToken: null, // Token used, clear it
      });
      return NextResponse.redirect(new URL('/success', request.url));
    } else {
      return NextResponse.redirect(new URL('/error', request.url));
    }
  } catch (error) {
    console.error('Error verifying email: ', error);
    return NextResponse.redirect(new URL('/error', request.url));
  }
}
