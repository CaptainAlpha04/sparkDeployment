import React from 'react'
import Link from 'next/link'

function Footer() {
return (
<footer className="footer footer-center bg-gradient-to-b from-base-300 to-black text-base-content p-10 w-screen">
    <aside>
    <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 92.41 97.5"
                className="w-24 h-24 text-current"
            >
                <g id="Layer_2" data-name="Layer 2">
                <g id="Layer_1-2" data-name="Layer 1">
                    <path
                    className="fill-current"
                    d="M39.59,41.44,21.44,31.32,14.4,17,27,24.51l1.48.88ZM16,44.28l-1.68.37L0,47.76l14.92,5.65,20.17-5Zm57.32,0-1.68.37L57.32,47.76l14.92,5.65,20.17-5ZM68.62,64.82,67.12,64,54.35,56.78l7.39,14.14,18.39,9.67ZM50.06,76.32,46.28,60.37,41.54,77.76q2,9.87,4,19.74Q47.79,86.91,50.06,76.32Zm1.08-60.38L47.35,0,42.62,17.39q2,9.87,4,19.74Q48.87,26.54,51.14,15.94ZM13.07,79.42l18.39-9.67,7.39-14.14L26.08,62.8l-1.51.85ZM53.29,42,71.44,31.85l7-14.32L65.88,25.05l-1.48.88Z"
                    />
                </g>
                </g>
            </svg>
    <p className="font-bold font-poppins">
        SPARK Chapter Pakistan
        <br />
    </p>
    <p className='font-light font-poppins'>
        Providing innovative platform for students since forever
    </p>
    <p>Copyright © {new Date().getFullYear()} - All right reserved</p>
    </aside>
    <nav>
        <div className='flex flex-row gap-2 w-96 place-content-center flex-wrap'>
        <Link href='/legal'>
            <p className='btn btn-ghost'>Legal</p>
        </Link>
        <Link href='/sponsorship'>
            <p className='btn btn-ghost'>Sponsorships</p>
        </Link>
        <Link href='/products'>
            <p className='btn btn-ghost'>Products</p>
        </Link>
        <Link href='/products'>
            <p className='btn btn-ghost'>Research</p>
        </Link>
        <Link href='/jobs'>
            <p className='btn btn-ghost'>Opportunities</p>
        </Link>
        </div>
    </nav>
    <nav>
        <p className='mb-2'>Socials</p>
    <div className="grid grid-flow-col gap-6">
        <Link href='https://www.facebook.com/profile.php?id=61564825415487&mibextid=ZbWKwL' target='_blank'>
        <i className='fi fi-brands-facebook text-2xl hover:text-blue-500 duration-200 transition-all'></i>
        </Link>

        <Link href='https://www.instagram.com/sparkchapter?igsh=dzZzMG01NjAxbmNi' target='_blank'>
        <i className='fi fi-brands-instagram text-2xl hover:text-pink-500 duration-200 transition-all'></i>
        </Link>

        <Link href='https://chat.whatsapp.com/FYSriy557mw7FTKxWGprfS' target='_blank'>
        <i className='fi fi-brands-whatsapp text-2xl hover:text-green-500 duration-200 transition-all'></i>
        </Link>

        <Link href='https://discord.com/invite/5Tx5Ev8K' target='_blank'>
        <i className='fi fi-brands-discord text-2xl hover:text-violet-500 duration-200 transition-all'></i>
        </Link>
        
        <Link href='https://www.linkedin.com/company/sparkchapter/' target='_blank'>
        <i className='fi fi-brands-linkedin text-2xl hover:text-sky-500 duration-200 transition-all'></i>
        </Link>
        

    </div>
</nav>
</footer>
)
}

export default Footer
