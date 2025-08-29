import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "./api";
import { FaBars, FaUserCircle } from "react-icons/fa";

// 🎨 Sky Blue Theme
const theme = {
  primary: "from-sky-600 to-sky-400",
  primaryText: "text-sky-600",
  secondaryText: "text-sky-400",
  cardBg: "bg-white",
  footerBg: "bg-sky-700",
  sidebarBg: "bg-sky-700",
  topbarBg: "bg-sky-700",
  linkHover: "hover:bg-white hover:text-sky-700",
};

function Header({ sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  const sidebarRef = useRef(null);
  const toggleBtnRef = useRef(null); // 👉 new ref for FaBars button

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    let timer;
    if (dropdownOpen) {
      setFadeOut(false);
      timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => setDropdownOpen(false), 500);
      }, 3000);
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

  // 👉 Close sidebar when clicking outside (ignore FaBars button)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(event.target) && // ignore clicks on FaBars
        sidebarOpen
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sidebarOpen, setSidebarOpen]);

  return (
    <>
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed top-16 left-0 h-full ${theme.sidebarBg} text-white w-64 transition-transform duration-300 z-50 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-sky-600">
          <h1 className="text-lg font-bold leading-tight">
            PERSONS WITH THIS ABILITY AFFAIR OFFICE
          </h1>
        </div>

        <nav className="flex flex-col p-6 space-y-4">
          <Link
            to="/dashboard"
            className={`text-white font-medium p-2 rounded transition-colors duration-200 ${theme.linkHover}`}
          >
            Dashboard
          </Link>

          <Link
            to="/member"
            className={`text-white font-medium p-2 rounded transition-colors duration-200 ${theme.linkHover}`}
          >
            Member List
          </Link>

          <Link
            to="/staff"
            className={`text-white font-medium p-2 rounded transition-colors duration-200 ${theme.linkHover}`}
          >
            Manage Staff
          </Link>

          <Link
            to="/events"
            className={`text-white font-medium p-2 rounded transition-colors duration-200 ${theme.linkHover}`}
          >
            Manage Events
          </Link>


        </nav>
      </aside>

      {/* Top bar */}
      <header
        className={`fixed top-0 left-0 w-full ${theme.topbarBg} text-white shadow-md flex items-center justify-between px-4 py-3 z-40`}
      >
        <div className="flex items-center space-x-3">
          <button
            ref={toggleBtnRef}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <FaBars size={20} />
          </button>
          <img src="/images/PDAO LOGO.png" alt="PDAO Logo" className="h-10 w-auto" />
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
              className={`absolute right-0 mt-2 w-48 bg-white text-black rounded shadow-lg transition-opacity duration-500 ${fadeOut ? "opacity-0" : "opacity-100"
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
