import React from 'react'

function Page() {
  return (
    <>
      <section className="min-h-screen w-screen p-10 pt-24 font-poppins text-base-content bg-base-300">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-7xl font-bold mb-6 drop-shadow-lg">
            OUR <span className="text-yellow-300">MISSION</span>
          </h1>
          <p className="text-2xl mb-12 leading-relaxed">
            Welcome to <strong>SPARK</strong>, a hub of creativity, innovation, and research in the fields of science and technology. We strive to cultivate a dynamic environment that encourages innovation, entrepreneurship, and psychological enhancement. Our mission is to empower individuals to push boundaries and reimagine the future. Join us, and {"let's"} build a brighter, more innovative world together!
          </p>
          
          {/* Mottos */}
          <section className="my-16">
            <h2 className="text-4xl font-bold text-yellow-300 mb-4">Entrepreneurship</h2>
            <p className="text-lg">Fostering creativity and innovation through entrepreneurship, paving the way for future leaders and innovators.</p>
          </section>

          <section className="my-16">
            <h2 className="text-4xl font-bold text-yellow-300 mb-4">Research</h2>
            <p className="text-lg">Delving into scientific research to discover groundbreaking solutions in technology and beyond.</p>
          </section>

          <section className="my-16">
            <h2 className="text-4xl font-bold text-yellow-300 mb-4">Education</h2>
            <p className="text-lg">Providing educational resources to empower the next generation of tech leaders and innovators.</p>
          </section>

          <section className="my-16">
            <h2 className="text-4xl font-bold text-yellow-300 mb-4">Technology</h2>
            <p className="text-lg">Driving technological advancements that push the boundaries of {"what's"} possible in {"today's"} world.</p>
          </section>

          <section className="my-16">
            <h2 className="text-4xl font-bold text-yellow-300 mb-4">Innovation</h2>
            <p className="text-lg">Pioneering creative and transformative solutions that shape the future of science and technology.</p>
          </section>

          <section className="my-16">
            <h2 className="text-4xl font-bold text-yellow-300 mb-4">Leadership</h2>
            <p className="text-lg">Cultivating leadership skills that inspire individuals and teams to reach their fullest potential.</p>
          </section>

          <section className="my-16">
            <h2 className="text-4xl font-bold text-yellow-300 mb-4">Collaboration</h2>
            <p className="text-lg">Encouraging teamwork and collaboration to solve problems and create innovative solutions together.</p>
          </section>

          <section className="my-16">
            <h2 className="text-4xl font-bold text-yellow-300 mb-4">Global Impact</h2>
            <p className="text-lg">Aiming to make a lasting, positive impact on the world through our collaborative efforts and visionary projects.</p>
          </section>

          {/* Call to Action */}
          <p className="text-2xl mt-16 mb-8 font-light drop-shadow-lg">
            Join <strong>SPARK</strong> and become part of an extraordinary community working to revolutionize the future through innovation, research, and leadership. Together, we can shape a brighter tomorrow.
          </p>
        </div>
      </section>
    </>
  )
}

export default Page
