"use client";

import { useState } from "react";
import { db } from "../firebaseconfig";
import { doc, setDoc } from "firebase/firestore";
import bcrypt from "bcryptjs";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [university, setUniversity] = useState("");
  const [degree, setDegree] = useState("");
  const [age, setAge] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    if (
      name &&
      email &&
      password &&
      phone &&
      university &&
      degree &&
      age
    ) {
      setLoading(true);

      try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await setDoc(doc(db, "users", email), {
          name,
          email,
          password: hashedPassword,
          phone,
          university,
          degree,
          age,
          registeredEvents: [],
          admin: false, // Set the admin field to false by default
        });

        // Store user info in local storage
        const user = {
          name,
          email,
          password: hashedPassword,
          phone,
          university,
          degree,
          age,
          registeredEvents: [],
          admin: false,
        };

        await setDoc(doc(db, "users", email), user);

        // Store the entire user object in local storage
        localStorage.setItem("user", JSON.stringify(user));

        setLoading(false);
        setSuccess(true);
      } catch (error) {
        setLoading(false);
        console.error("Error registering user: ", error);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-blue-600">Register for Events</h1>
        <p className="text-gray-700 mb-6">Enter your details to register for upcoming events.</p>
        <div className="space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            type="text"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone Number"
            type="text"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            placeholder="University"
            type="text"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            placeholder="Degree"
            type="text"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Age"
            type="number"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleRegister}
            disabled={loading}
            className={`w-full px-4 py-2 text-white rounded-lg shadow-md transition duration-300 ${
              loading ? "bg-gray-500 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {loading ? "Registering..." : "Register"}
          </button>
          {success && <p className="text-green-600 mt-4">Registration successful!</p>}
        </div>
      </div>
    </div>
  );
}
