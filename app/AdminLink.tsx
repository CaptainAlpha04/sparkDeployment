"use client";
import { useEffect, useState } from "react";
import { db } from "@/app/firebaseconfig"; // Import your Firebase config
import { doc, getDoc } from "firebase/firestore";

export default function AdminLink() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchUserAdminStatus = async () => {
      try {
        // Get user data from local storage
        const localUser = JSON.parse(localStorage.getItem("user") || "{}");

        // Fetch the latest user data from Firestore
        const userDoc = await getDoc(doc(db, "users", localUser.email));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsAdmin(userData.admin === true); // Check admin status from Firestore
          
          // Optionally, update local storage with the latest user data
          localStorage.setItem("user", JSON.stringify(userData));
        } else {
          console.error("No such user!");
        }
      } catch (error) {
        console.error("Error fetching user admin status: ", error);
      }
    };

    fetchUserAdminStatus();
  }, []);

  if (!isAdmin) {
    return null;
  }

  return (
    <li>
      <a
        href="/admin"
        className="hover:bg-blue-700 px-3 py-2 rounded transition duration-300"
      >
        Admin
      </a>
    </li>
  );
}
