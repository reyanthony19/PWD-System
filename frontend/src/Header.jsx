import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "./api";
import { FaBars, FaUserCircle } from "react-icons/fa";

function Header({ sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    let timer;
    if (dropdownOpen) {
      setFadeOut(false); // reset fade
      timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => setDropdownOpen(false), 500); // wait for fade animation
      }, 3000); // stays open 3s
    }
    return () => clearTimeout(timer);
  }, [dropdownOpen]);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get("/user");
      setCurrentUser(res.data);
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 h-full bg-blue-900 text-white w-64 transition-transform duration-300 z-50 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button onClick={() => setSidebarOpen(false)}>
          <div className="flex items-center justify-between p-4 border-b border-blue-900">
            <h1 className="text-xl font-bold">
              PERSONS WITH THIS ABILITY AFFAIR OFFICE
            </h1>
          </div>
        </button>

        <nav className="flex flex-col p-10 space-y-4">
          <Link
            to="/dashboard"
            className="text-white font-medium hover:bg-white hover:text-blue-900 p-2 rounded transition-colors duration-200"
          >
            Dashboard
          </Link>

          <Link
            to="/member"
            className="text-white font-medium hover:bg-white hover:text-blue-900 p-2 rounded transition-colors duration-200"
          >
            Member List
          </Link>
          
          <Link
            to="/staff"
            className="text-white font-medium hover:bg-white hover:text-blue-900 p-2 rounded transition-colors duration-200"
          >
            Manage Staff
          </Link>
        </nav>
      </aside>

      {/* Top bar */}
      <header className="fixed top-0 left-0 w-full bg-blue-900 text-white shadow-md flex items-center justify-between px-4 py-3 z-40">
        <div className="flex items-center space-x-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            <FaBars size={20} />
          </button>
          {/* Logo */}
          <img
            src="/images/PDAO LOGO.png"
            alt=""
            className="h-10 w-auto"
          />
          <span className="font-bold text-lg">PWD System</span>
        </div>

        <div className="relative mr-12">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2"
          >
            <FaUserCircle size={40} />
          </button>

          {dropdownOpen && (
            <div
              className={`absolute right-0 mt-2 w-48 bg-white text-black rounded shadow-lg transition-opacity duration-500 ${
                fadeOut ? "opacity-0" : "opacity-100"
              }`}
            >
              <div className="px-4 py-2 border-b">
                <p className="font-semibold">{currentUser?.username}</p>
                <p className="text-xs text-gray-500">{currentUser?.email}</p>
              </div>
              <Link
                to="/profile"
                className="block px-4 py-2 text-black hover:bg-gray-100"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-red-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>
    </>
  );
}

export default Header;
