import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  UserPlus, 
  Trash2,  
  CheckCircle, 
  Clock, 
  XCircle, 
  UserX, 
  Ban,
  Users,
  UserCheck,
  MapPin,
  Phone,
  Mail,
  RefreshCw,
  Filter
} from "lucide-react";
import api from "./api";
import Layout from "./Layout";

// Cache configuration
const CACHE_KEYS = {
  STAFFS: 'stafflist_staffs',
  TIMESTAMP: 'stafflist_cache_timestamp'
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
  
  // Clear all staff cache
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

function StaffList() {
  const [staffs, setStaffs] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [barangayFilter, setBarangayFilter] = useState("All");
  const [sortOption, setSortOption] = useState("name-asc");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const navigate = useNavigate();

  // Load initial data from cache
  useEffect(() => {
    const cachedStaffs = cache.get(CACHE_KEYS.STAFFS);
    if (cachedStaffs) {
      setStaffs(cachedStaffs);
      setLoading(false);
    }
  }, []);

  const fetchStaffs = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Check cache first unless force refresh
      const cachedStaffs = !forceRefresh && cache.get(CACHE_KEYS.STAFFS);
      if (cachedStaffs && !forceRefresh) {
        setStaffs(cachedStaffs);
        setLastUpdated(new Date());
        return;
      }

      const res = await api.get("/users?role=staff");
      console.log("Staff data:", res.data);
      setStaffs(res.data);
      cache.set(CACHE_KEYS.STAFFS, res.data);
      setLastUpdated(new Date());
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load staff list.");
      
      // If API fails, try to use cached data as fallback
      const cachedStaffs = cache.get(CACHE_KEYS.STAFFS);
      if (cachedStaffs) {
        setStaffs(cachedStaffs);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStaffs();
    // Increase interval since we have caching now
    const interval = setInterval(() => fetchStaffs(), 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [fetchStaffs]);

  // Manual refresh function
  const handleRefresh = () => {
    cache.clear(CACHE_KEYS.STAFFS);
    fetchStaffs(true);
  };

  const handleDelete = async () => {
    if (!selectedStaff) return;

    try {
      setDeleting(true);
      await api.delete(`/user/${selectedStaff.id}`);

      const updatedStaffs = staffs.filter(staff => staff.id !== selectedStaff.id);
      setStaffs(updatedStaffs);
      
      // Update cache after successful deletion
      cache.set(CACHE_KEYS.STAFFS, updatedStaffs);
      
      setShowDeleteModal(false);
      setSelectedStaff(null);

      alert("Staff member deleted successfully!");
    } catch (err) {
      console.error("Error deleting staff:", err);
      alert(err.response?.data?.message || "Failed to delete staff.");
    } finally {
      setDeleting(false);
    }
  };

  // Status configuration
  const getStatusConfig = (status) => {
    const statusConfig = {  
      approved: {
        color: "bg-green-100 text-green-800 border-green-200",
        text: "Active",
        icon: <CheckCircle size={14} />,
        gradient: "from-green-500 to-green-600"
      },
      pending: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        text: "Pending",
        icon: <Clock size={14} />,
        gradient: "from-yellow-500 to-yellow-600"
      },
      rejected: {
        color: "bg-red-100 text-red-800 border-red-200",
        text: "Rejected",
        icon: <XCircle size={14} />,
        gradient: "from-red-500 to-red-600"
      },
      inactive: {
        color: "bg-orange-100 text-orange-800 border-orange-200",
        text: "Inactive",
        icon: <Ban size={14} />,
        gradient: "from-orange-500 to-orange-600"
      },
      deceased: {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        text: "Deceased",
        icon: <UserX size={14} />,
        gradient: "from-gray-500 to-gray-600"
      }
    };

    return statusConfig[status] || statusConfig.pending;
  };

  const getStatusBadge = (status) => {
    const config = getStatusConfig(status);
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  // Memoized unique barangays
  const uniqueBarangays = useMemo(() => {
    const barangays = new Set();
    staffs.forEach(staff => {
      const barangay = staff.staff_profile?.assigned_barangay;
      if (barangay) {
        barangays.add(barangay);
      }
    });
    return Array.from(barangays).sort();
  }, [staffs]);

  // Memoized barangay counts
  const barangayCounts = useMemo(() => {
    const counts = {};
    staffs.forEach(staff => {
      const barangay = staff.staff_profile?.assigned_barangay || "Unassigned";
      counts[barangay] = (counts[barangay] || 0) + 1;
    });
    return counts;
  }, [staffs]);

  // Memoized status counts
  const statusCounts = useMemo(() => {
    const counts = {
      approved: 0,
      pending: 0,
      rejected: 0,
      inactive: 0,
      deceased: 0
    };

    staffs.forEach(staff => {
      const status = staff.status || 'pending';
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    });

    return counts;
  }, [staffs]);

  // Memoized filtered staffs
  const filteredStaffs = useMemo(() => {
    return staffs
      .filter((s) => {
        const term = searchTerm.toLowerCase();
        const profile = s.staff_profile || {};
        const fullName = `${profile.first_name || ""} ${profile.middle_name || ""} ${profile.last_name || ""}`.trim();
        const assignedBarangay = profile.assigned_barangay?.toLowerCase() || '';

        // Apply search filter
        const matchesSearch = term === '' || 
          fullName.toLowerCase().includes(term) ||
          s.id.toString().includes(term) ||
          s.email?.toLowerCase().includes(term) ||
          assignedBarangay.includes(term) ||
          profile.contact_number?.includes(term);

        // Apply barangay filter
        const matchesBarangay = barangayFilter === "All" || 
          profile.assigned_barangay === barangayFilter;

        return matchesSearch && matchesBarangay;
      })
      .sort((a, b) => {
        const profileA = a.staff_profile || {};
        const profileB = b.staff_profile || {};
        const nameA = `${profileA.first_name || ""} ${profileA.middle_name || ""} ${profileA.last_name || ""}`.trim();
        const nameB = `${profileB.first_name || ""} ${profileB.middle_name || ""} ${profileB.last_name || ""}`.trim();

        if (sortOption === "name-asc") {
          return nameA.localeCompare(nameB);
        }
        if (sortOption === "name-desc") {
          return nameB.localeCompare(nameA);
        }
        if (sortOption === "date-newest") {
          return new Date(b.created_at) - new Date(a.created_at);
        }
        if (sortOption === "date-oldest") {
          return new Date(a.created_at) - new Date(b.created_at);
        }
        return 0;
      });
  }, [staffs, searchTerm, barangayFilter, sortOption]);

  // Memoized statistics
  const uniqueBarangaysCount = useMemo(() => {
    return new Set(staffs.map(s => s.staff_profile?.assigned_barangay).filter(Boolean)).size;
  }, [staffs]);

  const staffsWithContactCount = useMemo(() => {
    return staffs.filter(staff => staff.staff_profile?.contact_number).length;
  }, [staffs]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setBarangayFilter("All");
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 border-8 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-xl font-semibold text-blue-600 animate-pulse">
              Loading Staff List...
            </p>
            <p className="text-gray-600 text-sm mt-2">Please wait a moment 🧑‍💼</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && staffs.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
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
              {cache.isValid(CACHE_KEYS.STAFFS) ? (
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
                    Staff Management
                  </h1>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        Manage and oversee all staff members
                      </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                        <Users className="w-4 h-4 text-blue-500" />
                        Total Staff: {staffs.length}
                      </span>
                      <span className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
                        <UserCheck className="w-4 h-4 text-green-500" />
                        Active: {statusCounts.approved}
                      </span>
                      <span className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full">
                        <Clock className="w-4 h-4 text-yellow-500" />
                        Pending: {statusCounts.pending}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 min-w-[500px]">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-2xl shadow-lg text-center">
                  <Users className="w-6 h-6 mx-auto mb-2 opacity-90" />
                  <div className="text-xl font-bold">{staffs.length}</div>
                  <div className="text-blue-100 text-xs font-medium">Total Staff</div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-2xl shadow-lg text-center">
                  <UserCheck className="w-6 h-6 mx-auto mb-2 opacity-90" />
                  <div className="text-xl font-bold">{statusCounts.approved}</div>
                  <div className="text-green-100 text-xs font-medium">Active</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-4 rounded-2xl shadow-lg text-center">
                  <Clock className="w-6 h-6 mx-auto mb-2 opacity-90" />
                  <div className="text-xl font-bold">{statusCounts.pending}</div>
                  <div className="text-yellow-100 text-xs font-medium">Pending</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-2xl shadow-lg text-center">
                  <MapPin className="w-6 h-6 mx-auto mb-2 opacity-90" />
                  <div className="text-xl font-bold">{uniqueBarangaysCount}</div>
                  <div className="text-purple-100 text-xs font-medium">Barangays</div>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-2xl shadow-lg text-center">
                  <Phone className="w-6 h-6 mx-auto mb-2 opacity-90" />
                  <div className="text-xl font-bold">{staffsWithContactCount}</div>
                  <div className="text-orange-100 text-xs font-medium">With Contact</div>
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
                  Search Staff
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, ID, barangay, or contact..."
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
                    {uniqueBarangays.map(barangay => (
                      <option key={barangay} value={barangay}>
                        {barangay} ({barangayCounts[barangay] || 0})
                      </option>
                    ))}
                  </select>
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
                  <option value="status">Status</option>
                </select>
              </div>

              {/* Add Staff Button */}
              <button
                onClick={() => navigate("/register")}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 
                         hover:from-green-600 hover:to-green-700 text-white rounded-2xl 
                         transition-all duration-200 font-semibold shadow-lg hover:shadow-xl 
                         transform hover:-translate-y-0.5"
              >
                <UserPlus className="w-5 h-5" />
                Add Staff
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
                  onClick={clearAllFilters}
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
                {filteredStaffs.length} of {staffs.length} staff members
              </span>
              {searchTerm && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  Matching: "{searchTerm}"
                </span>
              )}
              {barangayFilter !== "All" && (
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  Barangay: {barangayFilter}
                </span>
              )}
            </div>
            
            {filteredStaffs.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Active: {statusCounts.approved}</span>
                <div className="w-2 h-2 bg-yellow-500 rounded-full ml-2"></div>
                <span>Pending: {statusCounts.pending}</span>
                <div className="w-2 h-2 bg-red-500 rounded-full ml-2"></div>
                <span>Rejected: {statusCounts.rejected}</span>
              </div>
            )}
          </div>

          {/* Staff Table */}
          <section className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <th className="px-8 py-5 font-semibold text-left text-sm uppercase tracking-wider">
                      Staff Information
                    </th>
                    <th className="px-8 py-5 font-semibold text-left text-sm uppercase tracking-wider">
                      Contact Details
                    </th>
                    <th className="px-8 py-5 font-semibold text-left text-sm uppercase tracking-wider">
                      Assignment
                    </th>
                    <th className="px-8 py-5 font-semibold text-left text-sm uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStaffs.length > 0 ? (
                    filteredStaffs.map((staff) => {
                      const profile = staff.staff_profile || {};
                      const fullName = `${profile.first_name || ""} ${profile.middle_name || ""} ${profile.last_name || ""}`.trim();

                      return (
                        <tr
                          key={staff.id}
                          onClick={() => navigate(`/staff/${staff.id}`)}
                          className="hover:bg-gray-50/80 transition-all duration-150 group cursor-pointer"
                        >
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Users className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {fullName || "Unnamed Staff"}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  ID: {staff.id}
                                </div>
                                {profile.position && (
                                  <div className="text-xs text-purple-600 font-medium mt-1">
                                    {profile.position}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col gap-2">
                              {staff.email && (
                                <div className="flex items-center gap-2 text-gray-700">
                                  <Mail className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm">{staff.email}</span>
                                </div>
                              )}
                              {profile.contact_number && (
                                <div className="flex items-center gap-2 text-gray-700">
                                  <Phone className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm font-medium">{profile.contact_number}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            {profile.assigned_barangay ? (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-purple-500" />
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                                  {profile.assigned_barangay}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">— Not assigned —</span>
                            )}
                          </td>
                          <td className="px-8 py-5">
                            {getStatusBadge(staff.status)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-8 py-16 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <UserPlus className="w-20 h-20 mb-4 opacity-40" />
                          <p className="text-xl font-semibold text-gray-500 mb-2">No staff members found</p>
                          <p className="text-sm max-w-md">
                            {searchTerm || barangayFilter !== "All"
                              ? "Try adjusting your search or filter criteria"
                              : "No staff members have been registered yet"
                            }
                          </p>
                          <button
                            onClick={() => navigate("/register")}
                            className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                          >
                            <UserPlus className="w-4 h-4" />
                            Add First Staff Member
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedStaff && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-white/20 w-full max-w-md text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center">
                  <Trash2 className="w-10 h-10 text-red-600" />
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Delete Staff Member
              </h3>

              <p className="text-gray-600 mb-8 text-lg">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-red-600">
                  {selectedStaff.staff_profile?.first_name} {selectedStaff.staff_profile?.last_name}
                </span>
                ? This action cannot be undone.
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedStaff(null);
                  }}
                  disabled={deleting}
                  className="flex-1 px-6 py-4 border border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all duration-200 font-semibold disabled:opacity-50 hover:shadow-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-semibold disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-lg"
                >
                  {deleting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default StaffList;