"use client";
import { useState, useEffect } from "react";
import { db, storage } from "../firebaseconfig";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Link from "next/link";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'events' | 'users' | 'overview' | 'members'>('overview');
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [ticketPrice, setTicketPrice] = useState<number>(0);
  const [eventVenue, setEventVenue] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [registeredUsers, setRegisteredUsers] = useState<{ [key: string]: string[] }>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    fetchEvents();
    fetchUsers();
    fetchMembers();
  }, []);

  const fetchEvents = async () => {
    try {
      const eventsCollection = collection(db, "events");
      const eventSnapshot = await getDocs(eventsCollection);
      const eventList = eventSnapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, registeredUsers: data.registeredUsers || [], ...data };
      });
      setEvents(eventList);

      const usersMap: { [key: string]: string[] } = {};
      eventList.forEach(event => {
        usersMap[event.id] = event.registeredUsers || [];
      });
      setRegisteredUsers(usersMap);
    } catch (error) {
      console.error("Error fetching events: ", error);
      setError("Failed to load events");
    }
  };

  const fetchUsers = async () => {
    try {
      const usersCollection = collection(db, "users");
      const userSnapshot = await getDocs(usersCollection);
      const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users: ", error);
      setError("Failed to load users");
    }
  };

  const fetchMembers = async () => {
    try {
      const membershipCollection = collection(db, "membership");
      const memberSnapshot = await getDocs(membershipCollection);
      const memberList = memberSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMembers(memberList);
    } catch (error) {
      console.error("Error fetching members: ", error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleToggleAdmin = async (userId: string, currentAdminStatus: boolean) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        admin: !currentAdminStatus,
      });
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, admin: !currentAdminStatus } : user
        )
      );
      setSuccess(`User ${!currentAdminStatus ? "granted" : "revoked"} admin privileges`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error updating admin status: ", error);
      setError("Failed to update admin status");
    }
  };

  const handleCreateOrUpdateEvent = async () => {
    if (eventName && description && date && ticketPrice >= 0 && eventVenue) {
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
          setSuccess("Event updated successfully!");
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
          setSuccess("Event created successfully!");
        }

        setEventName("");
        setDescription("");
        setDate("");
        setTicketPrice(0);
        setEventVenue("");
        setImage(null);
        setEditingEvent(null);
        await fetchEvents();
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        console.error("Error creating or updating event: ", error);
        setError("Failed to save event");
      } finally {
        setLoading(false);
      }
    } else {
      setError("Please fill in all fields.");
      setTimeout(() => setError(null), 3000);
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
        setSuccess("Event deleted successfully!");
        await fetchEvents();
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        console.error("Error deleting event: ", error);
        setError("Failed to delete event");
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        const userRef = doc(db, "users", userId);
        await deleteDoc(userRef);
        setSuccess("User deleted successfully!");
        await fetchUsers();
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        console.error("Error deleting user: ", error);
        setError("Failed to delete user");
      }
    }
  };

  const handleMarkAsComplete = async (eventId: string) => {
    try {
      const eventRef = doc(db, "events", eventId);
      await updateDoc(eventRef, { isComplete: true });
      setSuccess("Event marked as complete!");
      await fetchEvents();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error marking event as complete: ", error);
      setError("Failed to mark event as complete");
    }
  };

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white">{events.length}</h3>
              <p className="text-white/70">Total Events</p>
            </div>
            <i className="fi fi-sr-calendar text-3xl text-blue-400"></i>
          </div>
        </div>
        
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white">{users.length}</h3>
              <p className="text-white/70">Total Users</p>
            </div>
            <i className="fi fi-sr-users text-3xl text-green-400"></i>
          </div>
        </div>
        
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white">{users.filter(u => u.admin).length}</h3>
              <p className="text-white/70">Admin Users</p>
            </div>
            <i className="fi fi-sr-shield text-3xl text-purple-400"></i>
          </div>
        </div>
      </div>
      
      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
        <h3 className="text-2xl font-bold text-white mb-6">Recent Events</h3>
        <div className="space-y-4">
          {events.slice(0, 5).map((event) => (
            <div key={event.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-4">
                {event.imageUrl && (
                  <img src={event.imageUrl} alt={event.eventName} className="w-12 h-12 rounded-lg object-cover" />
                )}
                <div>
                  <h4 className="font-semibold text-white">{event.eventName}</h4>
                  <p className="text-white/60 text-sm">{event.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-medium">{event.registeredUsers?.length || 0} registered</p>
                <span className={`text-xs px-2 py-1 rounded-full ${event.isComplete ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {event.isComplete ? 'Complete' : 'Upcoming'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="space-y-8">
      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
          <i className="fi fi-sr-calendar-plus mr-3"></i>
          {editingEvent ? "Edit Event" : "Create New Event"}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-control">
            <label className="label">
              <span className="label-text text-white/80 font-medium">Event Name</span>
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="input bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-purple-400"
              placeholder="Enter event name"
            />
          </div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text text-white/80 font-medium">Event Date</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-purple-400"
            />
          </div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text text-white/80 font-medium">Ticket Price</span>
            </label>
            <input
              type="number"
              value={ticketPrice}
              onChange={(e) => setTicketPrice(Number(e.target.value))}
              className="input bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-purple-400"
              placeholder="0"
              min="0"
            />
          </div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text text-white/80 font-medium">Event Venue</span>
            </label>
            <input
              type="text"
              value={eventVenue}
              onChange={(e) => setEventVenue(e.target.value)}
              className="input bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-purple-400"
              placeholder="Enter venue"
            />
          </div>
          
          <div className="form-control md:col-span-2">
            <label className="label">
              <span className="label-text text-white/80 font-medium">Description</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="textarea bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-purple-400 h-24"
              placeholder="Enter event description"
            />
          </div>
          
          <div className="form-control md:col-span-2">
            <label className="label">
              <span className="label-text text-white/80 font-medium">Event Image</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="file-input file-input-bordered bg-white/10 border-white/20 text-white"
            />
          </div>
        </div>
        
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleCreateOrUpdateEvent}
            disabled={loading}
            className="btn bg-gradient-to-r from-purple-600 to-blue-600 border-0 text-white hover:from-purple-700 hover:to-blue-700 flex-1"
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="fi fi-sr-check mr-2"></i>
                {editingEvent ? "Update Event" : "Create Event"}
              </>
            )}
          </button>
          
          {editingEvent && (
            <button
              onClick={() => {
                setEditingEvent(null);
                setEventName("");
                setDescription("");
                setDate("");
                setTicketPrice(0);
                setEventVenue("");
                setImage(null);
              }}
              className="btn btn-outline text-white border-white/30 hover:bg-white/10"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
      
      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
          <i className="fi fi-sr-calendar mr-3"></i>
          All Events
        </h3>
        
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="p-6 bg-white/5 rounded-xl border border-white/10">
              <div className="flex flex-col md:flex-row gap-4">
                {event.imageUrl && (
                  <img src={event.imageUrl} alt={event.eventName} className="w-24 h-24 rounded-lg object-cover" />
                )}
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-xl font-semibold text-white">{event.eventName}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${event.isComplete ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {event.isComplete ? 'Complete' : 'Upcoming'}
                    </span>
                  </div>
                  
                  <p className="text-white/70 mb-3">{event.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-white/60 mb-4">
                    <div><i className="fi fi-sr-calendar-day mr-2"></i>{event.date}</div>
                    <div><i className="fi fi-sr-marker mr-2"></i>{event.eventVenue}</div>
                    <div><i className="fi fi-sr-dollar mr-2"></i>{event.ticketPrice === 0 ? 'Free' : `$${event.ticketPrice}`}</div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-white/80 text-sm mb-2">Registered Users ({registeredUsers[event.id]?.length || 0})</p>
                    <div className="flex flex-wrap gap-1">
                      {registeredUsers[event.id]?.slice(0, 5).map((user, index) => (
                        <span key={index} className="px-2 py-1 bg-white/10 rounded-full text-xs text-white/70">
                          {user}
                        </span>
                      ))}
                      {(registeredUsers[event.id]?.length || 0) > 5 && (
                        <span className="px-2 py-1 bg-white/10 rounded-full text-xs text-white/70">
                          +{(registeredUsers[event.id]?.length || 0) - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                {!event.isComplete && (
                  <button
                    onClick={() => handleMarkAsComplete(event.id)}
                    className="btn btn-sm bg-green-600 hover:bg-green-700 text-white border-0"
                  >
                    <i className="fi fi-sr-check mr-1"></i>
                    Mark Complete
                  </button>
                )}
                
                <button
                  onClick={() => handleEdit(event)}
                  className="btn btn-sm bg-yellow-600 hover:bg-yellow-700 text-white border-0"
                >
                  <i className="fi fi-sr-edit mr-1"></i>
                  Edit
                </button>
                
                <button
                  onClick={() => handleDeleteEvent(event.id)}
                  className="btn btn-sm bg-red-600 hover:bg-red-700 text-white border-0"
                >
                  <i className="fi fi-sr-trash mr-1"></i>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-8">
      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
          <i className="fi fi-sr-users mr-3"></i>
          All Users ({users.length})
        </h3>
        
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr className="text-white/80">
                <th>User</th>
                <th>University</th>
                <th>Admin</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/5">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <div className="mask mask-squircle w-12 h-12">
                          <img src={user.profilePic || '/images/user.png'} alt={user.name} />
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-white">{user.name}</div>
                        <div className="text-sm text-white/60">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-white/80">{user.university || 'N/A'}</td>
                  <td>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={user.admin || false}
                      onChange={() => handleToggleAdmin(user.id, user.admin || false)}
                    />
                  </td>
                  <td>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="btn btn-sm bg-red-600 hover:bg-red-700 text-white border-0"
                    >
                      <i className="fi fi-sr-trash mr-1"></i>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderMembers = () => (
    <div className="space-y-8">
      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
          <i className="fi fi-sr-star mr-3"></i>
          Spark Members ({members.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr className="text-white/80">
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Age</th>
                <th>City</th>
                <th>School/College</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-white/5">
                  <td className="text-white/90">{member.name}</td>
                  <td className="text-white/80">{member.email}</td>
                  <td className="text-white/80">{member.phone}</td>
                  <td className="text-white/80">{member.age}</td>
                  <td className="text-white/80">{member.city}</td>
                  <td className="text-white/80">{member.school}</td>
                  <td className="text-white/60">{member.timestamp ? new Date(member.timestamp.seconds * 1000).toLocaleString() : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <section className="min-h-screen w-screen bg-gradient-to-b from-slate-950 to-base-300">
      {/* Hero Section */}
      <section className='relative flex flex-col w-screen pt-32 p-10 items-center overflow-hidden'>
        <h1 className="text-4xl md:text-7xl mb-3 font-bold text-white z-10 text-center">
          Admin Dashboard
        </h1>
        <p className="text-md text-center mb-16 font-light text-white/80 z-10">
          Manage events, users, and system settings
        </p>
        
        {/* Geometric Elements */}
        <div className='absolute h-32 w-32 bg-gradient-to-br from-purple-400 to-blue-500 opacity-20 rounded-full top-24 left-32 z-0 blur-xl'></div>
        <div className='absolute h-16 w-16 bg-gradient-to-tr from-blue-600 to-purple-700 opacity-30 rounded-full bottom-20 right-10 z-0 blur-lg'></div>
        <div className='absolute h-20 w-20 bg-gradient-to-bl from-pink-400 to-purple-600 opacity-25 rounded-full top-32 right-32 z-0 blur-xl'></div>
      </section>

      {/* Main Content */}
      <section className="px-6 md:px-20 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Link href="/" className="inline-flex items-center text-white/70 hover:text-white mb-8 transition-colors duration-200">
            <i className="fi fi-sr-arrow-left mr-2"></i> Back to Home
          </Link>

          {/* Success/Error Messages */}
          {success && (
            <div className="backdrop-blur-md bg-green-500/20 border border-green-500/30 rounded-xl p-4 mb-8 text-green-100">
              <div className="flex items-center">
                <i className="fi fi-sr-check-circle mr-3"></i>
                <span>{success}</span>
              </div>
            </div>
          )}
          {error && (
            <div className="backdrop-blur-md bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-8 text-red-100">
              <div className="flex items-center">
                <i className="fi fi-sr-exclamation-triangle mr-3"></i>
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl sticky top-8">
                <nav className="space-y-2">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 ${
                      activeTab === 'overview' 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <i className="fi fi-sr-dashboard"></i>
                    <span>Overview</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('events')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 ${
                      activeTab === 'events' 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <i className="fi fi-sr-calendar"></i>
                    <span>Events</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 ${
                      activeTab === 'users' 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <i className="fi fi-sr-users"></i>
                    <span>Users</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('members')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 ${
                      activeTab === 'members' 
                        ? 'bg-gradient-to-r from-yellow-400 to-pink-500 text-white' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <i className="fi fi-sr-star"></i>
                    <span>Members</span>
                  </button>
                </nav>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1">
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'events' && renderEvents()}
              {activeTab === 'users' && renderUsers()}
              {activeTab === 'members' && renderMembers()}
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}