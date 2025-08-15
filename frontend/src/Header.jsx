import React from "react";
import { Link, useNavigate } from "react-router-dom";

function Header() {
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <header className="bg-blue-600 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3">
        <h1 className="text-white text-xl font-bold">PDAO</h1>
        <nav className="flex gap-6">
          <Link className="text-white hover:text-gray-200" to="/dashboard">Dashboard</Link>
          <Link className="text-white hover:text-gray-200" to="/profile">Profile</Link>
          <Link className="text-white hover:text-gray-200" to="/member">Member List</Link>
          <a
            href="/logout"
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md transition"
          >
            Logout
          </a>
        </nav>
      </div>
    </header>
  );
}

export default Header;
