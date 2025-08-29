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

function Events() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("date-upcoming");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/events");
        setEvents(res.data.data || res.data); // handle pagination or raw
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
      return (
        e.title?.toLowerCase().includes(term) ||
        e.location?.toLowerCase().includes(term) ||
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

  if (loading) {
    return (
      <Layout>
        <div
          className={`flex flex-col items-center justify-center min-h-screen bg-gray-100 ${theme.primaryText}`}
        >
          <div className="w-20 h-20 border-8 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-xl font-semibold animate-pulse">
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
      <div className="p-6 bg-gray-100 min-h-screen">
        <h1 className={`text-3xl font-bold ${theme.primaryText} mb-6`}>
          Manage Events
        </h1>

        {/* Search & Sort Controls */}
        <section className={`${theme.cardBg} rounded-xl shadow p-6 mb-6`}>
          <div className="flex flex-wrap gap-4 items-center">
            <input
              type="text"
              placeholder="🔍 Search by title, location or ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
            />

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="date-upcoming">Upcoming First</option>
              <option value="date-latest">Date Created (Newest)</option>
              <option value="date-oldest">Date Created (Oldest)</option>
            </select>

            <button
              onClick={() => navigate("/events/create")}
              className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded-lg shadow transition duration-200"
            >
              + Create Event
            </button>
          </div>
        </section>

        {/* Events Table */}
        <section className={`${theme.cardBg} rounded-xl shadow p-6`}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead className="bg-sky-700 text-white uppercase">
                <tr>
                  <th className="px-4 py-3">Event Title</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Location</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <tr
                      key={event.id}
                      onClick={() => navigate(`/attendances?event_id=${event.id}`)}
                      className="odd:bg-gray-100 even:bg-gray-50 hover:bg-sky-100 cursor-pointer transition"
                    >
                      <td className="px-4 py-3">{event.title}</td>
                      <td className="px-4 py-3">
                        {new Date(event.event_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">{event.location}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="3"
                      className="px-4 py-3 text-center text-gray-500"
                    >
                      No events found.
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
