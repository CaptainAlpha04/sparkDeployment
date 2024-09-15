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
  const [eventVenue, setEventVenue] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]); // State for users
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [registeredUsers, setRegisteredUsers] = useState<{ [key: string]: string[] }>({});


  useEffect(() => {
    const fetchEvents = async () => {
      try {
          const eventsCollection = collection(db, "events");
          const eventSnapshot = await getDocs(eventsCollection);
          const eventList = eventSnapshot.docs.map(doc => {
            const data = doc.data();
            return { id: doc.id, registeredUsers: data.registeredUsers || [], ...data };
          });
          setEvents(eventList);

          // Build the registeredUsers state
          const usersMap: { [key: string]: string[] } = {};
          eventList.forEach(event => {
              usersMap[event.id] = event.registeredUsers || [];
          });
          setRegisteredUsers(usersMap);

      } catch (error) {
          console.error("Error fetching events: ", error);
      }
  };


    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, "users"); // Collection name is "users"
        const userSnapshot = await getDocs(usersCollection);
        const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(userList);
      } catch (error) {
        console.error("Error fetching users: ", error);
      }
    };

    fetchEvents();
    fetchUsers(); // Fetch users when component mounts
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleCreateOrUpdateEvent = async () => {
    if (eventName && description && date && ticketPrice > 0 && eventVenue) {
      setLoading(true);
      try {
        let imageUrl = "";
        if (image) {
          const imageRef = ref(storage, `event-images/${image.name}`);
          await uploadBytes(imageRef, image);
          imageUrl = await getDownloadURL(imageRef);
        }

        if (editingEvent) {
          const eventRef = doc(db, "events", editingEvent.id);
          await updateDoc(eventRef, {
            eventName,
            description,
            date,
            ticketPrice,
            eventVenue,
            imageUrl,
          });
          alert("Event updated successfully!");
        } else {
          const eventsCollection = collection(db, "events");
          await addDoc(eventsCollection, {
            eventName,
            description,
            date,
            ticketPrice,
            eventVenue,
            imageUrl,
          });
          alert("Event created successfully!");
        }

        setEventName("");
        setDescription("");
        setDate("");
        setTicketPrice(0);
        setEventVenue("");
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
    setEventVenue(event.eventVenue);
    setEditingEvent(event);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      try {
        const eventRef = doc(db, "events", eventId);
        await deleteDoc(eventRef);
        alert("Event deleted successfully!");
        const eventsCollection = collection(db, "events");
        const eventSnapshot = await getDocs(eventsCollection);
        const eventList = eventSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEvents(eventList);
      } catch (error) {
        console.error("Error deleting event: ", error);
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        const userRef = doc(db, "users", userId); // Collection name is "users"
        await deleteDoc(userRef);
        alert("User deleted successfully!");
        const usersCollection = collection(db, "users");
        const userSnapshot = await getDocs(usersCollection);
        const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(userList);
      } catch (error) {
        console.error("Error deleting user: ", error);
      }
    }
  };
  const handleMarkAsComplete = async (eventId: string) => {
    try {
        const eventRef = doc(db, "events", eventId);
        await updateDoc(eventRef, { isComplete: true });
        alert("Event marked as complete!");
        // Refresh the events list
        const eventsCollection = collection(db, "events");
        const eventSnapshot = await getDocs(eventsCollection);
        const eventList = eventSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEvents(eventList);
    } catch (error) {
        console.error("Error marking event as complete: ", error);
    }
};

  return (
    <section className="min-h-screen w-screen px-6 py-24 bg-base-300 text-base-content">
      <h1 className="text-5xl font-poppins font-extralight mb-10"> <b className="font-bold">Admin</b> <br /> Dashboard</h1>
      <h2 className="text-3xl">Events</h2>
      <div>

      <h2 className="text-2xl font-semibold">{editingEvent ? "Edit Event" : "Create New Event"}</h2>
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
          value={eventVenue}
          onChange={(e) => setEventVenue(e.target.value)}
          placeholder="Event Venue"
          type="text"
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
                <p>Venue: {event.eventVenue}</p>
                {event.imageUrl && <img src={event.imageUrl} alt={event.eventName} className="w-32 h-32 object-cover mt-2" />}
                <div className="mt-4">
                    <h4 className="text-lg font-semibold">Registered Users</h4>
                    <ul>
                        {registeredUsers[event.id]?.map((user, index) => (
                            <li key={index}>{user}</li>
                        ))}
                    </ul>
                </div>
                <div className="flex mt-4 space-x-2">
            {!event.isComplete && (
                <button
                    onClick={() => handleMarkAsComplete(event.id)}
                    className="py-1 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-300"
                >
                    Mark as Complete
                </button>
            )}
            <button
                onClick={() => handleEdit(event)}
                className="py-1 px-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition duration-300"
            >
                Edit
            </button>
            <button
                onClick={() => handleDeleteEvent(event.id)}
                className="py-1 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300"
            >
                Delete
            </button>
        </div>
            </div>
        ))}

      </div>

      <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">Users List</h2>
      <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto">
        {users.map((user) => (
          <div key={user.id} className="border-b border-gray-300 py-4">
            <h3 className="text-xl font-semibold">{user.name}</h3> {/* Assuming user has a 'name' field */}
            <p>Email: {user.email}</p> {/* Assuming user has an 'email' field */}
            <div className="flex mt-4 space-x-2">
              <button
                onClick={() => handleDeleteUser(user.id)}
                className="py-1 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300"
                >
                Delete
              </button>
            </div>
          </div>
        ))}
        </div>
      </div>
    </section>
  );
}
