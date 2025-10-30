import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, FileText, MapPin, Clock, CheckCircle, Users, Navigation } from "lucide-react";
import api from "./api";
import Layout from "./Layout";

// Barangay options
const barangayOptions = [
  "All", "Awang", "Bagocboc", "Barra", "Bonbon", "Cauyonan", "Igpit",
  "Limonda", "Luyong Bonbon", "Malanang", "Nangcaon", "Patag",
  "Poblacion", "Taboc", "Tingalan"
];

// Floating label input
const FloatingInput = ({ name, label, type = "text", required = false, value, onChange, icon: Icon, min }) => (
  <div className="relative group">
    {Icon && (
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 
        group-focus-within:text-sky-500 transition-colors duration-200 z-10">
        <Icon size={18} />
      </div>
    )}
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      min={min}
      className={`w-full border-2 rounded-xl bg-white/80 backdrop-blur-sm text-gray-900 
        transition-all duration-200 peer placeholder-transparent
        ${Icon ? "pl-12 pr-4 py-4" : "px-4 py-4"}
        border-gray-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 hover:border-gray-300`}
      placeholder={label}
    />
    <label
      className={`absolute transition-all duration-200 pointer-events-none
        ${Icon ? "left-12" : "left-4"}
        ${value || type === "date" || type === "time"
          ? "top-2 text-xs font-medium"
          : "top-1/2 transform -translate-y-1/2 text-base"}
        text-gray-500 peer-focus:text-sky-600 peer-focus:top-2 peer-focus:text-xs peer-focus:font-medium`}
    >
      {label} {required && <span className="text-red-500">*</span>}
    </label>
  </div>
);

// Floating label textarea
const FloatingTextarea = ({ name, label, value, onChange, required = false, icon: Icon }) => (
  <div className="relative group">
    {Icon && (
      <div className="absolute left-3 top-5 text-gray-400 group-focus-within:text-sky-500 transition-colors duration-200 z-10">
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
        border-gray-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 hover:border-gray-300`}
      placeholder={label}
    />
    <label
      className={`absolute transition-all duration-200 pointer-events-none
        ${Icon ? "left-12" : "left-4"}
        ${value ? "top-2 text-xs font-medium" : "top-5 text-base"}
        text-gray-500 peer-focus:text-sky-600 peer-focus:top-2 peer-focus:text-xs peer-focus:font-medium`}
    >
      {label} {required && <span className="text-red-500">*</span>}
    </label>
  </div>
);

// Floating label select
const FloatingSelect = ({ name, label, required = false, value, onChange, options, icon: Icon }) => (
  <div className="relative group">
    {Icon && (
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 
        group-focus-within:text-sky-500 transition-colors duration-200 z-10">
        <Icon size={18} />
      </div>
    )}
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className={`w-full border-2 rounded-xl bg-white/80 backdrop-blur-sm text-gray-900 
        transition-all duration-200 peer placeholder-transparent appearance-none
        ${Icon ? "pl-12 pr-10 py-4" : "px-4 py-4"}
        border-gray-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 hover:border-gray-300
        ${!value ? "text-gray-400" : "text-gray-900"}`}
    >
      <option value="" disabled className="text-gray-400">Event for Barangay {label}</option>
      {options.map((option) => (
        <option key={option} value={option} className="text-gray-900">
          {option}
        </option>
      ))}
    </select>
    <label
      className={`absolute transition-all duration-200 pointer-events-none
        ${Icon ? "left-12" : "left-4"}
        ${value
          ? "top-2 text-xs font-medium"
          : "top-1/2 transform -translate-y-1/2 text-base"}
        text-gray-500 peer-focus:text-sky-600 peer-focus:top-2 peer-focus:text-xs peer-focus:font-medium`}
    >
      {label} {required && <span className="text-red-500"></span>}
    </label>
    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
);

function CreateEvent() {
  const [minDate, setMinDate] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    event_date: "",
    event_time: "08:30",
    user_id: "",
    location: "",
    target_barangay: "",
    status: "upcoming",
  });

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  // Calculate minimum date (3 days from current date)
  useEffect(() => {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 3);

    // Format to YYYY-MM-DD for input min attribute
    const formattedMinDate = minDate.toISOString().split('T')[0];
    setMinDate(formattedMinDate);
  }, []);

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
      // Force status to upcoming and include target_barangay
      await api.post("/events", {
        ...form,
        status: "upcoming",
        target_barangay: form.target_barangay
      });
      setShowModal(true);
      // Reset form including target_barangay
      setForm({
        title: "",
        description: "",
        event_date: "",
        event_time: "08:30", // Reset to default time
        user_id: "",
        location: "",
        target_barangay: "",
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
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-sky-600 to-blue-600 rounded-full mb-4 shadow-lg">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Create New Event</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Schedule a new event for PDAO members and staff
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
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
                min={minDate}
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
              {/* Target Barangay Dropdown */}
              <FloatingSelect
                name="target_barangay"
                required
                value={form.target_barangay}
                onChange={handleChange}
                options={barangayOptions}
                icon={Navigation}
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

            {/* Date restriction info */}
            <div className="text-center text-sm text-gray-600 bg-sky-50 p-3 rounded-lg border border-sky-200">
              <p>📅 Event dates must be scheduled at least 3 days in advance. The earliest available date is {minDate}.</p>
            </div>

            {/* Submit */}
            <div className="text-center">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-sky-600 to-blue-600 
                  hover:from-sky-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 
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
              <p className="text-gray-600 mb-6">
                Your event has been scheduled and is now visible to members.
              </p>
              <button
                onClick={closeModalAndRedirect}
                className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 
                  text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                Continue to Events
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CreateEvent;