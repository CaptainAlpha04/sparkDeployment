'use client'
import React, {useState, useEffect} from 'react'

const elements = [
  {
    name: 'Research',
    description: 'Delving into scientific research to discover groundbreaking solutions in technology and beyond.',
    image: '/images/atom.png',
    color: 'hover:bg-blue-500',
  },
  {
    name: 'Entrepreneurship',
    description: 'Fostering creativity and innovation through entrepreneurship, paving the way for future leaders and innovators.',
    image: '/images/rocket.png',
    color: 'hover:bg-black',
  },
  {
    name: 'Innovation',
    description: 'Pioneering creative and transformative solutions that shape the future of science and technology.',
    image: '/images/fire.png',
    color: 'hover:bg-orange-500',
  },
  {
    name: 'Leadership',
    description: 'Cultivating leadership skills that inspire individuals and teams to reach their fullest potential.',
    image: '/images/chess.png',
    color: 'hover:bg-red-500',
  },
  {
    name: 'Creativity',
    description: 'Inspiring Creative thinking and artistic expression to drive revolutionary change.',
    image: '/images/creative.png',
    color: 'hover:bg-purple-500',
  },
  {
    name: 'Education',
    description: 'Providing educational resources to empower the next generation of tech leaders and innovators.',
    image: '/images/book.png',
    color: 'hover:bg-blue-950',
  },
  {
    name: 'Technology',
    description: 'Driving technological advancements that push the boundaries of what’s possible in today’s world.',
    image: '/images/cpu.png',
    color: 'hover:bg-cyan-500',
  },
  {
    name: 'Collaboration',
    description: 'Encouraging teamwork and collaboration to solve problems and create innovative solutions together.',
    image: '/images/teamwork.png',
    color: 'hover:bg-green-500',
  }
]

function Page() {
  const [scrollY, setScrollY] = useState(0);
  const [sectionHeight, setSectionHeight] = useState(0);
  const [sectionTop, setSectionTop] = useState(0);

  const handleScroll = () => {
    setScrollY(window.scrollY);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    
    // Calculate the section height and top position
    const section = document.getElementById('parallax-section');
    if (section) {
      setSectionHeight(section.offsetHeight);
      setSectionTop(section.offsetTop);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const maxScroll = sectionTop + sectionHeight;
  return (
    <>    
      {/* Hero Section */}
      <section id="parallax-section" className='relative flex flex-col items-center justify-center w-screen h-screen bg-gradient-to-b from-black via-slate-950 to-blue-950'>
      {/* Text: Trad Chinese and Our Mission */}
      <h1 className='absolute text-8xl md:text-9xl font-tc text-slate-700 opacity-80 p-4 animation-fade-in'
          style={{ transform: `translateY(${Math.min(scrollY * 0.3, maxScroll - sectionTop)}px)` }}>
        {'傳道部'}
      </h1>
      <h1 className="absolute text-4xl md:text-4xl font-extrabold drop-shadow-lg p-4 animation-swipe-from-bottom"
          style={{ transform: `translateY(${Math.min(scrollY * 0.3, maxScroll - sectionTop)}px)` }}>
        OUR MISSION
      </h1>

      {/* Parallax effect on the mountains */}
      <div className='w-screen absolute bottom-10 md:bottom-32'>
        <img src="/designs/layer-8.png" alt="" className='absolute animation-fade-in'
             style={{ transform: `translateY(${Math.min(scrollY * 0.0, maxScroll - sectionTop)}px)` }} />
        <img src="/designs/layer-7.png" alt="" className='absolute animation-fade-in'
             style={{ transform: `translateY(${Math.min(scrollY * 0.08, maxScroll - sectionTop)}px)` }} />
        <img src="/designs/layer-6.png" alt="" className='absolute animation-fade-in'
             style={{ transform: `translateY(${Math.min(scrollY * 0.1, maxScroll - sectionTop)}px)` }} />
        <img src="/designs/layer-5.png" alt="" className='absolute animation-fade-in'
             style={{ transform: `translateY(${Math.min(scrollY * 0.16, maxScroll - sectionTop)}px)` }} />
        <img src="/designs/layer-4.png" alt="" className='absolute animation-fade-in'
             style={{ transform: `translateY(${Math.min(scrollY * 0.18, maxScroll - sectionTop)}px)` }} />
        <img src="/designs/layer-3.png" alt="" className='absolute animation-fade-in'
             style={{ transform: `translateY(${Math.min(scrollY * 0.24, maxScroll - sectionTop)}px)` }} />
        <img src="/designs/layer-2.png" alt="" className='absolute animation-fade-in'
             style={{ transform: `translateY(${Math.min(scrollY * 0.32, maxScroll - sectionTop)}px)` }} />
        <img src="/designs/layer-1.png" alt="" className='absolute animation-fade-in'
             style={{ transform: `translateY(${Math.min(scrollY * 0.34, maxScroll - sectionTop)}px)` }} />
      </div>
    </section>

          {/* Mottos */}
          <section className='flex flex-col items-center justify-center w-screen h-fit p-24 py-60 md:py-64 bg-[#102866]'>
          </section>

          {/* Mission Statement */}
          <section className='relative flex flex-col justify-center w-screen h-fit pb-20 bg-gradient-to-b from-[#102866] to-slate-950 px-4'>
            <h1 className='text-6xl font-bold opacity-60 mb-10 mt-10 text-center md:text-center'>Welcome to SPARK</h1>
            <div className='text-lg px-2 lg:px-64 text-wrap flex flex-col gap-4'>
              <p>
              Where we believe that innovation thrives at the intersection of creativity, knowledge, and collaboration. Our mission is to foster a vibrant community where students, professionals, and visionaries come together to push the boundaries of {`what's`} possible. By nurturing entrepreneurial spirit, promoting cutting-edge research, and cultivating artistic and technological ingenuity, we aim to inspire individuals to lead the charge in creating revolutionary solutions for the {`world's`} most pressing challenges.
              </p>
              <p>
              We are committed to creating a platform that empowers future leaders to dream boldly and act decisively. Through mentorship, collaboration, and immersive learning experiences, SPARK equips its members with the tools, resources, and support needed to translate ideas into tangible impact. Our focus is on nurturing innovation in every field, ensuring that creative thinking is woven into the fabric of academia, technology, and leadership.
              </p>
              <p>
              At SPARK, we envision a future where the brightest minds are connected, and innovation knows no bounds. Together, we strive to ignite the potential in each member of our community, fostering a spirit of curiosity, resilience, and purpose that will light the way to a brighter, more inclusive future.
              </p>  
            </div>
          </section>

          {/* SPARK elements */}
          <section className="relative w-screen h-fit py-20 px-10 flex flex-col bg-slate-950">
            <h2 className="text-6xl font-bold text-center text-base-content">Our Elements</h2>
            <p className="text-md text-center font-light mb-20">Discover the core pillars that drive {`SPARK's`} mission and vision.</p>

            <div className="flex flex-row flex-wrap gap-4 place-content-center">
              {
                elements.map((element, index) => (
                  <div key={index} className={`group flex text-center flex-col p-6 items-center w-full gap-6 max-w-96 bg-base-300 ${element.color} transition-all duration-300 hover:scale-105 rounded-xl`}>
                    <img src={element.image} alt="" className='h-20 w-20 group-hover:h-32 group-hover:w-32 transition-all duration-300 group-hover:opacity-50'/>
                    <h3 className="text-3xl font-bold text-center text-white">{element.name}</h3>
                    <p className='text-sm text-white'>{element.description}</p>
                  </div>
                ))
              }
            </div>
          </section>

          <section className="relative w-screen h-fit py-20 px-10 pb-30 flex flex-col bg-gradient-to-b from-slate-950 to-base-300">
            <h2 className="text-6xl font-bold text-center text-base-content">Global Impact</h2>
            <p className='text-md mt-16 font-light drop-shadow-lg md:px-32 text-justify'>We aim to create a <strong className='text-lg'>global impact</strong> by fostering a community of innovators, entrepreneurs, and leaders who are equipped to <strong className='text-lg'>solve</strong> challenges that transcend borders. Through collaboration across industries and cultures, SPARK <strong className='text-lg'>connects</strong> individuals worldwide, enabling the exchange of ideas, skills, and resources. By focusing on <strong className='text-lg'>universal</strong> pillars like creativity, research, and technology, Our initiatives are designed to address global issues such as education reform, <strong className='text-lg'>sustainable</strong> innovation, and social entrepreneurship, ensuring that its solutions benefit not only local communities but also the global <strong className='text-lg'>society</strong> at large.</p>
            <img src="/designs/globe.png" alt="" className='absolute self-center opacity-30 mask-image-gradient minh-96 min-w-96 w-96'/>
              
          </section> 
    </>
  )
}

export default Page
