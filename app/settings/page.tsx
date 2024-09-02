"use client";
import { useState, ChangeEvent } from "react";
import { storage, db } from "../firebaseconfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

// Define the type for the user object stored in local storage
interface User {
  email: string;
  profilePic?: string;
}

export default function Settings() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const router = useRouter();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file");
      return;
    }

    setUploading(true);

    try {
      const userString = localStorage.getItem('user');
      if (!userString) throw new Error("User not found in local storage");

      const user: User = JSON.parse(userString);
      const storageRef = ref(storage, `userpfp/${user.email}`);
      await uploadBytes(storageRef, file);

      const url = await getDownloadURL(storageRef);

      // Update Firestore with new profile picture URL
      const userDocRef = doc(db, 'users', user.email);
      await updateDoc(userDocRef, { profilePic: url });

      // Update local storage
      user.profilePic = url;
      localStorage.setItem('user', JSON.stringify(user));

      setSuccess(true);
      window.location.reload();
    } catch (err) {
      setError("Failed to upload profile picture");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="btn btn-neutral mt-4"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
        {success && <p className="text-green-600 mt-4">Profile picture updated successfully</p>}
        {error && <p className="text-red-600 mt-4">{error}</p>}
      </div>
    </div>
  );
}
