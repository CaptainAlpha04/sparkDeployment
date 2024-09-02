import { NextApiRequest, NextApiResponse } from 'next';
import client from '@/app/lib/redis' // Adjust the path as necessary
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../firebaseconfig';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebaseconfig';

export default async function POST(req: NextApiRequest, res: NextApiResponse) {
  
    const { email, file } = req.body;
    
    if (!email || !file) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      // Upload the file to Firebase Storage
      const storageRef = ref(storage, `userpfp/${email}`);
      await uploadBytes(storageRef, file);

      const url = await getDownloadURL(storageRef);

      // Update Firestore with new profile picture URL
      const userDocRef = doc(db, 'users', email);
      await updateDoc(userDocRef, { profilePic: url });

      // Update Redis session data
      await client.set(`session:${email}`, JSON.stringify({ profilePic: url }));

      res.status(200).json({ profilePic: url });
    } catch (error) {
      console.error('Failed to update profile picture:', error);
      res.status(500).json({ error: 'Failed to upload profile picture' });
    }
}
