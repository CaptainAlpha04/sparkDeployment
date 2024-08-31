"use client";
import { useState, useEffect } from "react";
import { db, storage } from "../firebaseconfig";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function AdminPage() {
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [ticketPrice, setTicketPrice] = useState<number>(0);
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsCollection = collection(db, "events");
        const eventSnapshot = await getDocs(eventsCollection);
        const eventList = eventSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEvents(eventList);
      } catch (error) {
        console.error("Error fetching events: ", error);
      }
    };

    fetchEvents();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleCreateOrUpdateEvent = async () => {
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

        if (editingEvent) {
          // Update existing event
          const eventRef = doc(db, "events", editingEvent.id);
          await updateDoc(eventRef, {
            eventName,
            description,
            date,
            ticketPrice,
            imageUrl,
          });
          alert("Event updated successfully!");
        } else {
          // Create new event
          const eventsCollection = collection(db, "events");
          await addDoc(eventsCollection, {
            eventName,
            description,
            date,
            ticketPrice,
            imageUrl,
          });
          alert("Event created successfully!");
        }

        // Reset form and fetch updated events
        setEventName("");
        setDescription("");
        setDate("");
        setTicketPrice(0);
        setImage(null);
        setEditingEvent(null);
        const eventsCollection = collection(db, "events");
        const eventSnapshot = await getDocs(eventsCollection);
        const eventList = eventSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEvents(eventList);
      } catch (error) {
        console.error("Error creating or updating event: ", error);
      } finally {
        setLoading(false);
      }
    } else {
      alert("Please fill in all fields.");
    }
  };

  const handleEdit = (event: any) => {
    setEventName(event.eventName);
    setDescription(event.description);
    setDate(event.date);
    setTicketPrice(event.ticketPrice);
    setEditingEvent(event);
  };

  const handleDelete = async (eventId: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      try {
        const eventRef = doc(db, "events", eventId);
        await deleteDoc(eventRef);
        alert("Event deleted successfully!");
        // Fetch updated events
        const eventsCollection = collection(db, "events");
        const eventSnapshot = await getDocs(eventsCollection);
        const eventList = eventSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEvents(eventList);
      } catch (error) {
        console.error("Error deleting event: ", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">Admin Dashboard</h1>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">{editingEvent ? "Edit Event" : "Create New Event"}</h2>
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
          onClick={handleCreateOrUpdateEvent}
          disabled={loading}
          className="w-full py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition duration-300"
        >
          {loading ? "Saving..." : (editingEvent ? "Update Event" : "Create Event")}
        </button>
      </div>
      <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">Events List</h2>
      <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto">
        {events.map((event) => (
          <div key={event.id} className="border-b border-gray-300 py-4">
            <h3 className="text-xl font-semibold">{event.eventName}</h3>
            <p>{event.description}</p>
            <p>Date: {event.date}</p>
            <p>Price: ${event.ticketPrice}</p>
            {event.imageUrl && <img src={event.imageUrl} alt={event.eventName} className="w-32 h-32 object-cover mt-2" />}
            <div className="flex mt-4 space-x-2">
              <button
                onClick={() => handleEdit(event)}
                className="py-1 px-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition duration-300"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(event.id)}
                className="py-1 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
