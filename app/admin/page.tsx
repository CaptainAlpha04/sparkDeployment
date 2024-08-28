"use client";
import { useState } from "react";
import { db } from "../firebaseconfig";
import { collection, addDoc } from "firebase/firestore";

export default function AdminPage() {
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [ticketPrice, setTicketPrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const handleCreateEvent = async () => {
    if (eventName && description && date && ticketPrice > 0) {
      setLoading(true);
      try {
        const eventsCollection = collection(db, "events");
        await addDoc(eventsCollection, {
          eventName,
          description,
          date,
          ticketPrice,
        });
        alert("Event created successfully!");
      } catch (error) {
        console.error("Error creating event: ", error);
      } finally {
        setLoading(false);
      }
    } else {
      alert("Please fill in all fields.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">Admin Dashboard</h1>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Create New Event</h2>
      <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto">
        <input
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          placeholder="Event Name"
          type="text"
          className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
          required
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
          required
        />
        <input
          value={date}
          onChange={(e) => setDate(e.target.value)}
          placeholder="Date (YYYY-MM-DD)"
          type="date"
          className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
          required
        />
        <input
          value={ticketPrice}
          onChange={(e) => setTicketPrice(Number(e.target.value))}
          placeholder="Ticket Price"
          type="number"
          min="0"
          className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
          required
        />
        <button
          onClick={handleCreateEvent}
          disabled={loading}
          className="w-full py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition duration-300"
        >
          {loading ? "Creating..." : "Create Event"}
        </button>
      </div>
    </div>
  );
}
