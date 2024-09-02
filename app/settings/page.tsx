"use client";
import { useState, ChangeEvent } from "react";
import { storage } from "../firebaseconfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";

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
      const storageRef = ref(storage, `userpfp/${file.name}`);
      await uploadBytes(storageRef, file);

      const url = await getDownloadURL(storageRef);

      // Fetch session ID from cookies
      const sessionIdCookie = document.cookie.split('; ').find(row => row.startsWith('sessionId='));
      const sessionId = sessionIdCookie ? sessionIdCookie.split('=')[1] : undefined;
      console.log(sessionId);

      // Send request to API route to update profile picture
      const response = await fetch('/api/updatePfp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, profilePic: url }),
      });

      if (response.ok) {
        setSuccess(true);
        router.push('/'); // Redirect to home or any other page
      } else {
        setError("Failed to update profile picture");
      }
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
