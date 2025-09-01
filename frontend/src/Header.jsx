import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import {
  Menu,
  User,
  Users,
  Calendar,
  Shield,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Home,
  X,
} from "lucide-react";

function Header({ sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  const sidebarRef = useRef(null);
  const toggleBtnRef = useRef(null);
  const dropdownRef = useRef(null);

  // ✅ Fetch current user from API
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/user");
        setCurrentUser(res.data);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUser();
  }, []);

  // ✅ Auto-close dropdown after 3s
  useEffect(() => {
    let timer;
    if (dropdownOpen) {
      setFadeOut(false);
      timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => setDropdownOpen(false), 300);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [dropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const handleNavigation = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  // ✅ Close sidebar & dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(event.target) &&
        sidebarOpen
      ) {
        setSidebarOpen(false);
      }
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        dropdownOpen
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sidebarOpen, setSidebarOpen, dropdownOpen]);

  // 🚀 Navigation items
  const navigationItems = [
    { to: "/dashboard", label: "Dashboard", icon: BarChart3, gradient: "from-blue-500 to-cyan-500" },
    { to: "/member", label: "Member List", icon: Users, gradient: "from-green-500 to-emerald-500" },
    { to: "/staff", label: "Manage Staff", icon: Shield, gradient: "from-purple-500 to-violet-500" },
    { to: "/events", label: "Manage Events", icon: Calendar, gradient: "from-orange-500 to-red-500" },
    { to: "/benefits/list", label: "Manage Benefits", icon: BarChart3, gradient: "from-yellow-500 to-orange-500" }, // <-- Added
  ];

  return (
    <div className="relative">
      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 
          text-white w-72 transition-all duration-300 ease-in-out z-50 shadow-2xl border-r border-slate-700
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header */}
        <div className="relative p-6 border-b border-slate-700 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors duration-200 lg:hidden"
          >
            <X size={20} />
          </button>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">
                PWD Affairs Office
              </h1>
              <p className="text-xs text-slate-300 mt-1">Management System</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col p-6 space-y-3">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.to}
                onClick={() => handleNavigation(item.to)}
                className="group relative overflow-hidden w-full"
              >
                <div className="flex items-center space-x-3 p-4 rounded-xl transition-all duration-200 
                  hover:bg-white/10 hover:shadow-lg hover:shadow-black/20 transform hover:scale-105
                  border border-transparent hover:border-white/10">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${item.gradient} 
                    flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200`}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <span className="font-medium text-white group-hover:text-white transition-colors duration-200">
                    {item.label}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-700 bg-gradient-to-t from-slate-900 to-transparent">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/5">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {currentUser?.username || "User"}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {currentUser?.role || "Member"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Topbar */}
      <header className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-xl z-40">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left */}
          <div className="flex items-center space-x-4">
            <button
              ref={toggleBtnRef}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white 
                hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shadow-md">
                <img
                  src="/images/PDAO LOGO.png"
                  alt="PWD Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="hidden sm:block">
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  PWD System
                </h2>
                <p className="text-sm text-slate-600">Management Portal</p>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/50 transition-all duration-200 border border-transparent hover:border-white/30 hover:shadow-lg"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <User size={18} className="text-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-slate-700">
                  {currentUser?.username || "Loading..."}
                </p>
                <p className="text-xs text-slate-500">{currentUser?.email || ""}</p>
              </div>
              <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : "rotate-0"}`} />
            </button>

            {dropdownOpen && (
              <div
                className={`absolute right-0 mt-3 w-64 bg-white/90 backdrop-blur-lg border border-white/30 rounded-2xl shadow-2xl transition-all duration-300 transform origin-top-right ${fadeOut ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
              >
                {/* Info */}
                <div className="p-4 border-b border-slate-200/50 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <User size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{currentUser?.username}</p>
                      <p className="text-sm text-slate-600">{currentUser?.email}</p>
                      <div className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium mt-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                        Online
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu */}
                <div className="p-2">
                  <button
                    onClick={() => handleNavigation("/profile")}
                    className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 text-slate-700 hover:text-slate-900"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <User size={16} className="text-blue-600" />
                    </div>
                    <span className="font-medium">My Profile</span>
                  </button>
                  <button
                    onClick={() => handleNavigation("/settings")}
                    className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200 text-slate-700 hover:text-slate-900"
                  >
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Settings size={16} className="text-purple-600" />
                    </div>
                    <span className="font-medium">Settings</span>
                  </button>
                </div>

                {/* Logout */}
                <div className="p-2 border-t border-slate-200/50">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-red-50 transition-all duration-200 text-slate-700 hover:text-red-600"
                  >
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <LogOut size={16} className="text-red-600" />
                    </div>
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}

export default Header;
