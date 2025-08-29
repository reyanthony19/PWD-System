import { useState } from "react";
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

function CreateEvent() {
  const [form, setForm] = useState({
    title: "",
    event_date: "",
    location: "",
    status: "upcoming",
    description: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/events", form);

      // reset form
      setForm({
        title: "",
        event_date: "",
        location: "",
        status: "upcoming",
        description: "",
      });

      setShowModal(true);
    } catch (err) {
      const errors = err.response?.data?.errors;
      const errorMessage = errors
        ? Object.values(errors).flat().join(", ")
        : err.response?.data?.message || "Failed to create event. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const closeModalAndRedirect = () => {
    setShowModal(false);
    navigate("/events");
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-6 flex justify-center">
        <div className={`w-full max-w-4xl ${theme.cardBg} shadow-lg rounded-2xl p-8`}>
          <h1 className={`text-3xl font-bold mb-6 ${theme.primaryText}`}>
            Create Event
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Event Title */}
            <input
              type="text"
              name="title"
              placeholder="Event Title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-sky-500"
            />

            {/* Event Date */}
            <input
              type="date"
              name="event_date"
              value={form.event_date}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-sky-500"
            />

            {/* Location */}
            <input
              type="text"
              name="location"
              placeholder="Location"
              value={form.location}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-sky-500"
            />

            {/* Status */}
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-sky-500"
            >
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Description */}
            <div className="md:col-span-2">
              <textarea
                name="description"
                placeholder="Event Description"
                value={form.description}
                onChange={handleChange}
                rows="4"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-sky-500"
              ></textarea>
            </div>

            {/* Submit */}
            <div className="md:col-span-2 mt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-lg shadow transition"
              >
                {loading ? "Creating Event..." : "Create Event"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${theme.cardBg} p-6 rounded-xl shadow-lg w-full max-w-sm text-center`}>
            <h3 className="text-lg font-semibold mb-2">🎉 Event Created</h3>
            <p className="text-gray-600 mb-4">
              Your event has been successfully created.
            </p>
            <button
              onClick={closeModalAndRedirect}
              className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default CreateEvent;
