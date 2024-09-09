'use client';
import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCookie } from '../utils/cookies';

async function fetchUserProfilePic(sessionId: string) {
  try {
    const response = await fetch('/api/checkSession', { // Updated endpoint to match the session check API
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile picture');
    }

    const data = await response.json();
    return data.authenticated ? data.userData.profilePic || '/user.png' : '/user.png'; // Ensure to return profilePic if authenticated
  } catch (error) {
    console.error('Error fetching user profile picture:', error);
    return '/user.png'; // Fallback to a default avatar on error
  }
}

async function fetchUserData(sessionId: string) {
  try {
    const response = await fetch('/api/checkSession', { // Updated endpoint to match the session check API
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    const data = await response.json();
    return data.authenticated ? data.userData : null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

function Header() {
  const [isLogged, setIsLogged] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [profilePic, setProfilePic] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const cookies = document.cookie;
    const sessionId = getCookie('sessionId', cookies);

    if (sessionId) {
      setIsLogged(true);
      fetchUserProfilePic(sessionId).then(setProfilePic);
      fetchUserData(sessionId).then((userData) => {
        if (userData) {
          console.log(userData);
          setName(userData.name);
          setEmail(userData.email);
          setIsAdmin(userData.admin);
        }
      });
    } else {
      setIsLogged(false);
    }
  }, []);

  // Handle logout
  const logOut = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: getCookie('sessionId', document.cookie) }),
      });

      document.cookie = 'sessionId=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'; // Clear the cookie
      setIsLogged(false);
      // Redirect or update the UI as needed
      router.push('/'); // Redirect to login page or other page as needed
    } catch (error) {
      console.error('Error logging out', error);
    }
  };

  return (
    <>
      {/* Notification Bar on top */}
      {/* <section className='fixed top-0 bg-slate-950 w-screen text-gray-100 flex flex-row p-2 font-poppins text-xs place-content-center z-20'>
          <div className='flex flex-row items-center gap-2'>
              <i className="fi fi-br-exclamation text-sm mt-[2px]"></i>
              <h1>Event Registration for Google Webinar 2024 is now Live!</h1>
          </div>
      </section> */}

      {/* Header */}
      <header className={`bg-opacity-0 backdrop-blur-3xl text-gray-100 flex flex-row p-2 px-5 justify-between w-screen fixed top-0 z-20 transition-all`}>

        {/* Logo */}
        <Link href='/' className='flex flex-row items-center gap-2 cursor-pointer p-1'>
          <img src="/images/logo.png" alt="logo" className='w-14' />
          <h1 className='text-2xl font-azonix'>SPARK</h1>
        </Link>

        {/* Navigation Links for desktop */}
        <div className='flex flex-row items-center gap-12 text-gray-100 md:hidden '>
          <Link href="/" className='relative nav-link hover:nav-selected'>Home</Link>
          <Link href="/mission" className='relative nav-link hover:nav-selected'>Our Mission</Link>
          <Link href="/institutions" className='relative nav-link hover:nav-selected'>Institutions</Link>
          <Link href="/events" className='relative nav-link hover:nav-selected'>Events</Link>
          <Link href="/highlights" className='relative nav-link hover:nav-selected'>Highlights</Link>
          {
            isAdmin &&
            <Link href="/admin" className='relative nav-link hover:nav-selected'>Admin</Link>
          }
        </div>

        {/* Register Button */}
        <div className='flex items-center md:hidden'>
          {
            isLogged ?
              <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                  <div className="w-10 rounded-full">
                    <img alt="User" src={profilePic || '/images/profile-user.png'} />
                  </div>
                </div>
                <ul
                  tabIndex={0}
                  className="menu menu-sm dropdown-content bg-base-200 rounded-box z-[1] mt-3 p-2 shadow max-w-fit min-w-52">
                  <li className='font-bold'>{name}</li>
                  <li className='text-xs mb-2 font-light'>{email}</li>
                  <li><a onClick={() => router.push('/settings')}>Settings</a></li>
                  <li><a onClick={logOut}>Logout</a></li>
                </ul>
              </div>
              :
              <Link href="/auth/login" className='btn-stylized'>
                Join Now
              </Link>
          }
        </div>

        {/* Navigation Links for  */}
        {/* Hamburger Icon */}
      <div className='md:visible fixed top-4 left-4 z-50'>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-100 focus:outline-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full bg-gray-900 text-gray-100 z-40 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out w-64`}>
        {/* Close Button */}
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-gray-100 focus:outline-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* User Info */}
        <div className="p-6">
          {
            isLogged ? (
              <div className="flex items-center gap-4 mb-6">
                <div className="avatar">
                  <div className="w-12 rounded-full">
                    <img alt="User" src={profilePic || '/images/profile-user.png'} />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold">{name}</span>
                  <span className="text-xs font-light">{email}</span>
                </div>
              </div>
            ) : (
              <Link href="/auth/login" className='btn-stylized mb-6'>
                Join Now
              </Link>
            )
          }

          {/* Navigation Links */}
          <nav className="flex flex-col gap-4">
            <Link href="/" className="nav-link hover:nav-selected" onClick={() => setIsOpen(false)}>Home</Link>
            <Link href="/mission" className="nav-link hover:nav-selected" onClick={() => setIsOpen(false)}>Our Mission</Link>
            <Link href="/institutions" className="nav-link hover:nav-selected" onClick={() => setIsOpen(false)}>Institutions</Link>
            <Link href="/events" className="nav-link hover:nav-selected" onClick={() => setIsOpen(false)}>Events</Link>
            <Link href="/highlights" className="nav-link hover:nav-selected" onClick={() => setIsOpen(false)}>Highlights</Link>
            {
              isAdmin && (
                <Link href="/admin" className="nav-link hover:nav-selected" onClick={() => setIsOpen(false)}>Admin</Link>
              )
            }
          </nav>

          {/* Settings and Logout Buttons */}
          {isLogged && (
            <div className="mt-auto flex flex-col gap-4">
              <button 
                onClick={() => { router.push('/settings'); setIsOpen(false); }}
                className="w-full py-2 px-4 bg-blue-600 rounded-lg text-white font-semibold">
                Settings
              </button>
              <button 
                onClick={() => { logOut(); setIsOpen(false); }}
                className="w-full py-2 px-4 bg-red-600 rounded-lg text-white font-semibold">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
      </header>
    </>
  );
}

export default Header;
