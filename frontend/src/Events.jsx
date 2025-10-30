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
  AlertTriangle,
  Plus,
  ChevronLeft,
  ChevronRight
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

function Events() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("date-upcoming");
  const [barangayFilter, setBarangayFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("upcoming");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

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
    const interval = setInterval(() => fetchEvents(), 300000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const handleRefresh = () => {
    cache.clear(CACHE_KEYS.EVENTS);
    fetchEvents(true);
  };

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

  const getStatusInfo = useCallback((event) => {
    const status = calculateEventStatus(event);

    switch (status) {
      case "upcoming":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          text: "Upcoming",
          icon: <CalendarCheck className="w-4 h-4" />,
          rowHighlight: false
        };
      case "ongoing":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          text: "Ongoing",
          icon: <Clock className="w-4 h-4" />,
          rowHighlight: true
        };
      case "completed":
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          text: "Completed",
          icon: <Archive className="w-4 h-4" />,
          rowHighlight: false
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          text: "Unknown",
          icon: <AlertCircle className="w-4 h-4" />,
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

        if (barangayFilter !== "All") {
          if (e.target_barangay !== barangayFilter) {
            return false;
          }
        }

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

  // Pagination
  const totalPages = Math.ceil(filteredEventsForTab.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredEventsForTab.slice(indexOfFirstRow, indexOfLastRow);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, barangayFilter, activeTab]);

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

  const availableBarangays = useMemo(() => {
    return [...new Set(
      events
        .map(event => event.target_barangay)
        .filter(Boolean)
    )].sort();
  }, [events]);

  const tabs = [
    { id: "upcoming", name: "Upcoming", count: statusCounts.upcoming, color: "green" },
    { id: "ongoing", name: "Ongoing", count: statusCounts.ongoing, color: "yellow" },
    { id: "completed", name: "Completed", count: statusCounts.completed, color: "gray" }
  ];

  const clearAllFilters = () => {
    setSearchTerm("");
    setBarangayFilter("All");
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-lg font-medium text-gray-600">Loading Events...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && events.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md text-center">
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
      <div className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="bg-blue-600 p-3 rounded-xl">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">Event Management</h1>
                  <p className="text-gray-600 mt-2">Manage and track all system events</p>
                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-600">
                    <span className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      Total Events: {events.length}
                    </span>
                    <span className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
                      <CalendarCheck className="w-4 h-4 text-green-600" />
                      Upcoming: {statusCounts.upcoming || 0}
                    </span>
                    <span className="flex items-center gap-2 bg-yellow-100 px-3 py-1 rounded-full">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      Ongoing: {statusCounts.ongoing || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 min-w-[300px]">
                <div className="bg-white border border-gray-200 p-4 rounded-xl text-center">
                  <CalendarCheck className="w-5 h-5 text-green-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-900">{statusCounts.upcoming || 0}</div>
                  <div className="text-gray-500 text-xs">Upcoming</div>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl text-center">
                  <Clock className="w-5 h-5 text-yellow-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-900">{statusCounts.ongoing || 0}</div>
                  <div className="text-gray-500 text-xs">Ongoing</div>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl text-center">
                  <Archive className="w-5 h-5 text-gray-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-900">{statusCounts.completed || 0}</div>
                  <div className="text-gray-500 text-xs">Completed</div>
                </div>
              </div>
            </div>
          </div>

          {/* Ongoing Events Banner */}
          {eventsByStatus.ongoing.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                    Ongoing Events Today
                  </h3>
                  <p className="text-yellow-700 text-xs">
                    There {eventsByStatus.ongoing.length === 1 ? 'is' : 'are'} currently {eventsByStatus.ongoing.length} event{eventsByStatus.ongoing.length === 1 ? '' : 's'} happening today.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("ongoing")}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  View Ongoing
                </button>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Events</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by title, location, barangay, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>
              <button
                onClick={() => navigate("/events/create")}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 font-medium shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Create Event
              </button>
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="relative">
                  <select
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value)}
                    className="w-full pl-3 pr-10 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none"
                  >
                    {tabs.map(tab => (
                      <option key={tab.id} value={tab.id}>{tab.name} ({tab.count})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Barangay</label>
                <div className="relative">
                  <select
                    value={barangayFilter}
                    onChange={(e) => setBarangayFilter(e.target.value)}
                    className="w-full pl-3 pr-10 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none"
                  >
                    <option value="All">All Barangays</option>
                    {availableBarangays.map(barangay => (
                      <option key={barangay} value={barangay}>
                        {barangay} ({barangayCounts[barangay] || 0})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="date-upcoming">Upcoming First</option>
                  <option value="date-latest">Date Created (Newest)</option>
                  <option value="date-oldest">Date Created (Oldest)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 font-medium"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchTerm || barangayFilter !== "All") && (
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-700">Active filters:</span>
                {searchTerm && (
                  <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full flex items-center gap-2">
                    Search: "{searchTerm}"
                    <button onClick={() => setSearchTerm("")} className="text-blue-600 hover:text-blue-800">×</button>
                  </span>
                )}
                {barangayFilter !== "All" && (
                  <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full flex items-center gap-2">
                    Barangay: {barangayFilter}
                    <button onClick={() => setBarangayFilter("All")} className="text-green-600 hover:text-green-800">×</button>
                  </span>
                )}
                <button onClick={clearAllFilters} className="text-sm text-gray-600 hover:text-gray-800 font-medium ml-auto">Clear all</button>
              </div>
            )}
          </div>

          {/* Results Summary */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-gray-700">
              Showing {Math.min(filteredEventsForTab.length, rowsPerPage)} of {filteredEventsForTab.length} {activeTab} events
              {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
            </div>
            {filteredEventsForTab.length > 0 && (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div><span>Upcoming: {statusCounts.upcoming}</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-yellow-500 rounded-full"></div><span>Ongoing: {statusCounts.ongoing}</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-gray-500 rounded-full"></div><span>Completed: {statusCounts.completed}</span></div>
              </div>
            )}
          </div>

          {/* Events Table */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 font-semibold text-left text-gray-900 text-sm uppercase tracking-wider">Event Information</th>
                    <th className="px-6 py-4 font-semibold text-left text-gray-900 text-sm uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-4 font-semibold text-left text-gray-900 text-sm uppercase tracking-wider">Location & Barangay</th>
                    <th className="px-6 py-4 font-semibold text-left text-gray-900 text-sm uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 font-semibold text-left text-gray-900 text-sm uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentRows.length > 0 ? (
                    currentRows.map((event) => {
                      const statusInfo = getStatusInfo(event);
                      return (
                        <tr 
                          key={event.id} 
                          className={`hover:bg-gray-50 transition-colors cursor-pointer ${statusInfo.rowHighlight ? 'bg-yellow-50' : ''}`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-gray-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {event.title}
                                  {statusInfo.rowHighlight && (
                                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-yellow-500 text-white">
                                      LIVE
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">ID: {event.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <div className="font-medium text-gray-900">
                                {new Date(event.event_date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              {event.event_time && (
                                <div className="text-sm text-gray-500">
                                  {new Date(`1970-01-01T${event.event_time}`).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <div className="text-gray-700">{event.location || "—"}</div>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                {event.target_barangay || "—"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}>
                              {statusInfo.icon}
                              {statusInfo.text}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/attendances?event_id=${event.id}`);
                              }}
                              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                            >
                              <Users className="w-4 h-4" />
                              Attendance
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <Calendar className="w-16 h-16 mb-4 opacity-40" />
                          <p className="text-lg font-medium text-gray-500 mb-2">No {activeTab} events found</p>
                          <p className="text-sm max-w-md">
                            {(searchTerm || barangayFilter !== "All")
                              ? "Try adjusting your search or filter criteria"
                              : `No ${activeTab} events at the moment`
                            }
                          </p>
                          {(searchTerm || barangayFilter !== "All") && (
                            <button onClick={clearAllFilters} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">Clear All Filters</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredEventsForTab.length > rowsPerPage && (
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredEventsForTab.length)} of {filteredEventsForTab.length} results
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${currentPage === page ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                          {page}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}

export default Events;