import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import Layout from "./Layout";

const theme = {
  primary: "from-sky-600 to-sky-400",
  primaryText: "text-sky-600",
  secondaryText: "text-sky-400",
  cardBg: "bg-white",
  footerBg: "bg-sky-700",
};

// Barangay options (same as in CreateEvent)
const barangayOptions = [
  "All", "Awang", "Bagocboc", "Barra", "Bonbon", "Cauyonan", "Igpit",
  "Limonda", "Luyong Bonbon", "Malanang", "Nangcaon", "Patag",
  "Poblacion", "Taboc", "Tingalan"
];

function Events() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("date-upcoming");
  const [barangayFilter, setBarangayFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // Calculate event status based on current date
  const calculateEventStatus = (event) => {
    const today = new Date();
    const eventDate = new Date(event.event_date);
    
    // Set both dates to midnight for accurate comparison
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    
    if (eventDate < today) {
      return "completed";
    } else if (eventDate.getTime() === today.getTime()) {
      return "ongoing";
    } else {
      return "upcoming";
    }
  };

  // Get status color and display text
  const getStatusInfo = (event) => {
    const status = calculateEventStatus(event);
    
    switch (status) {
      case "upcoming":
        return { 
          color: "bg-green-100 text-green-800",
          text: "Upcoming"
        };
      case "ongoing":
        return { 
          color: "bg-yellow-100 text-yellow-800",
          text: "Ongoing"
        };
      case "completed":
        return { 
          color: "bg-gray-100 text-gray-800",
          text: "Completed"
        };
      default:
        return { 
          color: "bg-gray-100 text-gray-800",
          text: "Unknown"
        };
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/events");
        setEvents(res.data.data || res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load events.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredEvents = events
    .filter((e) => {
      const term = searchTerm.toLowerCase();
      
      // Barangay filter
      if (barangayFilter !== "All") {
        if (e.target_barangay !== barangayFilter) {
          return false;
        }
      }
      
      // Search filter
      return (
        e.title?.toLowerCase().includes(term) ||
        e.location?.toLowerCase().includes(term) ||
        e.target_barangay?.toLowerCase().includes(term) ||
        e.id.toString().includes(term)
      );
    })
    .sort((a, b) => {
      if (sortOption === "date-upcoming") {
        return new Date(a.event_date) - new Date(b.event_date);
      }
      if (sortOption === "date-latest") {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      if (sortOption === "date-oldest") {
        return new Date(a.created_at) - new Date(b.created_at);
      }
      return 0;
    });

  // Count events per barangay for the filter badge
  const barangayCounts = events.reduce((acc, event) => {
    const barangay = event.target_barangay || "Unspecified";
    acc[barangay] = (acc[barangay] || 0) + 1;
    return acc;
  }, {});

  // Count events by status
  const statusCounts = events.reduce((acc, event) => {
    const status = calculateEventStatus(event);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
          <div className="w-20 h-20 border-8 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-xl font-semibold text-sky-600 animate-pulse">
            Loading Events...
          </p>
          <p className="text-gray-600 text-sm">Please wait a moment 📅</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen text-red-600 font-bold text-lg">
          {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <h1 className={`text-3xl font-bold ${theme.primaryText} mb-6`}>
          Manage Events
        </h1>

        {/* Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-green-600">{statusCounts.upcoming || 0}</div>
            <div className="text-sm text-green-800">Upcoming Events</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.ongoing || 0}</div>
            <div className="text-sm text-yellow-800">Ongoing Events</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-gray-600">{statusCounts.completed || 0}</div>
            <div className="text-sm text-gray-800">Completed Events</div>
          </div>
        </div>

        {/* Search & Sort Controls */}
        <section className={`${theme.cardBg} rounded-2xl shadow p-6 mb-6`}>
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search Input */}
            <input
              type="text"
              placeholder="🔍 Search by title, location, barangay or ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
            />

            {/* Barangay Filter */}
            <div className="relative">
              <select
                value={barangayFilter}
                onChange={(e) => setBarangayFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none cursor-pointer"
              >
                {barangayOptions.map((barangay) => (
                  <option key={barangay} value={barangay}>
                    {barangay} {barangay !== "All" && `(${barangayCounts[barangay] || 0})`}
                  </option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Sort Option */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="date-upcoming">Upcoming First</option>
              <option value="date-latest">Date Created (Newest)</option>
              <option value="date-oldest">Date Created (Oldest)</option>
            </select>

            {/* Create Event Button */}
            <button
              onClick={() => navigate("/events/create")}
              className="ml-auto bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded-lg shadow transition duration-200 flex items-center gap-2"
            >
              <span>+</span>
              <span>Create Event</span>
            </button>
          </div>

          {/* Active Filters Display */}
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            {(searchTerm || barangayFilter !== "All") && (
              <span className="text-xs text-gray-600 font-medium">Active filters:</span>
            )}
            
            {searchTerm && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                Search: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-blue-600 hover:text-blue-800 font-bold"
                >
                  ×
                </button>
              </span>
            )}
            
            {barangayFilter !== "All" && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                Barangay: {barangayFilter}
                <button
                  onClick={() => setBarangayFilter("All")}
                  className="text-green-600 hover:text-green-800 font-bold"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </section>

        {/* Results Summary */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredEvents.length} of {events.length} events
          {barangayFilter !== "All" && ` in ${barangayFilter}`}
          {searchTerm && ` matching "${searchTerm}"`}
        </div>

        {/* Events Table */}
        <section className={`${theme.cardBg} rounded-2xl shadow p-6`}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead className="bg-sky-600 text-white uppercase">
                <tr>
                  <th className="px-4 py-3">Event Title</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Barangay</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => {
                    const statusInfo = getStatusInfo(event);
                    return (
                      <tr
                        key={event.id}
                        onClick={() =>
                          navigate(`/attendances?event_id=${event.id}`)
                        }
                        className="odd:bg-gray-100 even:bg-gray-50 hover:bg-sky-100 cursor-pointer transition"
                      >
                        <td className="px-4 py-3 font-medium text-gray-700">
                          {event.title}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(event.event_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {event.location}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            event.target_barangay === 'All' 
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {event.target_barangay || 'Unspecified'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-4xl mb-2">📅</div>
                        <p className="text-lg font-medium mb-1">No events found</p>
                        <p className="text-sm text-gray-600">
                          {searchTerm || barangayFilter !== "All" 
                            ? "Try adjusting your search or filter criteria"
                            : "No events have been created yet"
                          }
                        </p>
                        {(searchTerm || barangayFilter !== "All") && (
                          <button
                            onClick={() => {
                              setSearchTerm("");
                              setBarangayFilter("All");
                            }}
                            className="mt-3 text-sky-600 hover:text-sky-700 text-sm font-medium"
                          >
                            Clear all filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default Events;