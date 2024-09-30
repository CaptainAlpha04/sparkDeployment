import React from 'react'

function page() {
  return (
    <>
      <section className='w-screen h-screen bg-base-300'>
        {/* Hero Section*/}
        <section className='relative flex flex-col w-screen pt-32 p-10 items-center bg-gradient-to-r from-purple-950 to-blue-950 overflow-hidden'>
          {/* Title */}
          <h1 className="text-4xl md:text-7xl mb-3 font-bold text-white z-10 text-center">
            Legal Information
          </h1>

          {/* Subheading */}
          <p className="text-md text-center mb-10 font-light text-white z-10">
            Legal information about our organization and our privacy policy.
          </p>

          {/* Random Geometric Elements */}
          <div className='absolute h-32 w-32 bg-gradient-to-br from-purple-400 to-blue-500 opacity-30 rounded-full top-24 left-32 z-0'></div>
          <div className='absolute h-16 w-16 bg-gradient-to-tr from-blue-600 to-purple-700 opacity-40 rounded-full bottom-20 right-10 z-0'></div>
          <div className='absolute h-20 w-20 bg-gradient-to-bl from-pink-400 to-purple-600 opacity-40 rounded-full top-32 right-32 z-0'></div>
          <div className='absolute h-12 w-12 bg-gradient-to-bl from-pink-500 to-blue-600 opacity-40 transform rotate-45 bottom-10 left-36 z-0'></div>

          {/* Lines or Triangles */}
          <div className='absolute h-1 w-24 bg-gradient-to-r from-blue-500 to-transparent opacity-50 top-44 left-10 z-0'></div>
          <div className='absolute h-1 w-16 bg-gradient-to-r from-purple-500 to-transparent opacity-50 bottom-24 right-24 z-0'></div>
          <div className='absolute h-10 w-10 border-t-4 border-l-4 border-pink-400 opacity-40 transform rotate-45 bottom-36 left-56 z-0'></div>

          {/* Divider */}
          <div className='absolute h-1 w-screen bottom-0 bg-gradient-to-r from-purple-600 to-blue-600'></div>
        </section>

        <h1 className='p-10 text-center'>Page Under Construction!</h1>
      </section>
    </>
  )
}

export default page
