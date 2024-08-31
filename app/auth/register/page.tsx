"use client";

import { useState } from "react";
import { db } from "../../firebaseconfig";
import { doc, setDoc } from "firebase/firestore";
import bcrypt from "bcryptjs";
import Link from "next/link";
import StarryCanvas from "../../components/StarryCanvas";

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
    <section className="h-screen w-screen flex flex-row fixed planet-bg z-30">
    <StarryCanvas numberOfStars={300}/>
      <div className="pt-4 bg-opacity-0 bg-black p-6 flex flex-col w-1/3 backdrop-blur-3xl gap-4 items-center h-full relative transition-all">
        
        <div className='flex flex-row justify-between w-full'>
          <Link href='/' className="btn btn-ghost">
            Back
          </Link>
          <Link href='/auth/login' className="btn btn-ghost">Login</Link>
        </div>
        
        <img src="/logoWhite.png" alt="logo" className="w-14 h-14" />
        <h1 className="text-3xl font-bold text-white">Create an Account</h1>
        <p className="text-white font-light">Enter your details to become a member.</p> 
        <div className="flex flex-col gap-2 w-full">

        <label className="flex flex-row items-center gap-2">
        <i className="fi fi-sr-user text-lg"></i>
        <h1 className="w-1/5">Name</h1>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            type="text"
            required
            className="p-3 rounded-lg w-full "
            />
          </label>

        <label className="flex flex-row items-center gap-2">
          <i className="fi fi-sr-age-alt text-lg"></i>
          <h1 className="w-1/5">Age</h1>
          <input
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Age"
            type="number"
            required
            className="p-3 rounded-lg w-full"
          />
          </label>

        <label className="flex flex-row items-center gap-2">
          <i className="fi fi-sr-envelope text-lg"></i>
          <h1 className="w-1/5">Email</h1>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            required
            className="p-3 rounded-lg w-full" 
          />
          </label>

        <label className="flex flex-row items-center gap-2">
          <i className="fi fi-sr-key text-lg"></i>
          <h1 className="w-1/5">Password</h1>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            required
            className="p-3 rounded-lg w-full"
          />
          </label>

        <label className="flex flex-row items-center gap-2">
          <i className="fi fi-sr-phone-flip text-lg"></i>
          <h1 className="w-1/5">Phone</h1>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone Number"
            type="text"
            required
            className="p-3 rounded-lg w-full"
          />
          </label>

        <label className="flex flex-row items-center gap-2">
          <i className="fi fi-sr-graduation-cap text-lg"></i>
          <h1 className="w-1/5">University</h1>
          <input
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            placeholder="University"
            type="text"
            required
            className="p-3 rounded-lg w-full"
          />
          </label>

        <label className="flex flex-row items-center gap-2">
          <i className="fi fi-sr-degree-credential text-lg"></i>
          <h1 className="w-1/5">Degree</h1>
          <input
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            placeholder="Degree"
            type="text"
            required
            className="p-3 rounded-lg w-full"
          />
          </label>

          <button
            onClick={handleRegister}
            disabled={loading}
            className={`btn ${
              loading ? "btn-disabled" : "btn-neutral"
            }`}
          >
            {loading ? "Registering..." : "Register"}
          </button>
          {success && <p className="text-green-600 mt-4">Registration successful!</p>}
        </div>
      </div>  
    </section>
  );
}
