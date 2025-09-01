import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, FileText, MapPin, Clock, CheckCircle, Users } from "lucide-react";
import api from "./api";
import Layout from "./Layout";

// Floating label input
const FloatingInput = ({ name, label, type = "text", required = false, value, onChange, icon: Icon }) => (
  <div className="relative group">
    {Icon && (
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 
        group-focus-within:text-blue-500 transition-colors duration-200 z-10">
        <Icon size={18} />
      </div>
    )}
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className={`w-full border-2 rounded-xl bg-white/80 backdrop-blur-sm text-gray-900 
        transition-all duration-200 peer placeholder-transparent
        ${Icon ? "pl-12 pr-4 py-4" : "px-4 py-4"}
        border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 hover:border-gray-300`}
      placeholder={label}
    />
    <label
      className={`absolute transition-all duration-200 pointer-events-none
        ${Icon ? "left-12" : "left-4"}
        ${value || type === "date" || type === "time"
          ? "top-2 text-xs font-medium"
          : "top-1/2 transform -translate-y-1/2 text-base"}
        text-gray-500 peer-focus:text-blue-600 peer-focus:top-2 peer-focus:text-xs peer-focus:font-medium`}
    >
      {label} {required && <span className="text-red-500">*</span>}
    </label>
  </div>
);

// Floating label textarea
const FloatingTextarea = ({ name, label, value, onChange, required = false, icon: Icon }) => (
  <div className="relative group">
    {Icon && (
      <div className="absolute left-3 top-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200 z-10">
        <Icon size={18} />
      </div>
    )}
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      rows="4"
      className={`w-full border-2 rounded-xl bg-white/80 backdrop-blur-sm text-gray-900 
        transition-all duration-200 peer placeholder-transparent
        ${Icon ? "pl-12 pr-4 pt-5" : "px-4 pt-5"} pb-2
        border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 hover:border-gray-300`}
      placeholder={label}
    />
    <label
      className={`absolute transition-all duration-200 pointer-events-none
        ${Icon ? "left-12" : "left-4"}
        ${value ? "top-2 text-xs font-medium" : "top-5 text-base"}
        text-gray-500 peer-focus:text-blue-600 peer-focus:top-2 peer-focus:text-xs peer-focus:font-medium`}
    >
      {label} {required && <span className="text-red-500">*</span>}
    </label>
  </div>
);

function CreateEvent() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    user_id: "",
    location: "",
    status: "upcoming", // always upcoming
  });

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Force status to upcoming
      await api.post("/events", { ...form, status: "upcoming" });
      setShowModal(true);
      setForm({
        title: "",
        description: "",
        event_date: "",
        event_time: "",
        user_id: "",
        location: "",
        status: "upcoming",
      });
    } catch (err) {
      console.error("Event creation failed:", err);
      alert("Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const closeModalAndRedirect = () => {
    setShowModal(false);
    navigate("/events");
  };

  return (
    <>
      <Layout />
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FloatingInput
                name="title"
                label="Event Title"
                required
                value={form.title}
                onChange={handleChange}
                icon={FileText}
              />
              <FloatingInput
                name="location"
                label="Event Location"
                required
                value={form.location}
                onChange={handleChange}
                icon={MapPin}
              />
              <FloatingInput
                name="event_date"
                label="Event Date"
                type="date"
                required
                value={form.event_date}
                onChange={handleChange}
                icon={Calendar}
              />
              <FloatingInput
                name="event_time"
                label="Event Time"
                type="time"
                required
                value={form.event_time}
                onChange={handleChange}
                icon={Clock}
              />
              <div className="md:col-span-2">
                <FloatingTextarea
                  name="description"
                  label="Event Description"
                  required
                  value={form.description}
                  onChange={handleChange}
                  icon={Users}
                />
              </div>
            </div>

            {/* Submit */}
            <div className="text-center">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 
                  hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 
                  text-white font-bold text-lg rounded-2xl shadow-xl 
                  transform transition-all duration-200 hover:scale-105 active:scale-95 
                  disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Creating Event...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-6 h-6 mr-3" />
                    Create Event
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">
                Event Created Successfully! 🎉
              </h3>
              <button
                onClick={closeModalAndRedirect}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 
                  text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CreateEvent;
