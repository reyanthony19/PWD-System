import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  UserX,
  Search,
  MapPin,
  Users,
  UserCheck,
  Plus,
  Filter,
  ChevronDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import api from "./api";
import Layout from "./Layout";

// Cache configuration
const CACHE_KEYS = {
  MEMBERS: 'memberlist_members',
  TIMESTAMP: 'memberlist_cache_timestamp'
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
  
  // Clear all member list cache
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

function MemberList() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("approved");
  const [barangayFilter, setBarangayFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("name-asc");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const navigate = useNavigate();

  // Load initial data from cache
  useEffect(() => {
    const cachedMembers = cache.get(CACHE_KEYS.MEMBERS);
    if (cachedMembers) {
      setMembers(cachedMembers);
      setLoading(false);
    }
  }, []);

  const fetchMembers = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Check cache first unless force refresh
      const cachedMembers = !forceRefresh && cache.get(CACHE_KEYS.MEMBERS);
      if (cachedMembers && !forceRefresh) {
        setMembers(cachedMembers);
        setLastUpdated(new Date());
        return;
      }

      const response = await api.get("/users?role=member");
      const membersData = response.data.data || response.data;
      
      setMembers(membersData);
      cache.set(CACHE_KEYS.MEMBERS, membersData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      // If API fails, try to use cached data as fallback
      const cachedMembers = cache.get(CACHE_KEYS.MEMBERS);
      if (cachedMembers) {
        setMembers(cachedMembers);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
    // Increase interval since we have caching now
    const interval = setInterval(() => fetchMembers(), 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [fetchMembers]);

  const handleStatusChange = async (id, newStatus) => {
    const oldMembers = [...members];
    try {
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
      );
      await api.patch(`/user/${id}/status`, { status: newStatus });
      
      // Update cache after successful status change
      const updatedMembers = members.map((m) => 
        m.id === id ? { ...m, status: newStatus } : m
      );
      cache.set(CACHE_KEYS.MEMBERS, updatedMembers);
    } catch (err) {
      console.error("Failed to update status", err);
      setMembers(oldMembers);
    }
  };

  // Manual refresh function
  const handleRefresh = () => {
    cache.clear(CACHE_KEYS.MEMBERS);
    fetchMembers(true);
    setCurrentPage(1); // Reset to first page on refresh
  };

  // Memoized filtered members to prevent unnecessary recalculations
  const filteredMembers = useMemo(() => {
    return members
      .filter((m) =>
        statusFilter === "all"
          ? true
          : m.status?.toLowerCase() === statusFilter.toLowerCase()
      )
      .filter((m) => {
        // Barangay filter
        if (barangayFilter !== "All") {
          if (m.member_profile?.barangay !== barangayFilter) {
            return false;
          }
        }

        // Search filter
        const term = searchTerm.toLowerCase();
        const fullName = `${m.member_profile?.first_name || ''} ${m.member_profile?.middle_name || ''} ${m.member_profile?.last_name || ''}`.toLowerCase();
        const barangay = m.member_profile?.barangay?.toLowerCase() || '';

        return (
          m.username?.toLowerCase().includes(term) ||
          m.email?.toLowerCase().includes(term) ||
          fullName.includes(term) ||
          barangay.includes(term)
        );
      })
      .sort((a, b) => {
        const profileA = a.member_profile || {};
        const profileB = b.member_profile || {};

        if (sortOption === "name-asc") {
          const nameA = `${profileA.first_name || ""} ${profileA.last_name || ""}`.toLowerCase();
          const nameB = `${profileB.first_name || ""} ${profileB.last_name || ""}`.toLowerCase();
          return nameA.localeCompare(nameB);
        }
        if (sortOption === "name-desc") {
          const nameA = `${profileA.first_name || ""} ${profileA.last_name || ""}`.toLowerCase();
          const nameB = `${profileB.first_name || ""} ${profileB.last_name || ""}`.toLowerCase();
          return nameB.localeCompare(nameA);
        }
        if (sortOption === "date-newest") {
          return new Date(b.created_at) - new Date(a.created_at);
        }
        if (sortOption === "date-oldest") {
          return new Date(a.created_at) - new Date(b.created_at);
        }
        if (sortOption === "barangay-asc") {
          return (profileA.barangay || "").localeCompare(profileB.barangay || "");
        }
        return 0;
      });
  }, [members, statusFilter, barangayFilter, searchTerm, sortOption]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredMembers.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredMembers.slice(indexOfFirstRow, indexOfLastRow);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, barangayFilter, statusFilter, sortOption]);

  // Memoized status counts
  const statusCounts = useMemo(() => {
    return members.reduce((acc, member) => {
      const status = member.status || "pending";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }, [members]);

  // Memoized barangay counts
  const barangayCounts = useMemo(() => {
    return members.reduce((acc, member) => {
      const barangay = member.member_profile?.barangay || "Unspecified";
      acc[barangay] = (acc[barangay] || 0) + 1;
      return acc;
    }, {});
  }, [members]);

  // Memoized available barangays
  const availableBarangays = useMemo(() => {
    return [...new Set(
      members
        .map(member => member.member_profile?.barangay)
        .filter(Boolean)
    )].sort();
  }, [members]);

  // Status options
  const statusOptions = [
    {
      key: "approved",
      label: "Active",
      icon: <CheckCircle size={16} />,
      color: "bg-green-500 text-white",
      hoverColor: "hover:bg-green-600"
    },
    {
      key: "pending",
      label: "Pending Review",
      icon: <Clock size={16} />,
      color: "bg-yellow-500 text-white",
      hoverColor: "hover:bg-yellow-600"
    },
    {
      key: "rejected",
      label: "Rejected",
      icon: <XCircle size={16} />,
      color: "bg-red-500 text-white",
      hoverColor: "hover:bg-red-600"
    },
    {
      key: "inactive",
      label: "Inactive",
      icon: <Ban size={16} />,
      color: "bg-orange-500 text-white",
      hoverColor: "hover:bg-orange-600"
    },
    {
      key: "deceased",
      label: "Deceased",
      icon: <UserX size={16} />,
      color: "bg-gray-500 text-white",
      hoverColor: "hover:bg-gray-600"
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 border-8 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-xl font-semibold text-blue-600 animate-pulse">
              Loading Members...
            </p>
            <p className="text-gray-600 text-sm mt-2">Please wait a moment 👥</p>
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
              {cache.isValid(CACHE_KEYS.MEMBERS) ? (
                <span className="text-green-600 flex items-center gap-2">
                  <CheckCircle size={16} />
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
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Member Management
                  </h1>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        Manage and review all registered members
                      </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                        <Users className="w-4 h-4 text-blue-500" />
                        Total Members: {members.length}
                      </span>
                      <span className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
                        <UserCheck className="w-4 h-4 text-green-500" />
                        Active: {statusCounts.approved || 0}
                      </span>
                      <span className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full">
                        <Clock className="w-4 h-4 text-yellow-500" />
                        Pending: {statusCounts.pending || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 min-w-[400px]">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-5 rounded-2xl shadow-lg text-center">
                  <Users className="w-7 h-7 mx-auto mb-3 opacity-90" />
                  <div className="text-2xl font-bold">{members.length}</div>
                  <div className="text-blue-100 text-xs font-medium">Total Members</div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-5 rounded-2xl shadow-lg text-center">
                  <UserCheck className="w-7 h-7 mx-auto mb-3 opacity-90" />
                  <div className="text-2xl font-bold">{statusCounts.approved || 0}</div>
                  <div className="text-green-100 text-xs font-medium">Active</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-5 rounded-2xl shadow-lg text-center">
                  <Clock className="w-7 h-7 mx-auto mb-3 opacity-90" />
                  <div className="text-2xl font-bold">{statusCounts.pending || 0}</div>
                  <div className="text-yellow-100 text-xs font-medium">Pending</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-5 rounded-2xl shadow-lg text-center">
                  <MapPin className="w-7 h-7 mx-auto mb-3 opacity-90" />
                  <div className="text-2xl font-bold">{Object.keys(barangayCounts).length}</div>
                  <div className="text-purple-100 text-xs font-medium">Barangays</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-end gap-6">
              {/* Search */}
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Search Members
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, username, email, or barangay..."
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
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="date-newest">Newest First</option>
                  <option value="date-oldest">Oldest First</option>
                  <option value="barangay-asc">Barangay (A-Z)</option>
                </select>
              </div>

              {/* Add Member Button */}
              <button
                onClick={() => navigate("/member/register")}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 
                         hover:from-green-600 hover:to-green-700 text-white rounded-2xl 
                         transition-all duration-200 font-semibold shadow-lg hover:shadow-xl 
                         transform hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" />
                Add Member
              </button>
            </div>

            {/* Status Filter Buttons */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Filter by Status
              </label>
              <div className="flex flex-wrap gap-3">
                {statusOptions.map(({ key, label, icon, color, hoverColor }) => (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(key)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-200 ${statusFilter === key
                        ? "ring-4 ring-blue-200 ring-offset-2 transform scale-105 shadow-lg"
                        : `hover:scale-105 hover:shadow-lg ${hoverColor}`
                      } ${color}`}
                  >
                    {icon}
                    {label}
                    <span className="bg-white bg-opacity-30 px-2 py-1 rounded-full text-xs font-bold">
                      {statusCounts[key] || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchTerm || barangayFilter !== "All" || statusFilter !== "approved") && (
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

                {statusFilter !== "approved" && (
                  <span className="bg-green-100 text-green-800 text-sm px-4 py-2 rounded-full flex items-center gap-2 font-medium">
                    Status: {statusOptions.find(s => s.key === statusFilter)?.label}
                    <button
                      onClick={() => setStatusFilter("approved")}
                      className="text-green-600 hover:text-green-800 font-bold text-lg leading-none"
                    >
                      ×
                    </button>
                  </span>
                )}

                <button
                  onClick={() => {
                    setSearchTerm("");
                    setBarangayFilter("All");
                    setStatusFilter("approved");
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
                Showing {Math.min(filteredMembers.length, rowsPerPage)} of {filteredMembers.length} members (Page {currentPage} of {totalPages})
              </span>
              {barangayFilter !== "All" && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  From {barangayFilter}
                </span>
              )}
              {statusFilter !== "approved" && (
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  Status: {statusOptions.find(s => s.key === statusFilter)?.label}
                </span>
              )}
            </div>

            {filteredMembers.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Active: {statusCounts.approved || 0}</span>
                <div className="w-2 h-2 bg-yellow-500 rounded-full ml-2"></div>
                <span>Pending: {statusCounts.pending || 0}</span>
                <div className="w-2 h-2 bg-red-500 rounded-full ml-2"></div>
                <span>Rejected: {statusCounts.rejected || 0}</span>
              </div>
            )}
          </div>

          {/* Members Table */}
          <section className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <th className="px-8 py-5 font-semibold text-left text-sm uppercase tracking-wider">
                      Member Information
                    </th>
                    <th className="px-8 py-5 font-semibold text-left text-sm uppercase tracking-wider">
                      Username & Email
                    </th>
                    <th className="px-8 py-5 font-semibold text-left text-sm uppercase tracking-wider">
                      Barangay
                    </th>
                    <th className="px-8 py-5 font-semibold text-left text-sm uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-8 py-5 font-semibold text-left text-sm uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentRows.length > 0 ? (
                    currentRows.map((member) => {
                      const profile = member.member_profile || {};
                      const fullName = `${profile.first_name || ""} ${profile.middle_name || ""} ${profile.last_name || ""}`.trim();

                      return (
                        <tr
                          key={member.id}
                          onClick={() => navigate(`/members/${member.id}`)}
                          className="hover:bg-gray-50/80 transition-all duration-150 group cursor-pointer"
                        >
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Users className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {fullName || "Unnamed Member"}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  ID: {member.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <div className="font-medium text-gray-900">
                                @{member.username}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {member.email || "—"}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                              {profile.barangay || "—"}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-gray-700">
                            {profile.contact_number ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{profile.contact_number}</span>
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-8 py-5">
                            <select
                              value={member.status || "pending"}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleStatusChange(member.id, e.target.value)}
                              className="border border-gray-300 rounded-xl px-4 py-2 bg-white/60 backdrop-blur-sm 
                                       focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium
                                       transition-all duration-200 hover:shadow-md"
                            >
                              <option value="approved">Active</option>
                              <option value="pending">Pending Review</option>
                              <option value="inactive">Inactive</option>
                              <option value="rejected">Rejected</option>
                              <option value="deceased">Deceased</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-8 py-16 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <UserX className="w-20 h-20 mb-4 opacity-40" />
                          <p className="text-xl font-semibold text-gray-500 mb-2">No members found</p>
                          <p className="text-sm max-w-md">
                            {searchTerm || barangayFilter !== "All" || statusFilter !== "approved"
                              ? "Try adjusting your search or filter criteria"
                              : "No members have been registered yet"
                            }
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredMembers.length > rowsPerPage && (
              <div className="bg-white/60 border-t border-gray-200 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredMembers.length)} of {filteredMembers.length} results
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
        .animate-pulse-slow { animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}</style>
    </Layout>
  );
}

export default MemberList;