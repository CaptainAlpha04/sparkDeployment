'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '../context/sessionContext';

function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { isLogged, user, logout } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <>
      {/* Header */}
      <header className={`w-screen bg-opacity-0 backdrop-blur-3xl text-gray-100 flex flex-row p-2 px-5 justify-between fixed top-0 z-20 transition-all`}>

        {/* Logo */}
        <Link href='/' className='flex flex-row items-center gap-2 cursor-pointer p-1'>
          <img src="/images/spark web.png" alt="logo" width={150} />
        </Link>

        {/* Navigation Links for desktop */}
        <div className='flex-row hidden items-center gap-12 text-gray-100 lg:visible lg:flex'>
          <Link href="/" className='relative nav-link hover:nav-selected'>Home</Link>
          <Link href="/mission" className='relative nav-link hover:nav-selected'>Our Mission</Link>
          <Link href="/alliance" className='relative nav-link hover:nav-selected'>Alliance</Link>
          <Link href="/events" className='relative nav-link hover:nav-selected'>Events</Link>
          <Link href="/highlights" className='relative nav-link hover:nav-selected'>Highlights</Link>
          {user?.admin && (
            <Link href="/admin" className='relative nav-link hover:nav-selected'>Admin</Link>
          )}
        </div>

        {/* Register Button */}
        <div className='hidden items-center flex-hidden lg:visible lg:flex'>
          {isLogged ? (
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                <div className="w-10 rounded-full">
                  <img alt="User" src={user?.profilePic || '/images/user.png'} />
                </div>
              </div>
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content bg-base-200 rounded-box z-[1] mt-3 p-4 shadow max-w-fit min-w-52">
                <li className='font-bold'>{user?.name}</li>
                <li className='text-xs mb-2 font-light'>{user?.email}</li>
                <li><a onClick={() => router.push('/settings')}>Settings</a></li>
                <li><a onClick={handleLogout}>Logout</a></li>
              </ul>
            </div>
          ) : (
            <Link href="/auth/login" className='btn-stylized'>
              Join Now
            </Link>
          )}
        </div>

        {/* Hamburger Icon */}
        <div className='visible lg:hidden fixed top-4 right-4 z-20'>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-100 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>

        {/* Sidebar */}
        <div className={`fixed top-0 right-0 h-full bg-gray-900 text-gray-100 z-40 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out w-screen h-screen`}>
          {/* Close Button */}
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-gray-100 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* User Info */}
          <div className="m-10">
            {isLogged ? (
              <div className="flex items-center gap-4 mb-6">
                <div className="avatar">
                  <div className="w-12 rounded-full">
                    <img alt="User" src={user?.profilePic || '/images/user.png'} />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold">{user?.name}</span>
                  <span className="text-xs font-light">{user?.email}</span>
                </div>
              </div>
            ) : (
              <Link href="/auth/login" className='btn-stylized'>
                Join Now
              </Link>
            )}

            {/* Navigation Links */}
            <nav className="flex flex-col gap-4 mt-10">
              <Link href="/" className="nav-link hover:nav-selected" onClick={() => setIsOpen(false)}>Home</Link>
              <Link href="/mission" className="nav-link hover:nav-selected" onClick={() => setIsOpen(false)}>Our Mission</Link>
              <Link href="/alliance" className="nav-link hover:nav-selected" onClick={() => setIsOpen(false)}>Alliance</Link>
              <Link href="/events" className="nav-link hover:nav-selected" onClick={() => setIsOpen(false)}>Events</Link>
              <Link href="/highlights" className="nav-link hover:nav-selected" onClick={() => setIsOpen(false)}>Highlights</Link>
              {user?.admin && (
                <Link href="/admin" className="nav-link hover:nav-selected" onClick={() => setIsOpen(false)}>Admin</Link>
              )}
            </nav>

            {/* Settings and Logout Buttons */}
            {isLogged && (
              <div className="mt-10 flex flex-col gap-4">
                <button 
                  onClick={() => { router.push('/settings'); setIsOpen(false); }}
                  className="btn btn-outline">
                  Settings
                </button>
                <button 
                  onClick={() => { handleLogout(); setIsOpen(false); }}
                  className="btn btn-outline">
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
