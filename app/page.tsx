// app/page.tsx
import React from 'react';
import StarryCanvas from './components/StarryCanvas';

export default function HomePage() {
  return (
    <>
      <section className='flex flex-col w-screen h-screen bg-gradient-to-b from-black via-base-300 to-purple-950'>
        <StarryCanvas />
        <div className='flex flex-col items-center justify-center h-full z-10'>
          <h1 className='text-7xl font-azonix text-center'>Here Ideas <br />Spark into Reality</h1>
          <p className='text-lg font-poppins'>The <b>Fastest</b> Growing Innovation Community of Pakistan</p>
        </div>  
      </section>
    
    </>
  );
}
