import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Users, CalendarCheck2, ArrowLeft, MapPin, Search } from "lucide-react";
import api from "./api";
import Layout from "./Layout";

function Attendances() {
  const [attendances, setAttendances] = useState([]);
  const [filteredAttendances, setFilteredAttendances] = useState([]);
  const [event, setEvent] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // filters
  const [search, setSearch] = useState("");
  const [barangayFilter, setBarangayFilter] = useState("");
  const [scannedByFilter, setScannedByFilter] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const eventId = queryParams.get("event_id");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventRes = await api.get(`/events/${eventId}`);
        setEvent(eventRes.data);

        const attRes = await api.get(`/attendances?event_id=${eventId}`);
        const data = attRes.data.data || attRes.data;
        setAttendances(data);
        setFilteredAttendances(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load event or attendances.");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [eventId]);

  // apply filters
  useEffect(() => {
    let data = [...attendances];

    if (search) {
      data = data.filter((a) => {
        const fullName = a.user
          ? `${a.user.first_name || ""} ${a.user.last_name || ""}`.toLowerCase()
          : "";
        return fullName.includes(search.toLowerCase());
      });
    }

    if (barangayFilter) {
      data = data.filter((a) => a.user?.barangay === barangayFilter);
    }

    if (scannedByFilter) {
      data = data.filter(
        (a) => a.scanned_by_user?.id?.toString() === scannedByFilter
      );
    }

    setFilteredAttendances(data);
  }, [search, barangayFilter, scannedByFilter, attendances]);

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
          <div className="w-20 h-20 border-8 border-purple-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-xl font-semibold text-blue-600 animate-pulse">
            Loading Attendance...
          </p>
          <p className="text-gray-600 text-sm">Please wait a moment 🎟️</p>
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

  // collect unique values for dropdowns
  const barangays = [
    ...new Set(attendances.map((a) => a.user?.barangay).filter(Boolean)),
  ];
  const scannedByUsers = [
    ...new Set(attendances.map((a) => a.scanned_by_user?.id).filter(Boolean)),
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-10 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
            <div className="flex items-center gap-4">
              <Users className="w-10 h-10 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Attendance Records
                </h1>
                <h2 className="text-lg font-medium text-gray-600 flex flex-col sm:flex-row sm:items-center sm:gap-4 mt-2">
                  <span className="flex items-center">
                    <CalendarCheck2 className="inline w-5 h-5 mr-1 text-blue-500" />
                    Event: {event?.title || `#${eventId}`}
                  </span>
                  {event && (
                    <span className="text-sm text-gray-500">
                      {new Date(event.event_date).toLocaleDateString()} at{" "}
                      {event.event_time
                        ? new Date(
                            `1970-01-01T${event.event_time}`
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : "—"}
                      {" · "}
                      <MapPin className="inline w-4 h-4 text-gray-400 mr-1" />
                      {event.location}
                      {" · "}
                      <span
                        className={`font-semibold ${
                          event.status === "upcoming"
                            ? "text-green-600"
                            : event.status === "completed"
                            ? "text-gray-600"
                            : "text-red-600"
                        }`}
                      >
                        {event.status}
                      </span>
                    </span>
                  )}
                </h2>
              </div>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            {/* Search */}
            <div className="flex items-center gap-2 w-full sm:w-1/3">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search attendee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Barangay Filter */}
            <div className="w-full sm:w-1/4">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Filter by Barangay
              </label>
              <select
                value={barangayFilter}
                onChange={(e) => setBarangayFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">All</option>
                {barangays.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Scanned By Filter */}
            <div className="w-full sm:w-1/4">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Filter by Scanned By
              </label>
              <select
                value={scannedByFilter}
                onChange={(e) => setScannedByFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">All</option>
                {scannedByUsers.map((id) => {
                  const user = attendances.find(
                    (a) => a.scanned_by_user?.id === id
                  )?.scanned_by_user;
                  return (
                    <option key={id} value={id}>
                      {user
                        ? `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                          user.name
                        : "Unknown"}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Attendance Table */}
          <section className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left border-collapse">
                <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white uppercase">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-2xl">Full Name</th>
                    <th className="px-6 py-4">Barangay</th>
                    <th className="px-6 py-4">Scanned At</th>
                    <th className="px-6 py-4 rounded-tr-2xl">Scanned By</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendances.length > 0 ? (
                    filteredAttendances.map((a) => {
                      const fullName = a.user
                        ? `${a.user.first_name || ""} ${
                            a.user.last_name || ""
                          }`.trim() || a.user.name
                        : "—";

                      const scannedByName = a.scanned_by_user
                        ? `${a.scanned_by_user.first_name || ""} ${
                            a.scanned_by_user.last_name || ""
                          }`.trim() || a.scanned_by_user.name
                        : "—";

                      return (
                        <tr
                          key={a.id}
                          className="odd:bg-gray-50 even:bg-gray-100 hover:bg-blue-50 transition"
                        >
                          <td className="px-6 py-4">{fullName}</td>
                          <td className="px-6 py-4">{a.user?.barangay || "—"}</td>
                          <td className="px-6 py-4">
                            {a.scanned_at
                              ? new Date(a.scanned_at).toLocaleString([], {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })
                              : "—"}
                          </td>
                          <td className="px-6 py-4">{scannedByName}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No attendees found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Back Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate("/events")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Events
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Attendances;
