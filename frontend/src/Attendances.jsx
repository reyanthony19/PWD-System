import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "./api";
import Layout from "./Layout";

const theme = {
  primary: "from-sky-600 to-sky-400",
  primaryText: "text-sky-600",
  secondaryText: "text-sky-400",
  cardBg: "bg-white",
  footerBg: "bg-sky-700",
};

function Attendances() {
  const [attendances, setAttendances] = useState([]);
  const [event, setEvent] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  // get event_id from URL
  const queryParams = new URLSearchParams(location.search);
  const eventId = queryParams.get("event_id");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // fetch event details
        const eventRes = await api.get(`/events/${eventId}`);
        setEvent(eventRes.data);

        // fetch attendances for event
        const attRes = await api.get(`/attendances?event_id=${eventId}`);
        setAttendances(attRes.data.data || attRes.data);
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

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
          <div className="w-20 h-20 border-8 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-xl font-semibold text-sky-600 animate-pulse">
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

  return (
    <Layout>
      <div className="p-6 bg-gray-50 min-h-screen">
        <h1 className={`text-3xl font-bold ${theme.primaryText} mb-2`}>
          Attendance Records
        </h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-6">
          Event: {event?.title || `#${eventId}`}
        </h2>

        {/* Attendance Table */}
        <section className={`${theme.cardBg} rounded-2xl shadow p-6`}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead className="bg-sky-600 text-white uppercase">
                <tr>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Scanned At</th>
                  <th className="px-4 py-3">Scanned By</th>
                </tr>
              </thead>
              <tbody>
                {attendances.length > 0 ? (
                  attendances.map((a) => {
                    const fullName = a.user
                      ? `${a.user.first_name || ""} ${a.user.last_name || ""}`.trim() ||
                        a.user.name
                      : "—";

                    const scannedByName = a.scanned_by_user
                      ? `${a.scanned_by_user.first_name || ""} ${a.scanned_by_user.last_name || ""}`.trim() ||
                        a.scanned_by_user.name
                      : "—";

                    return (
                      <tr
                        key={a.id}
                        className="odd:bg-gray-100 even:bg-gray-50 hover:bg-sky-100 transition"
                      >
                        <td className="px-4 py-3">{fullName}</td>
                        <td className="px-4 py-3">
                          {a.scanned_at
                            ? new Date(a.scanned_at).toLocaleString()
                            : "—"}
                        </td>
                        <td className="px-4 py-3">{scannedByName}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="3"
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      No attendees yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-6">
          <button
            onClick={() => navigate("/events")}
            className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded-lg shadow transition duration-200"
          >
            ← Back to Events
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default Attendances;
