"use client";
import { useState } from "react";
import { db, storage } from "../firebaseconfig";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function AdminPage() {
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [ticketPrice, setTicketPrice] = useState<number>(0);
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleCreateEvent = async () => {
    if (eventName && description && date && ticketPrice > 0) {
      setLoading(true);
      try {
        let imageUrl = "";
        if (image) {
          // Upload image
          const imageRef = ref(storage, `event-images/${image.name}`);
          await uploadBytes(imageRef, image);
          imageUrl = await getDownloadURL(imageRef);
        }

        // Add event to Firestore
        const eventsCollection = collection(db, "events");
        await addDoc(eventsCollection, {
          eventName,
          description,
          date,
          ticketPrice,
          imageUrl,
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
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
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
