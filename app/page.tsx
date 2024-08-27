// app/page.tsx
import React from 'react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-900">
      <h1 className="text-4xl font-bold mb-4 text-blue-600">Welcome to the Event Management App</h1>
      <p className="text-lg mb-8">
        This is the place where you can register for events, buy tickets, and more.
      </p>
      <div className="flex space-x-4">
        <a
          href="/register"
          className="inline-block px-6 py-3 text-white bg-blue-500 rounded-lg shadow-md hover:bg-blue-600 transition duration-300"
        >
          Register
        </a>
        <a
          href="/events"
          className="inline-block px-6 py-3 text-white bg-green-500 rounded-lg shadow-md hover:bg-green-600 transition duration-300"
        >
          View Events
        </a>
      </div>
    </div>
  );
}
