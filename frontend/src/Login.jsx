import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "./api";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    const storedPassword = localStorage.getItem("password");
    const storedRememberMe = localStorage.getItem("rememberMe") === "true";

    if (storedRememberMe) {
      setForm({ email: storedEmail || "", password: storedPassword || "" });
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const token = localStorage.getItem("token");
    if (token) {
      alert("Someone is already logged in");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/login", form);

      if (response.data.user?.role !== "admin") {
        setError("Access denied. You must be an admin to login.");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", response.data.token);

      if (rememberMe) {
        localStorage.setItem("email", form.email);
        localStorage.setItem("password", form.password);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("email");
        localStorage.removeItem("password");
        localStorage.setItem("rememberMe", "false");
      }

      navigate("/dashboard");
    } catch (err) {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md transform transition-all duration-300 hover:scale-[1.02]">
        <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-800">
          Admin Login
        </h2>

        {error && (
          <p className="text-red-500 text-sm mb-4 bg-red-100 p-2 rounded-md text-center">
            {error}
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg 
                         shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 
                         focus:border-indigo-400 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg 
                         shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 
                         focus:border-indigo-400 transition"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg 
                       hover:bg-indigo-700 focus:outline-none focus:ring-2 
                       focus:ring-indigo-400 focus:ring-offset-1 transition font-semibold"
          >
            {loading ? "Loading..." : "Login"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          <Link
            to="/forgot-password"
            className="text-indigo-600 hover:text-indigo-800 transition"
          >
            Forgot Password?
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
