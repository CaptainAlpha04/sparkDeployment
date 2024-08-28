"use client";
import { useEffect, useState } from "react";
import { db } from "../firebaseconfig";
import { collection, getDocs, doc, DocumentData, updateDoc, arrayUnion } from "firebase/firestore";

interface Event {
  id: string;
  eventName: string;
  description: string;
  date: string;
  ticketPrice: number;
  registeredUsers: string[]; // New field to store registered users
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsCollection = collection(db, "events");
        const eventSnapshot = await getDocs(eventsCollection);
        const eventList: Event[] = eventSnapshot.docs.map((doc) => {
          const data = doc.data() as DocumentData;
          return {
            id: doc.id,
            eventName: data.eventName,
            description: data.description,
            date: data.date,
            ticketPrice: data.ticketPrice,
            registeredUsers: data.registeredUsers || [], // Ensure this field is handled
          };
        });
        setEvents(eventList);
      } catch (error) {
        console.error("Error fetching events: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  async function handleRegister(eventId: string) {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      const user = JSON.parse(userJson);
      try {
        // Update user's registered events
        const userRef = doc(db, "users", user.email);
        await updateDoc(userRef, {
          registeredEvents: arrayUnion(eventId),
        });

        // Update event's registered users
        const eventRef = doc(db, "events", eventId);
        await updateDoc(eventRef, {
          registeredUsers: arrayUnion(user.name), // or user.name if available
        });

        alert("Registered successfully!");
      } catch (error) {
        console.error("Error registering for event: ", error);
      }
    } else {
      alert("You need to register first!");
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">Upcoming Events</h1>
      {loading ? (
        <p className="text-gray-700">Loading...</p>
      ) : events.length > 0 ? (
        <ul className="space-y-4">
          {events.map((event) => (
            <li key={event.id} className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">{event.eventName}</h2>
              <p className="text-gray-600 mb-2">{event.description}</p>
              <p className="text-gray-500 mb-2">Date: {event.date}</p>
              <p className="text-gray-800 mb-4">Price: ${event.ticketPrice.toFixed(2)}</p>
              <p className="text-gray-600 mb-2">Registered Users: {event.registeredUsers.join(', ')}</p> {/* Display registered users */}
              <button
                onClick={() => handleRegister(event.id)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition duration-300"
              >
                Register
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-700">No events available.</p>
      )}
    </div>
  );
}
