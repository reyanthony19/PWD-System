import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Filter, 
  ChevronDown, 
  Plus,
  Gift,
  DollarSign,
  Package,
  CheckCircle,
  XCircle,
  Users,
  TrendingUp,
  Archive,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import api from "./api";
import Layout from "./Layout";

// Cache configuration
const CACHE_KEYS = {
  BENEFITS: 'benefitslist_benefits',
  TIMESTAMP: 'benefitslist_cache_timestamp'
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

function BenefitsList() {
  const [benefits, setBenefits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("name-asc");
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const navigate = useNavigate();

  // Load initial data from cache
  useEffect(() => {
    const cachedBenefits = cache.get(CACHE_KEYS.BENEFITS);
    if (cachedBenefits) {
      setBenefits(cachedBenefits);
      setLoading(false);
    }
  }, []);

  const fetchBenefits = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const cachedBenefits = !forceRefresh && cache.get(CACHE_KEYS.BENEFITS);
      if (cachedBenefits && !forceRefresh) {
        setBenefits(cachedBenefits);
        setLastUpdated(new Date());
        return;
      }

      const response = await api.get("/benefits-lists");
      setBenefits(response.data);
      cache.set(CACHE_KEYS.BENEFITS, response.data);
      setLastUpdated(new Date());
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load benefits.");
      
      const cachedBenefits = cache.get(CACHE_KEYS.BENEFITS);
      if (cachedBenefits) {
        setBenefits(cachedBenefits);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBenefits();
    const interval = setInterval(() => fetchBenefits(), 300000);
    return () => clearInterval(interval);
  }, [fetchBenefits]);

  const handleRefresh = () => {
    cache.clear(CACHE_KEYS.BENEFITS);
    fetchBenefits(true);
  };

  // Filter + sort - Memoized
  const filteredBenefits = useMemo(() => {
    return benefits
      .filter((b) => (typeFilter === "all" ? true : b.type === typeFilter))
      .filter((b) => (statusFilter === "all" ? true : b.status === statusFilter))
      .filter((b) => b.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        if (sortOption === "name-asc") return a.name.localeCompare(b.name);
        if (sortOption === "name-desc") return b.name.localeCompare(a.name);
        if (sortOption === "amount-asc") return (a.budget_amount || 0) - (b.budget_amount || 0);
        if (sortOption === "amount-desc") return (b.budget_amount || 0) - (a.budget_amount || 0);
        if (sortOption === "status") {
          if (a.status === "active" && b.status !== "active") return -1;
          if (a.status !== "active" && b.status === "active") return 1;
          return 0;
        }
        return 0;
      });
  }, [benefits, typeFilter, statusFilter, searchTerm, sortOption]);

  // Pagination
  const totalPages = Math.ceil(filteredBenefits.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredBenefits.slice(indexOfFirstRow, indexOfLastRow);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter]);

  // Memoized counts
  const typeCounts = useMemo(() => {
    return benefits.reduce((acc, benefit) => {
      const type = benefit.type || "other";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
  }, [benefits]);

  const statusCounts = useMemo(() => {
    return benefits.reduce((acc, benefit) => {
      const status = benefit.status || "active";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }, [benefits]);

  // Handle status change
  const handleStatusChange = async (benefitId, newStatus, e) => {
    e.stopPropagation();
    const oldBenefits = [...benefits];
    try {
      setUpdatingStatus(benefitId);
      
      setBenefits(prev => 
        prev.map(benefit => 
          benefit.id === benefitId 
            ? { ...benefit, status: newStatus }
            : benefit
        )
      );

      await api.delete(`/benefits/${benefitId}`);
      
      const updatedBenefits = benefits.map(benefit => 
        benefit.id === benefitId 
          ? { ...benefit, status: newStatus }
          : benefit
      );
      cache.set(CACHE_KEYS.BENEFITS, updatedBenefits);
      
    } catch (err) {
      console.error("Failed to update benefit status", err);
      setBenefits(oldBenefits);
      setError("Failed to update benefit status.");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const typeOptions = [
    { key: "all", label: "All Types" },
    { key: "cash", label: "Cash" },
    { key: "relief", label: "Relief Goods" },
  ];

  const statusOptions = [
    { 
      key: "active", 
      label: "Active", 
      color: "bg-green-500 text-white",
      hoverColor: "hover:bg-green-600",
      icon: <CheckCircle size={16} />
    },
    { 
      key: "inactive", 
      label: "Inactive", 
      color: "bg-gray-500 text-white",
      hoverColor: "hover:bg-gray-600",
      icon: <Archive size={16} />
    },
  ];

  // Get type display info
  const getTypeInfo = (type) => {
    switch (type) {
      case "cash":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: <DollarSign className="w-4 h-4" />
        };
      case "relief":
        return {
          color: "bg-orange-100 text-orange-800 border-orange-200",
          icon: <Package className="w-4 h-4" />
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <Gift className="w-4 h-4" />
        };
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setStatusFilter("active");
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-lg font-medium text-gray-600">Loading Benefits...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && benefits.length === 0) {
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
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">Benefits Management</h1>
                  <p className="text-gray-600 mt-2">Manage and distribute member benefits</p>
                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-600">
                    <span className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                      <Gift className="w-4 h-4 text-gray-500" />
                      Total Benefits: {benefits.length}
                    </span>
                    <span className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Active: {statusCounts.active || 0}
                    </span>
                    <span className="flex items-center gap-2 bg-orange-100 px-3 py-1 rounded-full">
                      <DollarSign className="w-4 h-4 text-orange-600" />
                      Cash: {typeCounts.cash || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 min-w-[300px]">
                <div className="bg-white border border-gray-200 p-4 rounded-xl text-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-900">{statusCounts.active || 0}</div>
                  <div className="text-gray-500 text-xs">Active</div>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl text-center">
                  <Archive className="w-5 h-5 text-gray-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-900">{statusCounts.inactive || 0}</div>
                  <div className="text-gray-500 text-xs">Inactive</div>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl text-center">
                  <DollarSign className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-900">{typeCounts.cash || 0}</div>
                  <div className="text-gray-500 text-xs">Cash</div>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl text-center">
                  <Package className="w-5 h-5 text-orange-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-900">{typeCounts.relief || 0}</div>
                  <div className="text-gray-500 text-xs">Relief</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Benefits</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search benefits by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>
              <button
                onClick={() => navigate("/benefits/create")}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 font-medium shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Benefit
              </button>
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <div className="relative">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full pl-3 pr-10 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none"
                  >
                    {typeOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label} {option.key !== "all" && `(${typeCounts[option.key] || 0})`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-3 pr-10 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none"
                  >
                    <option value="all">All Status</option>
                    {statusOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label} ({statusCounts[option.key] || 0})
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
                  <option value="amount-asc">Per Member (Low-High)</option>
                  <option value="amount-desc">Per Member (High-Low)</option>
                  <option value="status">Status (Active First)</option>
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
            {(searchTerm || typeFilter !== "all" || statusFilter !== "all") && (
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-700">Active filters:</span>
                {searchTerm && (
                  <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full flex items-center gap-2">
                    Search: "{searchTerm}"
                    <button onClick={() => setSearchTerm("")} className="text-blue-600 hover:text-blue-800">×</button>
                  </span>
                )}
                {typeFilter !== "all" && (
                  <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full flex items-center gap-2">
                    Type: {typeOptions.find(opt => opt.key === typeFilter)?.label}
                    <button onClick={() => setTypeFilter("all")} className="text-green-600 hover:text-green-800">×</button>
                  </span>
                )}
                {statusFilter !== "all" && (
                  <span className="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full flex items-center gap-2">
                    Status: {statusOptions.find(opt => opt.key === statusFilter)?.label}
                    <button onClick={() => setStatusFilter("all")} className="text-purple-600 hover:text-purple-800">×</button>
                  </span>
                )}
                <button onClick={clearAllFilters} className="text-sm text-gray-600 hover:text-gray-800 font-medium ml-auto">Clear all</button>
              </div>
            )}
          </div>

          {/* Results Summary */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-gray-700">
              Showing {Math.min(filteredBenefits.length, rowsPerPage)} of {filteredBenefits.length} benefits
              {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
            </div>
            {filteredBenefits.length > 0 && (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div><span>Active: {statusCounts.active}</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-gray-500 rounded-full"></div><span>Inactive: {statusCounts.inactive}</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full"></div><span>Cash: {typeCounts.cash}</span></div>
              </div>
            )}
          </div>

          {/* Benefits Table */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 font-semibold text-left text-gray-900 text-sm uppercase tracking-wider">Benefit Information</th>
                    <th className="px-6 py-4 font-semibold text-left text-gray-900 text-sm uppercase tracking-wider">Type & Details</th>
                    <th className="px-6 py-4 font-semibold text-left text-gray-900 text-sm uppercase tracking-wider">Budget Overview</th>
                    <th className="px-6 py-4 font-semibold text-left text-gray-900 text-sm uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentRows.length > 0 ? (
                    currentRows.map((benefit) => {
                      const totalBudget = (benefit.budget_amount || 0) * (benefit.locked_member_count || 0);
                      const typeInfo = getTypeInfo(benefit.type);

                      return (
                        <tr 
                          key={benefit.id} 
                          onClick={() => navigate(`/benefits/${benefit.id}/participants`)}
                          className={`hover:bg-gray-50 transition-colors cursor-pointer ${benefit.status === 'inactive' ? 'opacity-75' : ''}`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Gift className="w-4 h-4 text-gray-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{benefit.name}</div>
                                <div className="text-xs text-gray-500 mt-1">ID: {benefit.id}</div>
                                {benefit.status === 'inactive' && (
                                  <div className="text-xs text-gray-500 mt-1">Not available for distribution</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-2">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeInfo.color}`}>
                                {typeInfo.icon}
                                {benefit.type?.charAt(0).toUpperCase() + benefit.type?.slice(1) || 'Other'}
                              </span>
                              <div className="text-sm text-gray-700">
                                {benefit.type === "cash"
                                  ? `₱${Number(benefit.budget_amount).toLocaleString()} per member`
                                  : `${benefit.budget_quantity || 0} ${benefit.unit || ""} per member`}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <div className="font-medium text-gray-900">
                                {benefit.type === "cash"
                                  ? `₱${Number(totalBudget).toLocaleString()}`
                                  : `${(benefit.budget_quantity || 0) * (benefit.locked_member_count || 0)} ${benefit.unit || ""}`}
                              </div>
                              <div className="text-sm text-gray-500">
                                {benefit.locked_member_count || 0} members • {benefit.records_count || 0} claimed
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={benefit.status || "active"}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleStatusChange(benefit.id, e.target.value, e)}
                              disabled={updatingStatus === benefit.id}
                              className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                            {updatingStatus === benefit.id && (
                              <div className="text-xs text-gray-500 mt-1">Updating...</div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <Gift className="w-16 h-16 mb-4 opacity-40" />
                          <p className="text-lg font-medium text-gray-500 mb-2">No benefits found</p>
                          <p className="text-sm max-w-md">
                            {(searchTerm || typeFilter !== "all" || statusFilter !== "all")
                              ? "Try adjusting your search or filter criteria"
                              : "No benefits have been created yet"
                            }
                          </p>
                          {(searchTerm || typeFilter !== "all" || statusFilter !== "all") && (
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
            {filteredBenefits.length > rowsPerPage && (
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredBenefits.length)} of {filteredBenefits.length} results
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

export default BenefitsList;