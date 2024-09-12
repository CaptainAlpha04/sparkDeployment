"use client";
import { useEffect, useState } from "react";
import { db } from "../firebaseconfig";
import {
    collection,
    getDocs,
    doc,
    DocumentData,
    updateDoc,
    arrayUnion,
} from "firebase/firestore";

interface Event {
    id: string;
    eventName: string;
    description: string;
    date: string;
    ticketPrice: number;
    imageUrl: string;
    registeredUsers: string[]; // New field to store registered users
    eventVenue: string;
}

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [eventDetails, setEventDetails] = useState<Event | null>(null);

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
                        imageUrl: data.imageUrl, // Handle imageUrl if it exists
                        registeredUsers: data.registeredUsers || [], // Ensure this field is handled
                        eventVenue: data.eventVenue || "", // Handle the new venue field
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

    const moreDetailsModals = (event: Event) => {
        (
            document.getElementById("my_modal_1") as HTMLDialogElement
        ).showModal();
        setEventDetails(event);
    };

    return (
        <section className="min-h-screen w-screen p-6 pt-24 font-poppins bg-base-300">
            <dialog id="my_modal_1" className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-2xl">Event Details</h3>
                    <p className="pt-4">
                        <b>Venue:</b> {eventDetails?.eventVenue}
                    </p>
                    <p className="py-2 text-wrap w-full">
                        <b>Description:</b> {eventDetails?.description}
                    </p>
                    {/* Added venue */}
                    <div className="modal-action">
                        <form method="dialog">
                            {/* if there is a button in form, it will close the modal */}
                            <button className="btn btn-primary">Close</button>
                        </form>
                    </div>
                </div>
            </dialog>

            <h1 className="text-6xl mb-6 font-extralight">
                <span className="font-bold">Upcoming</span> <br /> Events
            </h1>
            {loading ? (
                <p className="">Loading...</p>
            ) : events.length > 0 ? (
                <ul className="grid grid-cols-subgrid md:grid-cols-3 gap-5 mb-40">
                    {events.map((event) => (
                        <li
                            key={event.id}
                            className="bg-base-100 rounded-2xl display-animation"
                        >
                            <div className="relative group">
                                {/* Blur overlay */}
                                <div className="absolute inset-0 bg-black/50 rounded-2xl transition-all duration-300 group-hover:bg-opacity-70 group-hover:backdrop-blur-lg"></div>

                                {/* Image */}
                                <img
                                    src={event.imageUrl ?? "/images/planets.jpg"}
                                    alt=""
                                    className="w-full rounded-2xl"
                                />

                                {/* Event title */}
                                <h2 className="absolute bottom-0 left-0 text-3xl font-bold pb-4 pl-4 text-white transition-transform duration-300 group-hover:scale-110">
                                    {event.eventName}
                                </h2>
                            </div>

                            {/* Event details */}
                            <div className="p-6 rounded-xl flex flex-col gap-4">
                                <div className="flex flex-row justify-stretch gap-2 text-xs">
                                    <p className="bg-purple-400 p-2 text-base-300 rounded-3xl">
                                        <b>{event.date}</b>
                                    </p>
                                    <p className="bg-yellow-400 text-base-300 p-2 rounded-3xl">
                                        <b>
                                            {event.ticketPrice === 0
                                                ? "Free"
                                                : "PKR " +
                                                    event.ticketPrice.toFixed(2)}
                                        </b>
                                    </p>
                                </div>
                                {/* Description */}
                                <span className="text-gray-300 text-sm flex justify-between">
                                    <p>
                                        <b>Details:</b> {event.description.length > 50? event.description.substring(0, 50) + "..." : event.description}
                                    </p>
                                    <b
                                        className="cursor-pointer"
                                        onClick={() => {
                                            moreDetailsModals(event);
                                        }}
                                    >
                                        More...
                                    </b>
                                </span>

                                <button
                                    onClick={() => handleRegister(event.id)}
                                    className="btn btn-neutral mt-auto hover:bg-violet-600"
                                >
                                    Register
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-700">No events available.</p>
            )}
        </section>
    );
}
