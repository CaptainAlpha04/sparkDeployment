'use client'
import React,{useState, useEffect} from 'react'
import Link from 'next/link'

function Header() {
const [route, setRoute] = useState<String | null>('home');
const [isFixed, setIsFixed] = useState(false);
useEffect(() => {
    // Set the initial route when the component mounts
    setRoute(window.location.pathname);

    // Function to handle route change
    const handleRouteChange = () => {
        setRoute(window.location.pathname);
    };

    // Listen to the 'popstate' event for back/forward navigation
    window.addEventListener('popstate', handleRouteChange);

    // Clean up the event listener on component unmount
    return () => {
    window.removeEventListener('popstate', handleRouteChange);
    };
}, []);

useEffect(() => {
    const handleScroll = () => {
        if (window.scrollY > 30) {
        setIsFixed(true);
        } else {
        setIsFixed(false);
        }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
        window.removeEventListener('scroll', handleScroll);
    };
}, []);

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
            <Link href="/auth/register" className='btn-stylized'>
            Join Now
            </Link>
        </div>
    </header>
    </>
)
}

export default Header
