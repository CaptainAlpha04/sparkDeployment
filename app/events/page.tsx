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
    addDoc,
    query,
    where,
} from "firebase/firestore";
import { getCookie } from "../utils/cookies";

interface Event {
    id: string;
    eventName: string;
    description: string;
    date: string;
    ticketPrice: number;
    imageUrl: string;
    registeredUsers: string[]; // New field to store registered users
    eventVenue: string;
    isComplete?: boolean; // New field to mark event as completed
}
interface User {
    email: string;
    name: string;
}

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [eventDetails, setEventDetails] = useState<Event | null>(null);
   
    const [user, setUser] = useState<User | null>(null); // To store the user data
    const [membershipSuccess, setMembershipSuccess] = useState(false);
    const [membershipLoading, setMembershipLoading] = useState(false);
    const [membershipError, setMembershipError] = useState<string|null>(null);
    const [membershipForm, setMembershipForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        age: '',
        city: '',
        school: '',
    });
    const [alreadyMember, setAlreadyMember] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const sessionId = getCookie('sessionId', document.cookie);
                if (!sessionId) throw new Error('Session ID not found');
                const response = await fetch('/api/checkSession', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId }),
                });
                const data = await response.json();
                if (data.authenticated) {
                    setUser(data.userData);
                } else {
                    console.error(data.error);
                }
            } catch (error) {
                console.error("Error fetching user data: ", error);
            }
        };

        const fetchEvents = async () => {
            try {
                const eventsCollection = collection(db, "events");
                const eventSnapshot = await getDocs(eventsCollection);
                const eventList: Event[] = eventSnapshot.docs
                    .map((doc) => {
                        const data = doc.data() as DocumentData;
                        return {
                            id: doc.id,
                            eventName: data.eventName,
                            description: data.description,
                            date: data.date,
                            ticketPrice: data.ticketPrice,
                            imageUrl: data.imageUrl,
                            registeredUsers: data.registeredUsers || [],
                            eventVenue: data.eventVenue || "",
                            isComplete: data.isComplete || false,
                        };
                    })
                    .filter(event => !event.isComplete);
                setEvents(eventList);
            } catch (error) {
                console.error("Error fetching events: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
        fetchEvents();
    }, []);

    useEffect(() => {
        const checkMembership = async () => {
            setAlreadyMember(false); // Reset before checking
            if (membershipForm.email) {
                const membershipCollection = collection(db, 'membership');
                const q = query(membershipCollection, where('email', '==', membershipForm.email));
                const snapshot = await getDocs(q);
                setAlreadyMember(!snapshot.empty);
            }
        };

        checkMembership();
    }, [membershipForm.email]);

    async function handleRegister(eventId: string) {
        if (user) {
            try {
                // Update user's registered events
                const userRef = doc(db, "users", user.email);
                await updateDoc(userRef, {
                    registeredEvents: arrayUnion(eventId),
                });

                // Update event's registered users
                const eventRef = doc(db, "events", eventId);
                await updateDoc(eventRef, {
                    registeredUsers: arrayUnion(user.name), // Register user by name
                });
                
                //show the success modal
                (document.getElementById("success_modal") as HTMLDialogElement).showModal();
                window.location.reload();
            } catch (error) {
                console.error("Error registering for event: ", error);
            }
        } else {
            alert("You need to log in first!");
        }
    }

    const moreDetailsModals = (event: Event) => {
        (
            document.getElementById("my_modal_1") as HTMLDialogElement
        ).showModal();
        setEventDetails(event);
    };

    const handleMembershipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMembershipForm({ ...membershipForm, [e.target.name]: e.target.value });
    };

    const handleMembershipSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMembershipLoading(true);
        setMembershipError(null);
        try {
            const membershipCollection = collection(db, 'membership');
            const q = query(membershipCollection, where('email', '==', membershipForm.email));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                setAlreadyMember(true);
                setMembershipError('You are already a Spark Member!');
                setMembershipLoading(false);
                return;
            }
            await addDoc(membershipCollection, {
                ...membershipForm,
                timestamp: new Date(),
            });
            setMembershipSuccess(true);
            setAlreadyMember(true);
            setMembershipForm({
                name: user?.name || '',
                email: user?.email || '',
                phone: '',
                age: '',
                city: '',
                school: '',
            });
        } catch (err) {
            setMembershipError('Failed to submit membership. Please try again.');
        } finally {
            setMembershipLoading(false);
        }
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
                    <div className="modal-action">
                        <form method="dialog">
                            <button className="btn btn-primary">Close</button>
                        </form>
                    </div>
                </div>
            </dialog>

            <dialog id="success_modal" className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-2xl">Registered Successfully</h3>
                    <div className="modal-action">
                        <form method="dialog">
                            <button className="btn btn-primary">Close</button>
                        </form>
                    </div>
                </div>
            </dialog>

            {/* Spark Membership Section */}
            {user && (
                <div className="max-w-2xl mx-auto mb-12 p-10 rounded-3xl shadow-2xl bg-gradient-to-br from-purple-900/90 to-blue-900/80 border border-white/20 text-white relative overflow-hidden">
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-yellow-400/30 to-pink-500/20 rounded-full blur-2xl z-0"></div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-tr from-blue-400/30 to-purple-500/20 rounded-full blur-2xl z-0"></div>
                    <div className="relative z-10">
                        <h2 className="text-4xl font-extrabold mb-2 text-center tracking-tight flex items-center justify-center gap-2">
                            <i className="fi fi-sr-star text-yellow-400"></i> Spark Membership
                        </h2>
                        <p className="mb-6 text-center text-lg font-light">Join the Spark family and unlock exclusive opportunities, resources, and a vibrant network of changemakers.</p>
                        {alreadyMember ? (
                            <div className="bg-green-500/20 border border-green-400/40 rounded-lg p-4 text-green-100 text-center mb-4 flex flex-col items-center">
                                <i className="fi fi-sr-badge-check text-3xl mb-2 text-green-300"></i>
                                <span className="text-lg font-semibold">You are a Spark Member!</span>
                            </div>
                        ) : membershipSuccess ? (
                            <div className="bg-green-500/20 border border-green-400/40 rounded-lg p-4 text-green-100 text-center mb-4 flex flex-col items-center">
                                <i className="fi fi-sr-badge-check text-3xl mb-2 text-green-300"></i>
                                <span className="text-lg font-semibold">Thank you for becoming a Spark Member!</span>
                            </div>
                        ) : (
                            <form className="space-y-5" onSubmit={handleMembershipSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <label className="flex flex-col gap-1">
                                        <span className="font-semibold flex items-center gap-2"><i className="fi fi-sr-user"></i>Name</span>
                                        <input name="name" value={membershipForm.name} onChange={handleMembershipChange} required placeholder="Your Full Name" className="input input-bordered w-full bg-white/10 text-white placeholder-white/60 focus:bg-white/20 focus:ring-2 focus:ring-yellow-400" />
                                    </label>
                                    <label className="flex flex-col gap-1">
                                        <span className="font-semibold flex items-center gap-2"><i className="fi fi-sr-envelope"></i>Email</span>
                                        <input name="email" value={membershipForm.email} onChange={handleMembershipChange} required placeholder="you@email.com" className="input input-bordered w-full bg-white/10 text-white placeholder-white/60 focus:bg-white/20 focus:ring-2 focus:ring-blue-400" />
                                    </label>
                                    <label className="flex flex-col gap-1">
                                        <span className="font-semibold flex items-center gap-2"><i className="fi fi-sr-phone"></i>Phone</span>
                                        <input name="phone" value={membershipForm.phone} onChange={handleMembershipChange} required placeholder="03xx-xxxxxxx" className="input input-bordered w-full bg-white/10 text-white placeholder-white/60 focus:bg-white/20 focus:ring-2 focus:ring-green-400" />
                                    </label>
                                    <label className="flex flex-col gap-1">
                                        <span className="font-semibold flex items-center gap-2"><i className="fi fi-sr-calendar"></i>Age</span>
                                        <input name="age" value={membershipForm.age} onChange={handleMembershipChange} required placeholder="Your Age" className="input input-bordered w-full bg-white/10 text-white placeholder-white/60 focus:bg-white/20 focus:ring-2 focus:ring-purple-400" />
                                    </label>
                                    <label className="flex flex-col gap-1 md:col-span-2">
                                        <span className="font-semibold flex items-center gap-2"><i className="fi fi-sr-marker"></i>City</span>
                                        <input name="city" value={membershipForm.city} onChange={handleMembershipChange} required placeholder="Your City" className="input input-bordered w-full bg-white/10 text-white placeholder-white/60 focus:bg-white/20 focus:ring-2 focus:ring-pink-400" />
                                    </label>
                                    <label className="flex flex-col gap-1 md:col-span-2">
                                        <span className="font-semibold flex items-center gap-2"><i className="fi fi-sr-graduation-cap"></i>School/College</span>
                                        <input name="school" value={membershipForm.school} onChange={handleMembershipChange} required placeholder="Your School or College" className="input input-bordered w-full bg-white/10 text-white placeholder-white/60 focus:bg-white/20 focus:ring-2 focus:ring-indigo-400" />
                                    </label>
                                </div>
                                {membershipError && <div className="text-red-300 text-center font-semibold">{membershipError}</div>}
                                <button type="submit" className="btn btn-primary w-full mt-2 text-lg font-bold tracking-wide shadow-lg" disabled={membershipLoading}>{membershipLoading ? 'Submitting...' : 'Become a Spark Member'}</button>
                            </form>
                        )}
                        {/* WhatsApp Community Section */}
                        <div className="mt-10 text-center">
                            <h3 className="text-2xl font-semibold mb-2 flex items-center justify-center gap-2"><i className="fi fi-brands-whatsapp text-green-400"></i> Stay Connected!</h3>
                            <p className="mb-4 text-white/80">For more updates and to stay connected to Spark, join our WhatsApp community:</p>
                            <a href="https://chat.whatsapp.com/CpkgBqnUOjnKejyWY1LfLN?mode=ac_t" target="_blank" rel="noopener noreferrer" className="inline-block px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full shadow-lg transition-all text-lg"><i className="fi fi-brands-whatsapp mr-2"></i>Join WhatsApp Community</a>
                        </div>
                    </div>
                </div>
            )}

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
                                <div className="absolute inset-0 bg-black/50 rounded-2xl transition-all duration-300 group-hover:bg-opacity-70 group-hover:backdrop-blur-lg"></div>

                                <img
                                    src={event.imageUrl ?? "/images/login-bg.jpg"}
                                    alt="Event Image"
                                    className="w-full rounded-2xl"
                                />

                                <h2 className="absolute bottom-0 left-0 text-3xl font-bold pb-4 pl-4 text-white transition-transform duration-300 group-hover:scale-110">
                                    {event.eventName}
                                </h2>
                            </div>

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

                                {/* Check if user is registered for this event */}
                                {user && event.registeredUsers.includes(user.name) ? (
                                    <button
                                        className="btn bg-gray-400 text-gray-700 mt-auto cursor-not-allowed"
                                        disabled
                                    >
                                        Registered
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleRegister(event.id)}
                                        className="btn btn-neutral mt-auto hover:bg-violet-600"
                                    >
                                        Register
                                    </button>
                                )}
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
