import React from 'react'

function Page() {
return (
    <section className='w-screen h-screen place-content-center'>
        <div className='flex flex-col w-screen md:flex-row'>
            <img src="/images/not-found.png" alt="Not Found" className='md:h-72 md:w-72 h-52 w-52 self-center'/>
            <div className='md:divider md:divider-horizontal'></div>
            <div className='text-center md:text-left'>
                <h1 className='font-poppins font-extrabold text-9xl'>404</h1>
                <h1>
                    <span className='font-poppins font-extrabold text-4xl text-primary'>Page Not Found</span>
                    <br/>
                    <span className='font-poppins font-light text-2xl'>The page you are looking for does not exist!</span>
                </h1>
            </div>

        </div>
    </section>
)
}

export default Page
