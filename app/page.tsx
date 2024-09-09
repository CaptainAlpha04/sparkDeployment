// app/page.tsx
import React from 'react';
import StarryCanvas from './components/StarryCanvas';
import Link from 'next/link';

interface GoalCardProps {
    title: string;
    description: string;
    color: string;
  }
  
  // This is the array for storing goals
  const goals: { title: string, description: string, color:string }[] = [
    {
      title: "Innovation",
      description: "SPARK is committed to driving innovation by nurturing the next generation of inventors and disruptors. Our goal is to create an ecosystem where curiosity meets technology, and new ideas are turned into impactful solutions. We empower our community to challenge the status quo, experiment with emerging technologies, and lead transformative changes in their respective fields.",
      color: "from-orange-500"
    },
    {
      title: "Collaboration",
      description: "We believe that collaboration is the key to achieving greatness. SPARK is dedicated to creating a collaborative culture where diverse minds come together to solve complex problems. We encourage open communication, teamwork, and cross-disciplinary partnerships to drive collective success. Our mission is to break down silos and foster an environment where shared knowledge leads to shared achievements.",
      color: "from-emerald-500"
    
    },
    {
      title: "Education",
      description: "SPARK is a bridge between academic excellence and real-world impact. Our mission is to redefine the traditional boundaries of academia by integrating modern practices, hands-on learning, and industry connections. We aim to equip students and professionals with the knowledge and skills they need to thrive in an ever-changing world, ensuring that education remains a powerful tool for innovation",
      color: "from-blue-900"
    
    },
    {
      title: "Creativity",
      description: "Creativity is at the heart of innovation. SPARK is dedicated to cultivating a creative environment where unconventional thinking flourishes. Our goal is to inspire students and professionals alike to break free from traditional boundaries and explore new perspectives. By encouraging original ideas and artistic expression, we aim to build a community that values the limitless potential of imagination.",
      color: "from-purple-500"
    },
    {
      title: "Technology",
      description: "Technology is the backbone of modern advancement, and SPARK is dedicated to empowering individuals through cutting-edge tech education and tools. Our goal is to provide the latest technological resources and training, ensuring that our community is prepared to navigate and shape the future of tech-driven industries. From AI to cybersecurity, we are committed to staying at the forefront of technological innovation.",
      color: 'from-sky-500'
    },
    {
      title: "Entrepreneurship",
      description: "Our mission is to ignite the entrepreneurial spirit within every individual by providing resources, mentorship, and a nurturing environment. We aim to empower future leaders to take bold risks, solve real-world problems, and develop innovative businesses that impact society. Through SPARK, we foster a mindset of growth, adaptability, and persistence to turn ideas into successful ventures.",
      color: "from-black"
    },
    {
      title: "Leadership",
      description: "Leadership at SPARK is about more than just guiding others; it's about inspiring change and leading with vision. Our mission is to cultivate ethical, visionary leaders who can navigate challenges with resilience and empathy. We aim to develop individuals who lead by example, inspire action, and create positive impact in their communities and industries. Through leadership development, we empower the next generation to take charge of the future.",
      color: "from-red-500"
    },
    {
      title: "Research",
      description: "At SPARK, we recognize the importance of research in driving progress. Our mission is to support groundbreaking research initiatives that advance knowledge across all fields. We strive to connect researchers with the necessary tools, networks, and platforms to explore unanswered questions and contribute to the global body of knowledge. We promote inquiry-based learning and rigorous exploration to push the frontiers of innovation.",
      color: "from-blue-600"
    },
    
  ];
  
  // This is the sponsors array. For now I have added those sponsors which I have in mind
  const sponsors = [
    { name: "TensorFlow Islamabad", logo: "/images/tensorflow.png" },
    { name: "NUST Entrepreneurs Club", logo: "/images/nec.png" },
    { name: "Google Pakistan", logo: "/images/google.png" },
    { name: "Poshish Interiors", logo: "/images/poshish.png" },

  ];
  // This is the benefits array which will be used in the
  const benefits = [
    "Access to exclusive innovation events and workshops",
    "Networking opportunities with industry leaders",
    "Resources and support for your innovative projects",
    "Potential funding opportunities for promising ideas",
  ];
  
  const stats = [
    { label: "Student Members", value: "500+" },
    { label: "Successful Events", value: "3+" },
    { label: "Affliated Societies", value: "10+" },
    { label: "Affiliated Institutions", value: "50+" },
  ];

export default function HomePage() {
  return (
    <section className=''>
      <section className='flex flex-col w-screen h-screen bg-gradient-to-b from-black via-base-300 to-purple-950'>
        <StarryCanvas />
        <div className='flex flex-col items-center justify-center h-full z-10'>
          <h1 className='text-7xl md:text-8xl font-extrabold text-center animation-swipe-from-bottom px-4'>Here Ideas <br />Spark into Reality</h1>
          <p className='text-lg font-poppins animation-fade-in text-center'>The <b>Fastest</b> Growing Innovation Community of Pakistan</p>
        </div>  
      </section>

    {/* This is the about section */}
        <section className="bg-gradient-to-b from-purple-950 to-slate-950 relative w-screen h-fit flex flex-row ">
          <img src="/images/logo-white.png" alt="Logo" className='absolute opacity-30 top-30 right-6 h-96' />
          <div className="container py-40 relative px-10">
            <h2 className="text-8xl font-bold mb-8 text-left opacity-70">
              How it all <br /> started...
            </h2>
            <div className="max-w-3xl mx-auto">
              <p className="text-lg mb-4 text-gray-300">
                SPARK is Pakistan&apos;s premier innovation community, dedicated
                to fostering creativity, entrepreneurship, and technological
                advancement across the nation.
              </p>
              <p className="text-lg mb-4 text-gray-300">
                Our mission is to empower individuals and institutions to turn
                their groundbreaking ideas into reality, contributing to
                Pakistan&apos;s growth and global competitiveness.
              </p>
              <p className="text-lg text-gray-300">
                We provide a platform for innovators, entrepreneurs, and students
                to connect, collaborate, and create, driving positive change in
                society and the economy through innovation and impact.
              </p>
              <Link href='/mission' className='btn btn-stylized mt-10'>
                    Learn More
              </Link>
            </div>
        </div>
      </section>

      {/* This is the goal section */}
        {/* <section className="bg-slate-950 relative h-full w-screen pb-32 px-8 md:px-36">  */}
          {/* <h1 className='absolute text-8xl left-2 top-10 font-bold text-center z-[0] opacity-20'>Innovation</h1>
           */}
          {/* <h2 className="text-7xl font-bold mb-8 text-center">
            Our Goals
          </h2>
          <div className="carousel mx-auto px-10 relative z-10 p-10 flex gap-4">
              {goals.map((goal, index) => (  
              <div key={index} className={`carousel-item bg-gradient-to-b ${goal.color} to-slate-950 p-10 rounded-xl max-w-80 transform transition duration-300 hover:scale-105 flex flex-col shadow-md`}>  
                <h3 className="text-4xl font-bold mb-4">{goal.title}</h3>
                <p className="text-gray-300 text-justify">{goal.description}</p>
            </div>
            ))}
        </div>
      </section> */}

      {/* Now this is the stats section */}
      <section className="bg-gradient-to-b from-slate-950 to-base-300 relative h-fit px-10">
          <h2 className="text-7xl font-bold mb-12 opacity-70 text-center">
            Our Impact
          </h2>
          <div className="flex flex-wrap place-content-center gap-x-10">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="rounded-xl p-16 text-center transform hover:scale-105 transition duration-300"
              >
                <div className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-purple-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-xl text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
      </section>

      {/* This is the sponsors section */}
      <section className="bg-gradient-to-b from-base-300 to-black py-16 flex flex-col gap-20 items-center">
        <h1 className='text-xl font-bold text-center'>Sponsors and Partners</h1>
          <div className="flex gap-20 flex-wrap justify-center items-center p-10">
            {sponsors.map((sponsor, index) => (
              <div key={index} className="flex flex-col items-center gap-5 p-6 w-72 rounded-xl hover:scale-110 transition-all duration-300 hover:bg-slate-900">
                <img src={sponsor.logo} alt={sponsor.name} className='h-20' />
                <p className='text-xs'>{sponsor.name}</p>
              </div>
            ))}
          </div>
      </section>
      
      {/* This is the why join us section */}
      <section className="py-16 relative h-full w-screen">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500 opacity-30"></div>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500"></div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-4xl font-bold mb-12 text-center text-white">
            Become a Member
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-between text-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h3 className="text-2xl font-semibold mb-6 text-left">
                Why Join SPARK?
              </h3>
              <ul className="text-gray-300 space-y-4 text-left">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="w-6 h-6 mr-3 text-orange-500 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:w-1/2 md:pl-12">
              <div className="bg-black/30 backdrop-blur-lg p-8 rounded-xl shadow-xl border border-purple-600 text-center">
                <h3 className="text-2xl font-semibold mb-4 text-white">
                  Ready to Ignite Your Ideas?
                </h3>
                <p className="mb-6 text-gray-300">
                  Join SPARK today and be part of Pakistan&apos;s
                  fastest-growing innovation community!
                </p>
                <button className="btn-stylized">
                  Register Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* This is the Community links section containing social links*/}
      <section className='relative flex flex-col bg-base-300 h-full py-32 px-10 items-center z-10'>
        <div className='absolute w-1/2 h-32 backdrop-blur-3xl z-[-10] bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500 opacity-50'></div>
        <div className='absolute top-0 w-screen h-full backdrop-blur-3xl z-[-10]'></div>
        <h1 className='text-5xl font-bold text-center'>Join Our Community!</h1>
        <p className='mt-8 text-center'>Join Our Community of Innovative and Talented Individuals across various Social Platforms <br />and be a part of something Big!</p>
        
        <div className="flex flex-row flex-wrap mt-20 items-center gap-4 justify-center">
          {/* This is the Discord Card */}
          <div className='group flex flex-col bg-slate-950 p-10 w-80 gap-4 text-center rounded-3xl transition-all duration-300 hover:scale-105'>
            <i className="fi fi-brands-discord text-6xl transition-colors duration-500 group-hover:text-violet-500"></i>
            <h3 className='text-2xl font-bold text-white transition-colors duration-500 group-hover:text-violet-500'>Discord</h3>
            <p>Get latest updates on events and get in touch with our Team</p>
            <a href="https://discord.com/invite/5Tx5Ev8K" target='_blank' className='btn btn-outline'>Join Now</a>
          </div>
          {/* This is the LinkedIn Card */}
          <div className='group flex flex-col bg-slate-950 p-10 w-80 gap-4 text-center rounded-3xl transition-all duration-300 hover:scale-105'>
            <i className="fi fi-brands-linkedin text-6xl transition-colors duration-500 group-hover:text-sky-400"></i>
            <h3 className='text-2xl font-bold text-white transition-colors duration-500 group-hover:text-sky-400'>LinkedIn</h3>
            <p>Connect with Industry Experts and like Minded Individuals</p>
            <a href="https://www.linkedin.com/company/sparkchapter/" target='_blank' className='btn btn-outline'>Join Now</a>
          </div>
          {/* This is the Instagram Card */}
          <div className='group flex flex-col bg-slate-950 p-10 w-80 gap-4 text-center rounded-3xl transition-all duration-300 hover:scale-105'>
            <i className="fi fi-brands-instagram text-6xl transition-all duration-500 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-tr from-purple-700 to-orange-500"></i>
            <h3 className='text-2xl font-bold text-white transition-all duration-500 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-tr from-purple-700 to-orange-500'>Instagram</h3>
            <p>Follow up on our Events and Progress</p>
            <a href="https://www.instagram.com/sparkchapter?igsh=dzZzMG01NjAxbmNi" target='_blank' className='btn btn-outline'>Join Now</a>
          </div>
          {/* This is the WhatsApp Card */}
          <div className='group flex flex-col bg-slate-950 p-10 w-80 gap-4 text-center rounded-3xl transition-all duration-300 hover:scale-105'>
            <i className="fi fi-brands-whatsapp text-6xl transition-colors duration-500 group-hover:text-emerald-500"></i>
            <h3 className='text-2xl font-bold text-white transition-colors duration-500 group-hover:text-emerald-500'>WhatsApp</h3>
            <p>Ask Questions and get Resources curated for Community</p>
            <a href="https://chat.whatsapp.com/FYSriy557mw7FTKxWGprfS" target='_blank' className='btn btn-outline'>Join Now</a>
          </div>

        </div>

      </section>

    </section>
  );
}
