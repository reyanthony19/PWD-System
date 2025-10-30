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
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight
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
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

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
    const interval = setInterval(() => fetchStaffs(), 300000);
    return () => clearInterval(interval);
  }, [fetchStaffs]);

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

        const matchesSearch = term === '' || 
          fullName.toLowerCase().includes(term) ||
          s.id.toString().includes(term) ||
          s.email?.toLowerCase().includes(term) ||
          assignedBarangay.includes(term) ||
          profile.contact_number?.includes(term);

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

  // Pagination
  const totalPages = Math.ceil(filteredStaffs.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredStaffs.slice(indexOfFirstRow, indexOfLastRow);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, barangayFilter]);

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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-lg font-medium text-gray-600">Loading Staff List...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && staffs.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md text-center">
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
      <div className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="bg-blue-600 p-3 rounded-xl">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
                  <p className="text-gray-600 mt-2">Manage and oversee all staff members</p>
                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-600">
                    <span className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                      <Users className="w-4 h-4 text-gray-500" />
                      Total Staff: {staffs.length}
                    </span>
                    <span className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
                      <UserCheck className="w-4 h-4 text-green-600" />
                      Active: {statusCounts.approved}
                    </span>
                    <span className="flex items-center gap-2 bg-purple-100 px-3 py-1 rounded-full">
                      <MapPin className="w-4 h-4 text-purple-600" />
                      Barangays: {uniqueBarangaysCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 min-w-[300px]">
                <div className="bg-white border border-gray-200 p-4 rounded-xl text-center">
                  <Users className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-900">{staffs.length}</div>
                  <div className="text-gray-500 text-xs">Total Staff</div>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl text-center">
                  <UserCheck className="w-5 h-5 text-green-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-900">{statusCounts.approved}</div>
                  <div className="text-gray-500 text-xs">Active</div>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl text-center">
                  <MapPin className="w-5 h-5 text-purple-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-900">{uniqueBarangaysCount}</div>
                  <div className="text-gray-500 text-xs">Barangays</div>
                </div>
               
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Staff</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, ID, barangay, or contact..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>
              <button
                onClick={() => navigate("/register")}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 font-medium shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                Add Staff
              </button>
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Barangay</label>
                <div className="relative">
                  <select
                    value={barangayFilter}
                    onChange={(e) => setBarangayFilter(e.target.value)}
                    className="w-full pl-3 pr-10 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none"
                  >
                    <option value="All">All Barangays</option>
                    {uniqueBarangays.map(barangay => (
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
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="date-newest">Newest First</option>
                  <option value="date-oldest">Oldest First</option>
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
              Showing {Math.min(filteredStaffs.length, rowsPerPage)} of {filteredStaffs.length} staff members
              {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
            </div>
            {filteredStaffs.length > 0 && (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div><span>Active: {statusCounts.approved}</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-yellow-500 rounded-full"></div><span>Pending: {statusCounts.pending}</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full"></div><span>Rejected: {statusCounts.rejected}</span></div>
              </div>
            )}
          </div>

          {/* Staff Table */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 font-semibold text-left text-gray-900 text-sm uppercase tracking-wider">Staff Information</th>
                    <th className="px-6 py-4 font-semibold text-left text-gray-900 text-sm uppercase tracking-wider">Contact Details</th>
                    <th className="px-6 py-4 font-semibold text-left text-gray-900 text-sm uppercase tracking-wider">Assignment</th>
                    <th className="px-6 py-4 font-semibold text-left text-gray-900 text-sm uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentRows.length > 0 ? (
                    currentRows.map((staff) => {
                      const profile = staff.staff_profile || {};
                      const fullName = `${profile.first_name || ""} ${profile.middle_name || ""} ${profile.last_name || ""}`.trim();

                      return (
                        <tr 
                          key={staff.id} 
                          onClick={() => navigate(`/staff/${staff.id}`)}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Users className="w-4 h-4 text-gray-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{fullName || "Unnamed Staff"}</div>
                                <div className="text-xs text-gray-500 mt-1">ID: {staff.id}</div>
                                {profile.position && (
                                  <div className="text-xs text-purple-600 font-medium mt-1">
                                    {profile.position}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <div className="font-medium text-gray-900">{staff.email || "—"}</div>
                              <div className="text-sm text-gray-500">{profile.contact_number || "—"}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {profile.assigned_barangay || "—"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(staff.status)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <UserPlus className="w-16 h-16 mb-4 opacity-40" />
                          <p className="text-lg font-medium text-gray-500 mb-2">No staff members found</p>
                          <p className="text-sm max-w-md">
                            {(searchTerm || barangayFilter !== "All") 
                              ? "Try adjusting your search or filter criteria" 
                              : "No staff members have been registered yet"
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
            {filteredStaffs.length > rowsPerPage && (
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredStaffs.length)} of {filteredStaffs.length} results
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

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedStaff && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
              <div className="p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">
                  Delete Staff Member
                </h3>
                <p className="text-gray-600 mb-6">
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
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {deleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default StaffList;