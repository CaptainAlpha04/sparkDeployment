import React from 'react'

function page() {
  return (
    <>
      <section className="min-h-screen w-screen p-10 pt-24 font-poppins bg-base-300">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-6xl mb-6 font-extralight text-center">
            <span className="font-bold">OUR PARTNER INSTITUTIONS</span>
          </h1>
          <p className="text-lg text-center mb-10">
            <strong>SPARK</strong> works with leading institutions to empower innovation and creativity. Through our partnerships, we provide students with opportunities to contribute to research, technology, and leadership. Our 8 core goals—entrepreneurship, research, education, technology, innovation, leadership, collaboration, and global impact—guide our work in institutions like <strong>FAST</strong>, <strong>NUST</strong>, <strong>COMSATS</strong>, <strong>AIR University</strong>, <strong>UCP</strong>, and <strong>GIKI</strong>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-base-100 shadow-md p-6 rounded-lg">
              <h3 className="text-2xl font-semibold text-primary mb-4">FAST - National University of Computer & Emerging Sciences</h3>
              <p className="text-md">
                At FAST, SPARK nurtures the entrepreneurial spirit and supports student-led initiatives that advance research in emerging technologies.
              </p>
            </div>

            <div className="bg-base-100 shadow-md p-6 rounded-lg">
              <h3 className="text-2xl font-semibold text-primary mb-4">NUST - National University of Sciences & Technology</h3>
              <p className="text-md">
                NUST students work closely with SPARK to engage in leadership programs and innovation projects, shaping the future of technology.
              </p>
            </div>

            <div className="bg-base-100 shadow-md p-6 rounded-lg">
              <h3 className="text-2xl font-semibold text-primary mb-4">COMSATS Institute of Information Technology</h3>
              <p className="text-md">
                COMSATS is a hub of creativity. Through SPARK, students participate in research and entrepreneurship activities that drive technology forward.
              </p>
            </div>

            <div className="bg-base-100 shadow-md p-6 rounded-lg">
              <h3 className="text-2xl font-semibold text-primary mb-4">AIR University</h3>
              <p className="text-md">
                SPARK collaborates with AIR University to promote leadership, empowering students to create innovative solutions for global challenges.
              </p>
            </div>

            <div className="bg-base-100 shadow-md p-6 rounded-lg">
              <h3 className="text-2xl font-semibold text-primary mb-4">UCP - University of Central Punjab</h3>
              <p className="text-md">
                At UCP, SPARK helps students turn academic projects into real-world applications through mentorship and collaboration.
              </p>
            </div>

            <div className="bg-base-100 shadow-md p-6 rounded-lg">
              <h3 className="text-2xl font-semibold text-primary mb-4">GIKI - Ghulam Ishaq Khan Institute</h3>
              <p className="text-md">
                {"SPARK's"} partnership with GIKI encourages innovation and technological advancement through research-driven projects and initiatives.
              </p>
            </div>
          </div>

          <h2 className="text-4xl font-extralight text-center mt-16">
            <span className="font-bold">OUR IMPACT</span> 
          </h2>
          <p className="text-lg text-center mb-10 mt-6">
            Through our work with these institutions, SPARK has empowered countless students to pursue their passions in science, technology, and innovation. We believe in nurturing ideas that drive progress and create positive global impact. Here are a few of the ways we’ve made a difference:
          </p>

          <ul className="list-disc ml-6 text-lg">
            <li>Providing mentorship and resources for tech startups and entrepreneurial ventures.</li>
            <li>Offering research opportunities to explore cutting-edge technology and science.</li>
            <li>Hosting leadership workshops that foster confidence and strategic thinking.</li>
            <li>Building collaborative networks across institutions to encourage diverse perspectives and solutions.</li>
          </ul>
        </div>
      </section>
    </>
  )
}

export default page
