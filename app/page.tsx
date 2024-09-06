import React from "react";
import StarryCanvas from "./components/StarryCanvas";
import { Star } from "lucide-react";
import nec from "./../public/images/nec.png";
import tensorf from "./../public/images/tensorflow.png";
import Image from "next/image";

// Defining types for the goal card props
interface GoalCardProps {
  title: string;
  description: string;
}

// This is the array for storing goals
const goals: { title: string; description: string }[] = [
  {
    title: "Innovation",
    description: "Foster groundbreaking ideas across Pakistan",
  },
  {
    title: "Collaboration",
    description: "Connect innovators, institutions, and industries",
  },
  {
    title: "Education",
    description: "Empower through knowledge and skill development",
  },
  {
    title: "Impact",
    description: "Drive positive change in society and economy",
  },
];
//  This is the goal card made using the lucide-react package
const GoalCard: React.FC<GoalCardProps> = ({ title, description }) => (
  <div className="bg-gray-800 p-6 rounded-lg shadow-lg transform transition duration-300 hover:scale-105">
    <Star className="text-orange-500 mb-4" size={24} />
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-300">{description}</p>
  </div>
);

// This is the sponsors array. For now I have added those sponsors which I have in mind
const sponsors = [
  { name: "TensorFlow Groups", logo: tensorf },
  { name: "NEC Club", logo: nec },
];
// This is the benefits array which will be used in the
const benefits = [
  "Access to exclusive innovation events and workshops",
  "Networking opportunities with industry leaders",
  "Resources and support for your innovative projects",
  "Potential funding opportunities for promising ideas",
];

const stats = [
  { label: "Student Members", value: "5000+" },
  { label: "Affiliated Institutions", value: "50+" },
];

const HomePage: React.FC = () => {
  return (
    <section className="">
      <section className="flex flex-col w-screen h-screen bg-gradient-to-b from-black via-base-300 to-purple-950">
        <StarryCanvas />
        <div className="flex flex-col items-center justify-center h-full z-10">
          <h1 className="text-7xl font-azonix text-center animation-swipe-from-bottom">
            Here Ideas <br />
            SPARK into Reality
          </h1>
          <p className="text-lg font-poppins animation-fade-in">
            The <b>Fastest</b> Growing Innovation Community of Pakistan
          </p>
        </div>
      </section>
      {/* This is the about section */}
      <section className="bg-[#0A0A1A] py-16 relative">
        <div className="absolute inset-0 bg-[url('/starry-bg.jpg')] bg-cover bg-center opacity-30"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-4xl font-bold mb-8 text-white text-center">
            About SPARK
          </h2>
          <div className="max-w-3xl mx-auto">
            <p className="text-lg mb-4 text-gray-300">
              SPARK is Pakistan&apos;s premier innovation community, dedicated
              to fostering creativity, entrepreneurship, and technological
              advancement across the nation.
            </p>
            <p className="text-lg text-gray-300">
              Our mission is to empower individuals and institutions to turn
              their groundbreaking ideas into reality, contributing to
              Pakistan&apos;s growth and global competitiveness.
            </p>
          </div>
        </div>
      </section>
      {/* This is the goal section */}
      <section className="bg-[#0A0A1A] py-16 relative">
        <div className="absolute inset-0 bg-purple-900 opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-4xl font-bold mb-8 text-white text-center">
            Our Goals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {goals.map((goal, index) => (
              <GoalCard
                key={index}
                title={goal.title}
                description={goal.description}
              />
            ))}
          </div>
        </div>
      </section>
      {/* This is the sponsors section */}
      <section className="bg-[#0A0A1A] py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-8 text-center text-white">
            Our Sponsors
          </h2>
          <div className="flex justify-center items-center space-x-8">
            {sponsors.map((sponsor, index) => (
              <div key={index} className="text-center">
                <Image
                  src={sponsor.logo}
                  alt={`${sponsor.name} logo`}
                  width={128}
                  height={128}
                  className="object-contain mb-4 filter invert"
                />
                <p className="text-lg font-semibold text-gray-300">
                  {sponsor.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* This is the why join us section */}
      <section className="bg-[#0A0A1A] py-16 relative">
        <div className="absolute inset-0 bg-purple-900 opacity-10"></div>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500"></div>

        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-4xl font-bold mb-12 text-center text-white">
            Become a Member
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h3 className="text-2xl font-semibold mb-6 text-white">
                Why Join SPARK?
              </h3>
              <ul className="text-gray-300 space-y-4">
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
              <div className="bg-[#1A1A2A] p-8 rounded-lg shadow-xl border border-purple-600">
                <h3 className="text-2xl font-semibold mb-4 text-white">
                  Ready to Ignite Your Ideas?
                </h3>
                <p className="mb-6 text-gray-300">
                  Join SPARK today and be part of Pakistan&apos;s
                  fastest-growing innovation community!
                </p>
                <button className="bg-gradient-to-r from-orange-500 to-purple-600 text-white py-3 px-8 rounded-full font-semibold hover:from-orange-600 hover:to-purple-700 transition duration-300 shadow-lg">
                  Join Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Now this is the stats section */}
      <section className="bg-[#0A0A1A] py-16 relative">
        <div className="absolute inset-0 bg-purple-900 opacity-10"></div>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-yellow-500 to-green-500"></div>

        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-4xl font-bold mb-12 text-center text-white">
            Our Impact
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-[#1A1A2A] rounded-lg p-8 text-center transform hover:scale-105 transition duration-300"
              >
                <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-purple-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-xl text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
};

export default HomePage;
