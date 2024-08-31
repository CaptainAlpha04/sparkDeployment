'use client'
import React,{useState, useEffect} from 'react'
import Link from 'next/link'

function Header() {
const [isLogged, setIsLogged] = useState(false)
useEffect(() => {
    const user = localStorage.getItem('user')
    if(user) setIsLogged(true)
    else setIsLogged(false)
}, [])

return (
    <>
    {/* Notification Bar on top*/}
    {/* <section className='bg-slate-950 w-screen text-gray-100 flex flex-row p-2 font-poppins text-xs place-content-center'>
        <div className='flex flex-row items-center gap-2'>
            <i className="fi fi-br-exclamation text-sm mt-[2px]"></i>
            <h1>Event Registration for Google Webinar 2024 is now Live!</h1>
        </div>
    </section> */}

    {/*Header*/}
    <header className={`bg-opacity-0 backdrop-blur-3xl text-gray-100 flex flex-row p-2 px-5 justify-between w-screen fixed top-0 z-20 transition-all`}>

            {/*Logo*/}
            <Link href='/' className='flex flex-row items-center gap-2 cursor-pointer p-1'>
                <img src="/logo.png" alt="logo" className='w-14' />
                <h1 className='text-2xl font-azonix'>SPARK</h1>
            </Link>

            {/*Navigation Links*/}
            <div className='flex flex-row items-center gap-12 text-gray-100'>
                <Link href="/" className='relative nav-link hover:nav-selected'>Home</Link>
                <Link href="/mission" className='relative nav-link hover:nav-selected'>Our Mission</Link>
                <Link href="/institutions" className='relative nav-link hover:nav-selected'>Institutions</Link>
                <Link href="/events" className='relative nav-link hover:nav-selected'>Events</Link>
                <Link href="/highlights" className='relative nav-link hover:nav-selected'>Highlights</Link>
                <Link href="/admin" className='relative nav-link hover:nav-selected'>Admin</Link>

            </div>

        {/*Register Button*/}
        <div className='flex items-center'>
            {
                isLogged ? 
                <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                    <div className="w-10 rounded-full">
                    <img
                        alt="User"
                        src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" />
                    </div>
                </div>
                <ul
                    tabIndex={0}
                    className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
                    <li>
                    <a className="justify-between">
                        Profile
                        <span className="badge">New</span>
                    </a>
                    </li>
                    <li><a>Settings</a></li>
                    <li><a>Logout</a></li>
                </ul>
                </div>
                :
                <Link href="/auth/register" className='btn-stylized'>
                Join Now
                </Link>
            }
        </div>
    </header>
    </>
)
}

export default Header
