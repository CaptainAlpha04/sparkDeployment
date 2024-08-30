//app/api/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc,setDoc } from 'firebase/firestore';
import { db } from '../../firebaseconfig';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/error', request.url).toString()); // Use absolute URL
  }

  try {
    const pendingUsersRef = collection(db, 'pending_users');
    const userQuery = query(pendingUsersRef, where('verificationToken', '==', token));
    const querySnapshot = await getDocs(userQuery);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // Move user to main collection
      await setDoc(doc(db, 'users', userData.email), {
        ...userData,
        emailVerified: true,
        verificationToken: null,
      });

      // Delete user from pending collection
      await deleteDoc(userDoc.ref);

      return NextResponse.redirect(new URL('/success', request.url));
    } else {
      return NextResponse.redirect(new URL('/error', request.url));
    }
  } catch (error) {
    console.error('Error verifying email: ', error);
    return NextResponse.redirect(new URL('/error', request.url));
  }
}
