import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "./api";

// 🎨 Sky Blue Theme
const theme = {
  primary: "bg-sky-600 hover:bg-sky-700 focus:ring-sky-400",
  accent: "text-sky-600",
};

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
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="flex w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Left Panel with Logo */}
        <div className="hidden md:flex md:w-1/2 bg-sky-700 items-center justify-center p-6">
          <img
            src="images/PDAO LOGO.png"
            alt="Logo"
            className="w-48 h-48 object-contain"
          />
        </div>

        {/* Right Panel with Form */}
        <div className="w-full md:w-1/2 p-8">
          <h2 className="text-2xl font-bold mb-2 text-gray-800 text-center">
            Login
          </h2>
          <p className="text-sm text-yellow-600 mb-6 text-center font-medium">
            ⚠️ Only Admins are allowed to log in.
          </p>

          {error && (
            <p className="text-red-500 text-sm mb-4 bg-red-100 p-2 rounded-md text-center">
              {error}
            </p>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email with floating label */}
            <div className="relative">
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="Email"
                className="peer block w-full px-4 pt-5 pb-2 border border-gray-300 rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-sky-400 
                           focus:border-sky-400 placeholder-transparent"
              />
              <label
                htmlFor="email"
                className="absolute left-4 top-2 text-gray-500 text-sm transition-all 
                           peer-placeholder-shown:top-4 peer-placeholder-shown:text-gray-400 
                           peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm 
                           peer-focus:text-sky-600"
              >
                Email
              </label>
            </div>

            {/* Password with floating label */}
            <div className="relative">
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Password"
                className="peer block w-full px-4 pt-5 pb-2 border border-gray-300 rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-sky-400 
                           focus:border-sky-400 placeholder-transparent"
              />
              <label
                htmlFor="password"
                className="absolute left-4 top-2 text-gray-500 text-sm transition-all 
                           peer-placeholder-shown:top-4 peer-placeholder-shown:text-gray-400 
                           peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm 
                           peer-focus:text-sky-600"
              >
                Password
              </label>
            </div>

            {/* Remember Me + Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="h-4 w-4 text-sky-600 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Remember me</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-sm text-sky-600 hover:text-sky-800 transition"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 rounded-lg text-white font-semibold transition ${theme.primary}`}
            >
              {loading ? "Loading..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
