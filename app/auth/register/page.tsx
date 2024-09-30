"use client";

import { useEffect, useState } from "react";
import { db } from "../../firebaseconfig";
import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import StarryCanvas from "../../components/StarryCanvas";
import React from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [university, setUniversity] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [degree, setDegree] = useState("");
  const [age, setAge] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [acceptablePassword, setAcceptablePassword] = useState(false);

  const evaluatePasswordStrength = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < 6 || !hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChars) {
      setAcceptablePassword(false);
      return "weak";
    } else if (password.length < 10) {
      setAcceptablePassword(true);
      return "medium";
    } else {
      setAcceptablePassword(true);
      return "strong";
    }
  };

  useEffect(() => {
    setPasswordStrength(evaluatePasswordStrength(password));
  }, [password]);

  useEffect(() => {
    setPasswordsMatch(password === confirmPassword);
  }, [password, confirmPassword]);

  const handleRegister = async () => {
    if (
      name &&
      email &&
      password
    ) {
      setLoading(true);

      if (confirmPassword !== password) {
        setLoading(false);
        return;
      }

      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = uuidv4();
        const existingUserQuery = query(collection(db, 'users'), where('email', '==', email));
        const existingUserSnapshot = await getDocs(existingUserQuery);
  
        if (!existingUserSnapshot.empty) {
          // Email is already in use
          alert("Email is already in use. Please choose a different email.");
          setLoading(false);
          return;
        }
        // Save user with pending verification status
        await setDoc(doc(db, 'pending_users', email), {
          name,
          email,
          password: hashedPassword,
          registeredEvents: [],
          admin: false,
          emailVerified: false, // Pending verification
          verificationToken,
        });

        // Send verification email
        const response = await fetch('/api/send-verification-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, token: verificationToken }),
        });

        const result = await response.json();

        if (response.ok) {
          setSuccess(true);
        } else {
          console.error(result.error);
        }
        setLoading(false);
        setSuccess(true);
      } catch (error) {
        setLoading(false);
        console.error("Error registering user: ", error);
      }
    }
  };

  const getPasswordBorderColor = () => {
    switch (passwordStrength) {
      case "weak":
        return "border-red-500";
      case "medium":
        return "border-orange-500";
      case "strong":
        return "border-green-500";
      default:
        return "";
    }
  };

  const getConfirmPasswordBorderColor = () => {
    return passwordsMatch && password !== "" ? "border-green-500" : "border-red-500";
  };

  return (
    <section className="h-screen w-screen flex flex-row fixed bg-gradient-to-b from-bg-base-300 to-slate-950 planet-bg z-30 overflow-auto">
      <div className="pt-4 bg-opacity-0 bg-black p-6 flex flex-col w-screen lg:w-1/3 backdrop-blur-3xl gap-8 items-center h-screen relative transition-all">
        
        <div className='flex flex-row justify-between w-full'>
          <Link href='/' className="btn btn-ghost">
            Back
          </Link>
          <Link href='/auth/login' className="btn btn-ghost">Login</Link>
        </div>
        
        <div className="flex flex-col items-center gap-4">
          <img src="/images/logo-white.png" alt="logo" className="w-14 h-14" />
          <h1 className="text-3xl font-bold text-white">Create an Account</h1>
          <p className="text-white font-light">Enter your details to become a member.</p> 
        </div>
        <form className="flex flex-col gap-2 w-full">

        <label className="flex flex-row items-center gap-2">
        <i className="fi fi-sr-user text-lg"></i>
        <h1 className="hidden md:flex w-1/5">Name</h1>
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
          <i className="fi fi-sr-envelope text-lg"></i>
          <h1 className="hidden md:flex w-1/5">Email</h1>
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
          <h1 className="hidden md:flex w-1/5">Password</h1>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            required
            className={`p-3 rounded-lg w-full border-b-4 ${getPasswordBorderColor()}`}
          />
          </label>

          <label className="flex flex-row items-center gap-2">
          <i className="fi fi-br-password-alt text-lg"></i>
          <h1 className="hidden md:flex w-1/5">Confirm</h1>
          <input
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            type="password"
            required
            className={`p-3 rounded-lg w-full border-b-4 ${getConfirmPasswordBorderColor()}`}
          />
          </label>
          
          <p className="text-xs text-center p-2">Password must contain one Uppercase, one Lowercase character. A numerical digit and a Special Character!</p>

          <button
            onClick={handleRegister}
            disabled={loading}
            className={`btn mt-4 ${
              loading || !passwordsMatch || !acceptablePassword ? "btn-disabled" : "btn-neutral"
            }`}
          >
            {loading ? "Registering..." : "Register"}
          </button>
          {success && <p className="text-white mt-2 self-center">An email for account verification has been sent!   </p>}
        </form>
      </div>  
    </section>
  );
}
