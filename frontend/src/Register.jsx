import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import Layout from "./Layout";

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
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/staff/register", form);

      // Reset form but keep defaults for role/status
      setForm({
        username: "",
        first_name: "",
        middle_name: "",
        last_name: "",
        email: "",
        role: "staff",
        status: "approved",
        password: "",
        contact_number: "",
        birthdate: "",
        address: "",
        id_number: "",
      });

      setShowModal(true);
    } catch (err) {
      const errors = err.response?.data?.errors;
      const errorMessage = errors
        ? Object.values(errors).flat().join(", ")
        : err.response?.data?.message || "Registration failed. Please try again.";
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
      <Layout/>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-lg bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-6">Register Staff</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Username */}
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* First Name */}
            <input
              type="text"
              name="first_name"
              placeholder="First Name"
              value={form.first_name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Middle Name */}
            <input
              type="text"
              name="middle_name"
              placeholder="Middle Name"
              value={form.middle_name}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Last Name */}
            <input
              type="text"
              name="last_name"
              placeholder="Last Name"
              value={form.last_name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Email */}
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Password */}
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Contact Number */}
            <input
              type="text"
              name="contact_number"
              placeholder="Contact Number"
              value={form.contact_number}
              onChange={(e) => {
                // Allow only digits and max 11 characters
                if (/^\d*$/.test(e.target.value) && e.target.value.length <= 11) {
                  handleChange(e);
                }
              }}
              maxLength={11}
              className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />


            {/* Birthdate */}
            <input
              type="date"
              name="birthdate"
              value={form.birthdate}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Address */}
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={form.address}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Role */}
            <div>
              <label className="block text-gray-600 mb-1">Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm text-center">
            <h3 className="text-lg font-semibold mb-2">Registration Successful</h3>
            <p className="text-gray-600 mb-4">Your account has been created.</p>
            <button
              onClick={closeModalAndRedirect}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
             Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Register;
