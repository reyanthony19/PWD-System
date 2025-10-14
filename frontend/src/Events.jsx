import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  ChevronDown,
  MapPin,
  Calendar,
  Clock,
  CalendarCheck,
  AlertCircle,
  Archive,
  RefreshCw,
  Users,
  AlertTriangle
} from "lucide-react";
import api from "./api";
import Layout from "./Layout";

// Cache configuration
const CACHE_KEYS = {
  EVENTS: 'eventslist_events',
  TIMESTAMP: 'eventslist_cache_timestamp'
};

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

// Cache utility functions
const cache = {
  // Get data from cache
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const { data, timestamp } = JSON.parse(item);

      // Check if cache is still valid
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

  // Set data in cache
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

  // Clear specific cache
  clear: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },

  // Clear all events cache
  clearAll: () => {
    Object.values(CACHE_KEYS).forEach(key => {
      cache.clear(key);
    });
  },

  // Check if cache is valid
  isValid: (key) => {
    const data = cache.get(key);
    return data !== null;
  }
};

function Events() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("date-upcoming");
  const [barangayFilter, setBarangayFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("upcoming"); // "upcoming", "ongoing", "completed"
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const navigate = useNavigate();

  // Load initial data from cache
  useEffect(() => {
    const cachedEvents = cache.get(CACHE_KEYS.EVENTS);
    if (cachedEvents) {
      setEvents(cachedEvents);
      setLoading(false);
    }
  }, []);

  const fetchEvents = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Check cache first unless force refresh
      const cachedEvents = !forceRefresh && cache.get(CACHE_KEYS.EVENTS);
      if (cachedEvents && !forceRefresh) {
        setEvents(cachedEvents);
        setLastUpdated(new Date());
        return;
      }

      const res = await api.get("/events");
      const eventsData = res.data.data || res.data;
      setEvents(eventsData);
      cache.set(CACHE_KEYS.EVENTS, eventsData);
      setLastUpdated(new Date());
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load events.");

      // If API fails, try to use cached data as fallback
      const cachedEvents = cache.get(CACHE_KEYS.EVENTS);
      if (cachedEvents) {
        setEvents(cachedEvents);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    // Increase interval since we have caching now
    const interval = setInterval(() => fetchEvents(), 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [fetchEvents]);

  // Manual refresh function
  const handleRefresh = () => {
    cache.clear(CACHE_KEYS.EVENTS);
    fetchEvents(true);
  };

  // Calculate event status based on current date
  const calculateEventStatus = useCallback((event) => {
    const today = new Date();
    const eventDate = new Date(event.event_date);

    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    if (eventDate < today) {
      return "completed";
    } else if (eventDate.getTime() === today.getTime()) {
      return "ongoing";
    } else {
      return "upcoming";
    }
  }, []);

  // Get status color and display text
  const getStatusInfo = useCallback((event) => {
    const status = calculateEventStatus(event);

    switch (status) {
      case "upcoming":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          gradient: "from-green-500 to-green-600",
          text: "Upcoming",
          icon: <CalendarCheck className="w-4 h-4" />,
          badgeColor: "bg-green-500",
          rowHighlight: false
        };
      case "ongoing":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          gradient: "from-yellow-500 to-yellow-600",
          text: "Ongoing",
          icon: <Clock className="w-4 h-4" />,
          badgeColor: "bg-yellow-500",
          rowHighlight: true
        };
      case "completed":
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          gradient: "from-gray-500 to-gray-600",
          text: "Completed",
          icon: <Archive className="w-4 h-4" />,
          badgeColor: "bg-gray-500",
          rowHighlight: false
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          gradient: "from-gray-500 to-gray-600",
          text: "Unknown",
          icon: <AlertCircle className="w-4 h-4" />,
          badgeColor: "bg-gray-500",
          rowHighlight: false
        };
    }
  }, [calculateEventStatus]);

  // Memoized events by status
  const eventsByStatus = useMemo(() => {
    const upcoming = [];
    const ongoing = [];
    const completed = [];

    events.forEach(event => {
      const status = calculateEventStatus(event);
      if (status === "upcoming") upcoming.push(event);
      else if (status === "ongoing") ongoing.push(event);
      else if (status === "completed") completed.push(event);
    });

    return { upcoming, ongoing, completed };
  }, [events, calculateEventStatus]);

  // Memoized filtered events for current tab
  const filteredEventsForTab = useMemo(() => {
    let eventsToFilter = [];

    switch (activeTab) {
      case "upcoming":
        eventsToFilter = eventsByStatus.upcoming;
        break;
      case "ongoing":
        eventsToFilter = eventsByStatus.ongoing;
        break;
      case "completed":
        eventsToFilter = eventsByStatus.completed;
        break;
      default:
        eventsToFilter = eventsByStatus.upcoming;
    }

    return eventsToFilter
      .filter((e) => {
        const term = searchTerm.toLowerCase();

        // Barangay filter
        if (barangayFilter !== "All") {
          if (e.target_barangay !== barangayFilter) {
            return false;
          }
        }

        // Search filter
        return (
          e.title?.toLowerCase().includes(term) ||
          e.location?.toLowerCase().includes(term) ||
          e.target_barangay?.toLowerCase().includes(term) ||
          e.id.toString().includes(term)
        );
      })
      .sort((a, b) => {
        if (sortOption === "date-upcoming") {
          return new Date(a.event_date) - new Date(b.event_date);
        }
        if (sortOption === "date-latest") {
          return new Date(b.created_at) - new Date(a.created_at);
        }
        if (sortOption === "date-oldest") {
          return new Date(a.created_at) - new Date(b.created_at);
        }
        return 0;
      });
  }, [eventsByStatus, activeTab, searchTerm, barangayFilter, sortOption]);

  // Memoized counts
  const barangayCounts = useMemo(() => {
    return events.reduce((acc, event) => {
      const barangay = event.target_barangay || "Unspecified";
      acc[barangay] = (acc[barangay] || 0) + 1;
      return acc;
    }, {});
  }, [events]);

  const statusCounts = useMemo(() => {
    return {
      upcoming: eventsByStatus.upcoming.length,
      ongoing: eventsByStatus.ongoing.length,
      completed: eventsByStatus.completed.length
    };
  }, [eventsByStatus]);

  // Memoized available barangays
  const availableBarangays = useMemo(() => {
    return [...new Set(
      events
        .map(event => event.target_barangay)
        .filter(Boolean)
    )].sort();
  }, [events]);

  // Tab configuration - removed "All Events"
  const tabs = [
    { id: "upcoming", name: "Upcoming", count: statusCounts.upcoming, color: "green" },
    { id: "ongoing", name: "Ongoing", count: statusCounts.ongoing, color: "yellow" },
    { id: "completed", name: "Completed", count: statusCounts.completed, color: "gray" }
  ];

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 border-8 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-xl font-semibold text-blue-600 animate-pulse">
              Loading Events...
            </p>
            <p className="text-gray-600 text-sm mt-2">Please wait a moment 📅</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && events.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-4 inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 py-8 px-4">
        {/* Background Decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow delay-1000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative">
          {/* Cache Status Indicator */}
          <div className="mb-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {cache.isValid(CACHE_KEYS.EVENTS) ? (
                <span className="text-green-600 flex items-center gap-2">
                  <CalendarCheck size={16} />
                  Using cached data
                </span>
              ) : (
                <span className="text-yellow-600 flex items-center gap-2">
                  <RefreshCw size={16} />
                  Fetching fresh data
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {lastUpdated && (
                <span className="text-xs text-gray-500">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 
                         rounded-lg text-sm font-medium hover:bg-blue-200 
                         transition-colors disabled:opacity-50"
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
              <div className="flex items-start gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl shadow-lg">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Event Management
                  </h1>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        Manage and track all system events
                      </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        Total Events: {events.length}
                      </span>
                      <span className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
                        <CalendarCheck className="w-4 h-4 text-green-500" />
                        Upcoming: {statusCounts.upcoming || 0}
                      </span>
                      <span className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full">
                        <Clock className="w-4 h-4 text-yellow-500" />
                        Ongoing: {statusCounts.ongoing || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 min-w-[300px]">
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-5 rounded-2xl shadow-lg text-center">
                  <CalendarCheck className="w-7 h-7 mx-auto mb-3 opacity-90" />
                  <div className="text-2xl font-bold">{statusCounts.upcoming || 0}</div>
                  <div className="text-green-100 text-xs font-medium">Upcoming</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-5 rounded-2xl shadow-lg text-center">
                  <Clock className="w-7 h-7 mx-auto mb-3 opacity-90" />
                  <div className="text-2xl font-bold">{statusCounts.ongoing || 0}</div>
                  <div className="text-yellow-100 text-xs font-medium">Ongoing</div>
                </div>
                <div className="bg-gradient-to-br from-gray-500 to-gray-600 text-white p-5 rounded-2xl shadow-lg text-center">
                  <Archive className="w-7 h-7 mx-auto mb-3 opacity-90" />
                  <div className="text-2xl font-bold">{statusCounts.completed || 0}</div>
                  <div className="text-gray-100 text-xs font-medium">Completed</div>
                </div>
              </div>
            </div>
          </div>

          {/* Ongoing Events Banner */}
          {eventsByStatus.ongoing.length > 0 && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl shadow-xl p-6 border-2 border-yellow-300">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">
                      Ongoing Events Today! 🎉
                    </h3>
                    <p className="text-yellow-100 text-sm">
                      There {eventsByStatus.ongoing.length === 1 ? 'is' : 'are'} currently {eventsByStatus.ongoing.length} event{eventsByStatus.ongoing.length === 1 ? '' : 's'} happening today.
                      Don't forget to track attendance!
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("ongoing")}
                    className="bg-white text-orange-600 hover:bg-orange-50 px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                  >
                    View Ongoing Events
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Status Tabs */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-2 mb-8">
            <div className="flex space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-4 px-6 rounded-2xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === tab.id
                      ? `bg-${tab.color}-500 text-white shadow-lg transform scale-105`
                      : `bg-${tab.color}-50 text-${tab.color}-700 hover:bg-${tab.color}-100 hover:shadow-md`
                    }`}
                >
                  {tab.name}
                  <span className={`px-2 py-1 rounded-full text-xs ${activeTab === tab.id
                      ? 'bg-white text-gray-800'
                      : `bg-${tab.color}-200 text-${tab.color}-800`
                    }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Search + Filters */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-end gap-6">
              {/* Search */}
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Search Events
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by title, location, barangay, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl 
                             bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 
                             focus:border-blue-500 transition-all duration-200 placeholder-gray-400
                             shadow-sm hover:shadow-md focus:shadow-lg"
                  />
                </div>
              </div>

              {/* Barangay Filter */}
              <div className="w-full lg:w-64">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Filter by Barangay
                </label>
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={barangayFilter}
                    onChange={(e) => setBarangayFilter(e.target.value)}
                    className="w-full pl-12 pr-10 py-4 border border-gray-200 rounded-2xl 
                             bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 
                             focus:border-blue-500 transition-all duration-200 appearance-none
                             shadow-sm hover:shadow-md focus:shadow-lg"
                  >
                    <option value="All">All Barangays</option>
                    {availableBarangays.map(barangay => (
                      <option key={barangay} value={barangay}>
                        {barangay} ({barangayCounts[barangay] || 0})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Sort Option */}
              <div className="w-full lg:w-64">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full px-4 py-4 border border-gray-200 rounded-2xl 
                           bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 
                           focus:border-blue-500 transition-all duration-200 appearance-none
                           shadow-sm hover:shadow-md focus:shadow-lg"
                >
                  <option value="date-upcoming">Upcoming First</option>
                  <option value="date-latest">Date Created (Newest)</option>
                  <option value="date-oldest">Date Created (Oldest)</option>
                </select>
              </div>

              {/* Create Event Button */}
              <button
                onClick={() => navigate("/events/create")}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 
                         hover:from-green-600 hover:to-green-700 text-white rounded-2xl 
                         transition-all duration-200 font-semibold shadow-lg hover:shadow-xl 
                         transform hover:-translate-y-0.5"
              >
                <span className="text-lg">+</span>
                Create Event
              </button>
            </div>

            {/* Active Filters Display */}
            {(searchTerm || barangayFilter !== "All") && (
              <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-gray-100">
                <span className="text-sm font-semibold text-gray-600">Active filters:</span>

                {searchTerm && (
                  <span className="bg-blue-100 text-blue-800 text-sm px-4 py-2 rounded-full flex items-center gap-2 font-medium">
                    Search: "{searchTerm}"
                    <button
                      onClick={() => setSearchTerm("")}
                      className="text-blue-600 hover:text-blue-800 font-bold text-lg leading-none"
                    >
                      ×
                    </button>
                  </span>
                )}

                {barangayFilter !== "All" && (
                  <span className="bg-purple-100 text-purple-800 text-sm px-4 py-2 rounded-full flex items-center gap-2 font-medium">
                    Barangay: {barangayFilter}
                    <button
                      onClick={() => setBarangayFilter("All")}
                      className="text-purple-600 hover:text-purple-800 font-bold text-lg leading-none"
                    >
                      ×
                    </button>
                  </span>
                )}

                <button
                  onClick={() => {
                    setSearchTerm("");
                    setBarangayFilter("All");
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800 font-semibold underline ml-auto"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Results Summary */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-lg font-semibold text-gray-700">
                {filteredEventsForTab.length} {activeTab} events
              </span>
              {barangayFilter !== "All" && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  From {barangayFilter}
                </span>
              )}
              {searchTerm && (
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  Matching: "{searchTerm}"
                </span>
              )}
            </div>
          </div>

          {/* Events Table */}
          <section className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <th className="px-8 py-5 font-semibold text-left text-sm uppercase tracking-wider">
                      Event Information
                    </th>
                    <th className="px-8 py-5 font-semibold text-left text-sm uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-8 py-5 font-semibold text-left text-sm uppercase tracking-wider">
                      Location & Barangay
                    </th>
                    <th className="px-8 py-5 font-semibold text-left text-sm uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-8 py-5 font-semibold text-left text-sm uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEventsForTab.length > 0 ? (
                    filteredEventsForTab.map((event) => {
                      const statusInfo = getStatusInfo(event);
                      return (
                        <tr
                          key={event.id}
                          className={`hover:bg-gray-50/80 transition-all duration-150 group ${statusInfo.rowHighlight ? 'bg-yellow-50/60 border-l-4 border-yellow-400' : ''
                            }`}
                        >
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${statusInfo.rowHighlight
                                  ? 'bg-yellow-100'
                                  : 'bg-gradient-to-br from-blue-100 to-purple-100'
                                }`}>
                                <Calendar className={`w-5 h-5 ${statusInfo.rowHighlight ? 'text-yellow-600' : 'text-blue-600'
                                  }`} />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {event.title}
                                  {statusInfo.rowHighlight && (
                                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-yellow-500 text-white">
                                      LIVE NOW
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  ID: {event.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2 text-gray-700">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                {new Date(event.event_date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  weekday: 'short'
                                })}
                              </div>
                              {event.event_time && (
                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                  <Clock className="w-3 h-3 text-gray-400" />
                                  {new Date(`1970-01-01T${event.event_time}`).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2 text-gray-700">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{event.location}</span>
                              </div>
                              <div>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${event.target_barangay === 'All'
                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                  }`}>
                                  {event.target_barangay || 'Unspecified'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${statusInfo.color}`}>
                              {statusInfo.icon}
                              {statusInfo.text}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => navigate(`/attendances?event_id=${event.id}`)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 
                                         text-white rounded-xl transition-all duration-200 font-medium 
                                         text-sm hover:shadow-md transform hover:-translate-y-0.5"
                              >
                                <Users className="w-4 h-4" />
                                View Attendance
                              </button>

                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-8 py-16 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <Calendar className="w-20 h-20 mb-4 opacity-40" />
                          <p className="text-xl font-semibold text-gray-500 mb-2">
                            No {activeTab} events found
                          </p>
                          <p className="text-sm max-w-md">
                            {searchTerm || barangayFilter !== "All"
                              ? "Try adjusting your search or filter criteria"
                              : `No ${activeTab} events at the moment`
                            }
                          </p>
                          {(searchTerm || barangayFilter !== "All") && (
                            <button
                              onClick={() => {
                                setSearchTerm("");
                                setBarangayFilter("All");
                              }}
                              className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium underline"
                            >
                              Clear all filters
                            </button>
                          )}
                          {!searchTerm && barangayFilter === "All" && activeTab === "upcoming" && (
                            <button
                              onClick={() => navigate("/events/create")}
                              className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                            >
                              <span>+</span>
                              Create First Event
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}

export default Events;