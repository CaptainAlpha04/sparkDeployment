"use client";
import { useState, ChangeEvent, useEffect } from "react";
import { storage, db } from "../firebaseconfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useSession } from '../context/sessionContext';
import { getCookie } from "../utils/cookies";
import Link from "next/link";

interface UserData {
  name: string;
  email: string;
  university?: string;
  phone?: string;
  degree?: string;
  age?: string;
  profilePic?: string;
}

export default function Settings() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserData>({
    name: '',
    email: '',
    university: '',
    phone: '',
    degree: '',
    age: '',
    profilePic: ''
  });
  const [editMode, setEditMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  
  const router = useRouter();
  const { refreshSession } = useSession();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const sessionId = getCookie('sessionId', document.cookie);
      if (!sessionId) {
        router.push('/auth/login');
        return;
      }

      // Use absolute URL for production
      const baseUrl = window.location.origin;
      
      const response = await fetch(`${baseUrl}/api/checkSession`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();
      if (data.authenticated) {
        setUserData({
          name: data.userData.name || '',
          email: data.userData.email || '',
          university: data.userData.university || '',
          phone: data.userData.phone || '',
          degree: data.userData.degree || '',
          age: data.userData.age || '',
          profilePic: data.userData.profilePic || '/images/user.png'
        });
      } else {
        router.push('/auth/login');
      }
    } catch (error) {
      console.error("Error fetching user data: ", error);
      setError("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const storageRef = ref(storage, `userpfp/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const sessionIdCookie = document.cookie.split('; ').find(row => row.startsWith('sessionId='));
      const sessionId = sessionIdCookie ? sessionIdCookie.split('=')[1] : undefined;

      // Use absolute URL for production
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;

      const response = await fetch(`${baseUrl}/api/updatePfp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, profilePic: url }),
      });

      if (response.ok) {
        setUserData(prev => ({ ...prev, profilePic: url }));
        setSuccess(true);
        await refreshSession();
        setFile(null);
        setTimeout(() => setSuccess(false), 3000);
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

  const handleUpdateProfile = async () => {
    setUpdating(true);
    setError(null);

    try {
      const userRef = doc(db, "users", userData.email);
      await updateDoc(userRef, {
        name: userData.name,
        university: userData.university,
        phone: userData.phone,
        degree: userData.degree,
        age: userData.age,
      });

      setSuccess(true);
      setEditMode(false);
      await refreshSession();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("Failed to update profile");
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen w-screen bg-base-300 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-white"></div>
      </section>
    );
  }

  return (
    <section className="min-h-screen w-screen bg-gradient-to-b from-slate-950 to-base-300">
      {/* Hero Section */}
      <section className='relative flex flex-col w-screen pt-32 p-10 items-center overflow-hidden'>
        {/* Title */}
        <h1 className="text-4xl md:text-7xl mb-3 font-bold text-white z-10 text-center">
          Account Settings
        </h1>

        {/* Subheading */}
        <p className="text-md text-center mb-16 font-light text-white/80 z-10">
          Manage your profile and preferences
        </p>

        {/* Random Geometric Elements */}
        <div className='absolute h-32 w-32 bg-gradient-to-br from-purple-400 to-blue-500 opacity-20 rounded-full top-24 left-32 z-0 blur-xl'></div>
        <div className='absolute h-16 w-16 bg-gradient-to-tr from-blue-600 to-purple-700 opacity-30 rounded-full bottom-20 right-10 z-0 blur-lg'></div>
        <div className='absolute h-20 w-20 bg-gradient-to-bl from-pink-400 to-purple-600 opacity-25 rounded-full top-32 right-32 z-0 blur-xl'></div>
      </section>

      {/* Main Content */}
      <section className="px-6 md:px-20 pb-20">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <Link href="/" className="inline-flex items-center text-white/70 hover:text-white mb-8 transition-colors duration-200">
            <i className="fi fi-sr-arrow-left mr-2"></i> Back to Home
          </Link>

          {/* Success/Error Messages */}
          {success && (
            <div className="backdrop-blur-md bg-green-500/20 border border-green-500/30 rounded-xl p-4 mb-8 text-green-100">
              <div className="flex items-center">
                <i className="fi fi-sr-check-circle mr-3"></i>
                <span>Profile updated successfully!</span>
              </div>
            </div>
          )}
          {error && (
            <div className="backdrop-blur-md bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-8 text-red-100">
              <div className="flex items-center">
                <i className="fi fi-sr-exclamation-triangle mr-3"></i>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Profile Overview Card */}
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-8 mb-8 shadow-2xl">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full ring-4 ring-white/30 ring-offset-4 ring-offset-transparent overflow-hidden mb-4">
                  <img 
                    src={userData.profilePic || '/images/user.png'} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="profile-upload"
                  />
                  <label 
                    htmlFor="profile-upload"
                    className="btn btn-outline btn-sm text-white border-white/30 hover:bg-white/10 cursor-pointer mb-2"
                  >
                    Choose Photo
                  </label>
                  {file && (
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="btn btn-primary btn-sm w-full"
                    >
                      {uploading ? (
                        <>
                          <span className="loading loading-spinner loading-xs"></span>
                          Uploading...
                        </>
                      ) : (
                        'Update Photo'
                      )}
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold text-white mb-2">{userData.name || 'Your Name'}</h2>
                <p className="text-white/70 text-lg mb-4">{userData.email}</p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  {userData.university && (
                    <div className="flex items-center text-white/60">
                      <i className="fi fi-sr-graduation-cap mr-2"></i>
                      <span>{userData.university}</span>
                    </div>
                  )}
                  {userData.degree && (
                    <div className="flex items-center text-white/60">
                      <i className="fi fi-sr-diploma mr-2"></i>
                      <span>{userData.degree}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setEditMode(!editMode)}
                className="btn btn-outline text-white border-white/30 hover:bg-white/10"
              >
                <i className={`fi ${editMode ? 'fi-sr-cross' : 'fi-sr-edit'} mr-2`}></i>
                {editMode ? 'Cancel Edit' : 'Edit Profile'}
              </button>
            </div>
          </div>

          {/* Profile Information Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personal Information */}
            <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <i className="fi fi-sr-user mr-3"></i>
                Personal Information
              </h3>
              
              <div className="space-y-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-white/80 font-medium">Full Name</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={userData.name}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    className="input bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-purple-400 disabled:bg-white/5"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-white/80 font-medium">Email Address</span>
                  </label>
                  <input
                    type="email"
                    value={userData.email}
                    disabled
                    className="input bg-white/5 border-white/10 text-white/60 cursor-not-allowed"
                    placeholder="Email cannot be changed"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-white/80 font-medium">Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={userData.phone}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    className="input bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-purple-400 disabled:bg-white/5"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-white/80 font-medium">Age</span>
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={userData.age}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    className="input bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-purple-400 disabled:bg-white/5"
                    placeholder="Enter your age"
                    min="1"
                    max="120"
                  />
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <i className="fi fi-sr-graduation-cap mr-3"></i>
                Academic Information
              </h3>
              
              <div className="space-y-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-white/80 font-medium">University</span>
                  </label>
                  <input
                    type="text"
                    name="university"
                    value={userData.university}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    className="input bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-purple-400 disabled:bg-white/5"
                    placeholder="Enter your university"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-white/80 font-medium">Degree</span>
                  </label>
                  <input
                    type="text"
                    name="degree"
                    value={userData.degree}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    className="input bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-purple-400 disabled:bg-white/5"
                    placeholder="Enter your degree"
                  />
                </div>

                {/* Save Button */}
                {editMode && (
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleUpdateProfile}
                      disabled={updating}
                      className="btn bg-gradient-to-r from-purple-600 to-blue-600 border-0 text-white hover:from-purple-700 hover:to-blue-700 flex-1"
                    >
                      {updating ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Updating...
                        </>
                      ) : (
                        <>
                          <i className="fi fi-sr-check mr-2"></i>
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditMode(false);
                        fetchUserData();
                      }}
                      className="btn btn-outline text-white border-white/30 hover:bg-white/10"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Account Preferences */}
          <div className="mt-8 backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <i className="fi fi-sr-settings mr-3"></i>
              Preferences
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
                <div>
                  <h4 className="font-semibold text-white">Email Notifications</h4>
                  <p className="text-sm text-white/60">Receive updates about events</p>
                </div>
                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
              </div>
              
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
                <div>
                  <h4 className="font-semibold text-white">Event Reminders</h4>
                  <p className="text-sm text-white/60">Get notified about upcoming events</p>
                </div>
                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
              </div>

              <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
                <div>
                  <h4 className="font-semibold text-white">Marketing Emails</h4>
                  <p className="text-sm text-white/60">Receive promotional content</p>
                </div>
                <input type="checkbox" className="toggle toggle-primary" />
              </div>

              <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
                <div>
                  <h4 className="font-semibold text-white">Profile Visibility</h4>
                  <p className="text-sm text-white/60">Make profile visible to others</p>
                </div>
                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}