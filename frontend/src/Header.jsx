import { useState, useEffect, useRef, useCallback } from "react";
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
  RefreshCw,
  Gift,
  TrendingUp,
  FileText
} from "lucide-react";

// Cache configuration
const CACHE_KEYS = {
  CURRENT_USER: 'header_current_user',
  TIMESTAMP: 'header_cache_timestamp'
};

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for user data

// Cache utility functions
const cache = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const { data, timestamp } = JSON.parse(item);

      if (Date.now() - timestamp > CACHE_DURATION) {
        cache.clear(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  },

  set: (key, data) => {
    try {
      const item = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error('Error writing to cache:', error);
    }
  },

  clear: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },

  clearAll: () => {
    Object.values(CACHE_KEYS).forEach(key => {
      cache.clear(key);
    });
  },

  isValid: (key) => {
    const data = cache.get(key);
    return data !== null;
  }
};

function Header({ sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [loading, setLoading] = useState(false);

  const sidebarRef = useRef(null);
  const toggleBtnRef = useRef(null);
  const dropdownRef = useRef(null);

  // ✅ Fetch current user from API with caching
  const fetchUser = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);

      const cachedUser = !forceRefresh && cache.get(CACHE_KEYS.CURRENT_USER);
      if (cachedUser && !forceRefresh) {
        setCurrentUser(cachedUser);
        return;
      }

      const res = await api.get("/user");
      setCurrentUser(res.data);
      cache.set(CACHE_KEYS.CURRENT_USER, res.data);
    } catch (err) {
      console.error("Error fetching user:", err);

      const cachedUser = cache.get(CACHE_KEYS.CURRENT_USER);
      if (cachedUser) {
        setCurrentUser(cachedUser);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    const interval = setInterval(() => fetchUser(), 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchUser]);

  // Manual refresh function
  const handleRefreshUser = () => {
    cache.clear(CACHE_KEYS.CURRENT_USER);
    fetchUser(true);
  };

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
    cache.clearAll();
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
    { to: "/dashboard", label: "Dashboard", icon: TrendingUp, gradient: "from-sky-500 to-blue-500" },
    { to: "/member", label: "Member List", icon: Users, gradient: "from-green-500 to-emerald-500" },
    { to: "/staff", label: "Manage Staff", icon: Shield, gradient: "from-purple-500 to-violet-500" },
    { to: "/events", label: "Manage Events", icon: Calendar, gradient: "from-orange-500 to-amber-500" },
    { to: "/benefits/list", label: "Manage Benefits", icon: Gift, gradient: "from-pink-500 to-rose-500" },
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
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-sky-900 via-sky-800 to-sky-900 
          text-white w-72 transition-all duration-300 ease-in-out z-50 shadow-2xl border-r border-sky-700
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header */}
        <div className="relative p-6 border-b border-sky-700 bg-gradient-to-r from-sky-600/20 to-blue-600/20">
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors duration-200 lg:hidden"
          >
            <X size={20} />
          </button>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">
                PDAO System
              </h1>
              <p className="text-xs text-sky-300 mt-1">Management Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col p-6 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.to}
                onClick={() => handleNavigation(item.to)}
                className="group relative overflow-hidden w-full"
              >
                <div className="flex items-center space-x-3 p-4 rounded-xl transition-all duration-200 
                  hover:bg-white/10 hover:shadow-lg hover:shadow-sky-500/20 transform hover:scale-105
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
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-sky-700 bg-gradient-to-t from-sky-900 to-transparent">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/5">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg flex items-center justify-center">
              {loading ? (
                <RefreshCw size={16} className="text-white animate-spin" />
              ) : (
                <User size={16} className="text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {currentUser?.username || "Loading..."}
              </p>
              <p className="text-xs text-sky-300 truncate">
                {currentUser?.role || "User"}
              </p>
            </div>
            <button
              onClick={handleRefreshUser}
              disabled={loading}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
              title="Refresh user data"
            >
              <RefreshCw size={12} className={`text-sky-300 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </aside>

      {/* Topbar */}
      <header className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm z-40">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left */}
          <div className="flex items-center space-x-4">
            <button
              ref={toggleBtnRef}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white 
                hover:from-sky-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shadow-md bg-white p-1">
                <img
                  src="/images/PDAO LOGO.png"
                  alt="PWD Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="hidden sm:block">
                <h2 className="text-xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                  PDAO Management System
                </h2>
                <p className="text-sm text-gray-600">Persons with Disability Affairs Office</p>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              disabled={loading}
              className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200 hover:shadow-lg disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg">
                {loading ? (
                  <RefreshCw size={18} className="text-white animate-spin" />
                ) : (
                  <User size={18} className="text-white" />
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-gray-800">
                  {currentUser?.username || "Loading..."}
                </p>
                <p className="text-xs text-gray-500">{currentUser?.email || ""}</p>
              </div>
              <ChevronDown size={16} className={`text-gray-500 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : "rotate-0"}`} />
            </button>

            {dropdownOpen && (
              <div
                className={`absolute right-0 mt-3 w-64 bg-white/90 backdrop-blur-lg border border-gray-200 rounded-2xl shadow-2xl transition-all duration-300 transform origin-top-right ${fadeOut ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
              >
                {/* Info */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-sky-50 to-blue-50 rounded-t-2xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                      {loading ? (
                        <RefreshCw size={20} className="text-white animate-spin" />
                      ) : (
                        <User size={20} className="text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{currentUser?.username || "Loading..."}</p>
                      <p className="text-sm text-gray-600">{currentUser?.email || ""}</p>
                      <div className="flex items-center justify-between mt-1">
                        <div className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                          Online
                        </div>
                        <button
                          onClick={handleRefreshUser}
                          disabled={loading}
                          className="p-1 rounded hover:bg-white transition-colors disabled:opacity-50"
                          title="Refresh data"
                        >
                          <RefreshCw size={12} className={`text-gray-500 ${loading ? "animate-spin" : ""}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu */}
                <div className="p-2">
                  <button
                    onClick={() => handleNavigation("/profile")}
                    className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 transition-all duration-200 text-gray-700 hover:text-gray-900"
                  >
                    <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                      <User size={16} className="text-sky-600" />
                    </div>
                    <span className="font-medium">My Profile</span>
                  </button>
                  <button
                    onClick={() => handleNavigation("/settings")}
                    className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 text-gray-700 hover:text-gray-900"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Settings size={16} className="text-blue-600" />
                    </div>
                    <span className="font-medium">Settings</span>
                  </button>
                </div>

                {/* Logout */}
                <div className="p-2 border-t border-gray-200">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-red-50 transition-all duration-200 text-gray-700 hover:text-red-600"
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