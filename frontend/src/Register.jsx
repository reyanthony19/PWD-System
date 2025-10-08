import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Phone,
  Calendar,
  MapPin,
  Shield,
  CheckCircle,
  Building,
} from "lucide-react";
import api from "./api";
import Layout from "./Layout";

const barangayOptions = [
  "Awang", "Bagocboc", "Barra", "Bonbon", "Cauyonan", "Igpit",
  "Limonda", "Luyong Bonbon", "Malanang", "Nangcaon", "Patag",
  "Poblacion", "Taboc", "Tingalan"
];

// ---- Floating Input ----
const FloatingInput = React.memo(function FloatingInput({
  name,
  label,
  type = "text",
  value,
  onChange,
  required = false,
  maxLength,
  icon: Icon,
}) {
  return (
    <div className="relative group">
      {Icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200 z-10">
          <Icon size={18} />
        </div>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        maxLength={maxLength}
        placeholder={label}
        className={`w-full border-2 rounded-xl bg-white/80 backdrop-blur-sm text-gray-900 
          transition-all duration-200 peer placeholder-transparent
          ${Icon ? "pl-12 pr-4 py-4" : "px-4 py-4"}
          border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 hover:border-gray-300`}
      />
      <label
        className={`absolute transition-all duration-200 pointer-events-none
          ${Icon ? "left-12" : "left-4"}
          ${
            value || type === "date"
              ? "top-2 text-xs font-medium text-blue-600"
              : "top-1/2 transform -translate-y-1/2 text-base text-gray-500"
          }
          peer-focus:top-2 peer-focus:text-xs peer-focus:font-medium peer-focus:text-blue-600 peer-focus:transform-none`}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    </div>
  );
});

// ---- Floating Select ----
// ---- Fixed Floating Select with Better Z-index ----
const FloatingSelect = React.memo(function FloatingSelect({
  name,
  label,
  value,
  onChange,
  options,
  required = false,
  icon: Icon,
}) {
  const hasValue = value !== "";

  return (
    <div className="relative group">
      {Icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200 z-20">
          <Icon size={18} />
        </div>
      )}
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full border-2 border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm 
          transition-all duration-200 cursor-pointer hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 relative z-10
          ${hasValue ? "text-gray-900" : "text-gray-500"}
          ${Icon ? "pl-12 pr-4 py-4" : "px-4 py-4"}`}
      >
        <option value="" className="text-gray-500">Select {label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value} className="text-gray-900">
            {option.label}
          </option>
        ))}
      </select>
      <label
        className={`absolute transition-all duration-200 pointer-events-none z-0
          ${Icon ? "left-12" : "left-4"}
          ${
            hasValue
              ? "top-2 text-xs font-medium text-blue-600"
              : "top-1/2 transform -translate-y-1/2 text-base text-gray-500"
          }
          peer-focus:top-2 peer-focus:text-xs peer-focus:font-medium peer-focus:text-blue-600 peer-focus:transform-none`}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    </div>
  );
});

// ---- Main Component ----
function Register() {
  const [form, setForm] = useState({
    username: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    sex: "",
    email: "",
    role: "staff", // default role
    status: "approved", // default status
    password: "",
    contact_number: "",
    birthdate: "",
    address: "",
    assigned_barangay: "", // new field
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleChange = useCallback(
    (e) => {
      setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    },
    [setForm]
  );

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/staff/register", form);

      // Reset form but keep defaults
      setForm({
        username: "",
        first_name: "",
        middle_name: "",
        last_name: "",
        sex: "",
        email: "",
        role: "staff",
        status: "approved",
        password: "",
        contact_number: "",
        birthdate: "",
        address: "",
        assigned_barangay: "",
      });

      setShowModal(true);
    } catch (err) {
      const errors = err.response?.data?.errors;
      const errorMessage = errors
        ? Object.values(errors).flat().join(", ")
        : err.response?.data?.message ||
          "Registration failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const closeModalAndRedirect = () => {
    setShowModal(false);
    navigate("/register");
  };

  return (
    <>
      <Layout />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Staff Registration
            </h1>
          </div>

          {error && (
            <div className="mb-6 mx-auto max-w-2xl">
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          <form
            onSubmit={handleRegister}
            className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FloatingInput
                name="username"
                label="Username"
                required
                value={form.username}
                onChange={handleChange}
                icon={User}
              />
              <FloatingInput
                name="email"
                label="Email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                icon={Mail}
              />
              <FloatingInput
                name="password"
                label="Password"
                type="password"
                required
                value={form.password}
                onChange={handleChange}
                icon={Lock}
              />
              <FloatingInput
                name="contact_number"
                label="Contact Number"
                maxLength={11}
                value={form.contact_number}
                onChange={(e) => {
                  if (/^\d*$/.test(e.target.value) && e.target.value.length <= 11) {
                    handleChange(e);
                  }
                }}
                icon={Phone}
              />
              <FloatingInput
                name="first_name"
                label="First Name"
                required
                value={form.first_name}
                onChange={handleChange}
                icon={User}
              />
              <FloatingInput
                name="middle_name"
                label="Middle Name"
                value={form.middle_name}
                onChange={handleChange}
              />
              <FloatingInput
                name="last_name"
                label="Last Name"
                required
                value={form.last_name}
                onChange={handleChange}
              />
              <FloatingInput
                name="birthdate"
                label="Date of Birth"
                type="date"
                value={form.birthdate}
                onChange={handleChange}
                icon={Calendar}
              />
              <FloatingSelect
                name="sex"
                label="Sex"
                value={form.sex}
                onChange={handleChange}
                options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                ]}
                icon={User}
              />
              <FloatingInput
                name="address"
                label="Address"
                value={form.address}
                onChange={handleChange}
                icon={MapPin}
              />
              <FloatingSelect
                name="assigned_barangay"
                label="Assigned Barangay"
                value={form.assigned_barangay}
                onChange={handleChange}
                options={barangayOptions.map(barangay => ({
                  value: barangay,
                  label: barangay
                }))}
                icon={Building}
              />
              <FloatingSelect
                name="role"
                label="Role"
                value={form.role}
                onChange={handleChange}
                options={[
                  { value: "staff", label: "Staff" },
                  { value: "admin", label: "Admin" },
                ]}
                required
                icon={Shield}
              />
            </div>

            {/* Submit Button */}
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
                    Registering...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-6 h-6 mr-3" />
                    Register Staff
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
            <div className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">
                Registration Successful! 🎉
              </h3>
              <p className="text-gray-600 mb-6">
                Staff member has been registered successfully and is now active in the system.
              </p>
              <button
                onClick={closeModalAndRedirect}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 
                  text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                Register Another Staff
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Register;