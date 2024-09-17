import React from 'react'

const universities = [
  {
    name: "NUST - National University of Sciences & Technology",
    description: "NUST students work closely with SPARK to engage in leadership programs and innovation projects, shaping the future of technology.",
    image: "/brandings/nust.png" // Replace with actual image path
  },
  {
    name: "FAST - National University of Computer & Emerging Sciences",
    description: "At FAST, SPARK nurtures the entrepreneurial spirit and supports student-led initiatives that advance research in emerging technologies.",
    image: "/brandings/fast.png" 
  },
  {
    name: "COMSATS Institute of Information Technology",
    description: "COMSATS is a hub of creativity. Through SPARK, students participate in research and entrepreneurship activities that drive technology forward.",
    image: "/brandings/comsats.png" // Replace with actual image path
  },
  {
    name: "AIR University",
    description: "SPARK collaborates with AIR University to promote leadership, empowering students to create innovative solutions for global challenges.",
    image: "/brandings/air.png" // Replace with actual image path
  },
  {
    name: "UCP - University of Central Punjab",
    description: "At UCP, SPARK helps students turn academic projects into real-world applications through mentorship and collaboration.",
    image: "/brandings/ucp.png" // Replace with actual image path
  },
  {
    name: "GIKI - Ghulam Ishaq Khan Institute",
    description: "SPARK's partnership with GIKI encourages innovation and technological advancement through research-driven projects and initiatives.",
    image: "/brandings/giki.png" // Replace with actual image path
  }
];


function page() {
  return (
      <section className="">

        {/* Hero Section*/}
        <section className='relative flex flex-col w-screen pt-32 p-10 items-center bg-gradient-to-r from-purple-950 to-blue-950 overflow-hidden'>
          {/* Title */}
          <h1 className="text-7xl mb-3 font-bold text-white z-10">
            Alliances
          </h1>

          {/* Subheading */}
          <p className="text-md text-center mb-10 font-light text-white z-10">
            Collaborating with the brightest minds and innovative institutions to drive innovation and progress.
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

        <section className="p-10 flex flex-col flex-wrap items-center bg-base-300">
          <h1 className='text-5xl mt-10 font-bold text-center'>Our Chapters</h1>
          <p className='font-light py-4 mb-16 text-center'>Our chapters work across leading universities to cultivate <br /> innovation, leadership, and entrepreneurship, empowering students to turn ideas into impactful solutions.</p>
          <div className='flex flex-row gap-4 flex-wrap place-content-center'>
            {universities.map((alliance, index) => (
              <div key={index} className="bg-base-200 flex flex-col gap-3 items-center text-center shadow-md p-6 max-w-96 w-full rounded-lg hover:bg-white hover:text-gray-900 transition-all duration-500">
                <img src={alliance.image} alt={`${alliance.name} logo`} className="h-40 mb-4"/>
                <h3 className="text-xl font-bold mb-4">
                  {alliance.name}
                </h3>
                <p className="text-sm">
                  {alliance.description}
                </p>
              </div>
            ))}
            </div>
          </section>
          
          {/* Mentors */}
        <section className="p-10 flex flex-col flex-wrap items-center bg-base-300">
          <h1 className='text-5xl mt-10 font-bold text-center'>Our Mentors</h1>
          <p className='font-light py-4 mb-16 text-center'>Our mentors, comprising distinguished professors and industry leaders,<br /> work closely with us to provide personalized guidance and nurture the growth of students into future trailblazers.</p>
        </section>

      </section>
  )
}

export default page
