import React from "react";
import { Link, useNavigate } from "react-router-dom";

function Header() {
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <header className="bg-blue-900 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <h1 className="text-3xl font-extrabold tracking-wide">PDAO</h1>

        {/* Navigation Links */}
        <nav className="flex space-x-6">
          <Link
            to="/dashboard"
            className="text-white font-bold text-lg px-4 py-2 rounded-lg hover:bg-blue-700 focus:bg-blue-700 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/profile"
            className="text-white font-bold text-lg px-4 py-2 rounded-lg hover:bg-blue-700 focus:bg-blue-700 transition-colors"
          >
            Profile
          </Link>
          <Link
            to="/member"
            className="text-white font-bold text-lg px-4 py-2 rounded-lg hover:bg-blue-700 focus:bg-blue-700 transition-colors"
          >
            Member List
          </Link>
          <a
            href="/logout"
            onClick={handleLogout}
            className="text-white font-bold text-lg px-4 py-2 rounded-lg hover:bg-blue-700 focus:bg-blue-700 transition-colors"
          >
            Logout
          </a>
        </nav>
      </div>
    </header>




  );
}

export default Header;
