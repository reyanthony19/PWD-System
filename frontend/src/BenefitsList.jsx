import React, { useEffect, useState, useMemo } from "react";
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
  Archive
} from "lucide-react";
import api from "./api";
import Layout from "./Layout";

function BenefitsList() {
  const [benefits, setBenefits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("name-asc");
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const navigate = useNavigate();

  // Fetch benefits
  useEffect(() => {
    const fetchBenefits = async () => {
      try {
        setLoading(true);
        const response = await api.get("/benefits-lists");
        setBenefits(response.data);
        setError("");
      } catch (err) {
        console.error(err);
        setError("Failed to load benefits.");
      } finally {
        setLoading(false);
      }
    };
    fetchBenefits();
    const interval = setInterval(fetchBenefits, 100000);
    return () => clearInterval(interval);
  }, []);

  // Filter + sort
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

  // Count benefits by type and status
  const typeCounts = benefits.reduce((acc, benefit) => {
    const type = benefit.type || "other";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const statusCounts = benefits.reduce((acc, benefit) => {
    const status = benefit.status || "active";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // Get type display info
  const getTypeInfo = (type) => {
    switch (type) {
      case "cash":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: <DollarSign className="w-4 h-4" />,
          gradient: "from-green-500 to-green-600"
        };
      case "relief":
        return {
          color: "bg-orange-100 text-orange-800 border-orange-200",
          icon: <Package className="w-4 h-4" />,
          gradient: "from-orange-500 to-orange-600"
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <Gift className="w-4 h-4" />,
          gradient: "from-gray-500 to-gray-600"
        };
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 border-8 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-xl font-semibold text-blue-600 animate-pulse">
              Loading Benefits...
            </p>
            <p className="text-gray-600 text-sm mt-2">Please wait a moment 🎁</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
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
              onClick={() => window.location.reload()}
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
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
              <div className="flex items-start gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl shadow-lg">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Benefits Management
                  </h1>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        Manage and distribute member benefits
                      </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                        <Gift className="w-4 h-4 text-blue-500" />
                        Total Benefits: {benefits.length}
                      </span>
                      <span className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Active: {statusCounts.active || 0}
                      </span>
                      <span className="flex items-center gap-2 bg-orange-50 px-3 py-1 rounded-full">
                        <DollarSign className="w-4 h-4 text-orange-500" />
                        Cash: {typeCounts.cash || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 min-w-[400px]">
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-5 rounded-2xl shadow-lg text-center">
                  <CheckCircle className="w-7 h-7 mx-auto mb-3 opacity-90" />
                  <div className="text-2xl font-bold">{statusCounts.active || 0}</div>
                  <div className="text-green-100 text-xs font-medium">Active</div>
                </div>
                <div className="bg-gradient-to-br from-gray-500 to-gray-600 text-white p-5 rounded-2xl shadow-lg text-center">
                  <Archive className="w-7 h-7 mx-auto mb-3 opacity-90" />
                  <div className="text-2xl font-bold">{statusCounts.inactive || 0}</div>
                  <div className="text-gray-100 text-xs font-medium">Inactive</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-5 rounded-2xl shadow-lg text-center">
                  <DollarSign className="w-7 h-7 mx-auto mb-3 opacity-90" />
                  <div className="text-2xl font-bold">{typeCounts.cash || 0}</div>
                  <div className="text-blue-100 text-xs font-medium">Cash</div>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-5 rounded-2xl shadow-lg text-center">
                  <Package className="w-7 h-7 mx-auto mb-3 opacity-90" />
                  <div className="text-2xl font-bold">{typeCounts.relief || 0}</div>
                  <div className="text-orange-100 text-xs font-medium">Relief</div>
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
                  Search Benefits
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search benefits by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl 
                             bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 
                             focus:border-blue-500 transition-all duration-200 placeholder-gray-400
                             shadow-sm hover:shadow-md focus:shadow-lg"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div className="w-full lg:w-64">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Filter by Type
                </label>
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full pl-12 pr-10 py-4 border border-gray-200 rounded-2xl 
                             bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 
                             focus:border-blue-500 transition-all duration-200 appearance-none
                             shadow-sm hover:shadow-md focus:shadow-lg"
                  >
                    {typeOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label} {option.key !== "all" && `(${typeCounts[option.key] || 0})`}
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
                  <option value="amount-asc">Per Member (Low-High)</option>
                  <option value="amount-desc">Per Member (High-Low)</option>
                  <option value="status">Status (Active First)</option>
                </select>
              </div>

              {/* Add Benefit Button */}
              <button
                onClick={() => navigate("/benefits/create")}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 
                         hover:from-green-600 hover:to-green-700 text-white rounded-2xl 
                         transition-all duration-200 font-semibold shadow-lg hover:shadow-xl 
                         transform hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" />
                Add Benefit
              </button>
            </div>

            {/* Status Filter Buttons */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Filter by Status
              </label>
              <div className="flex flex-wrap gap-3">
                {statusOptions.map(({ key, label, color, hoverColor, icon }) => (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(key)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-200 ${
                      statusFilter === key 
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
            {(searchTerm || typeFilter !== "all" || statusFilter !== "active") && (
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

                {typeFilter !== "all" && (
                  <span className="bg-purple-100 text-purple-800 text-sm px-4 py-2 rounded-full flex items-center gap-2 font-medium">
                    Type: {typeOptions.find(opt => opt.key === typeFilter)?.label}
                    <button 
                      onClick={() => setTypeFilter("all")} 
                      className="text-purple-600 hover:text-purple-800 font-bold text-lg leading-none"
                    >
                      ×
                    </button>
                  </span>
                )}

                {statusFilter !== "active" && (
                  <span className="bg-green-100 text-green-800 text-sm px-4 py-2 rounded-full flex items-center gap-2 font-medium">
                    Status: {statusOptions.find(opt => opt.key === statusFilter)?.label}
                    <button 
                      onClick={() => setStatusFilter("active")} 
                      className="text-green-600 hover:text-green-800 font-bold text-lg leading-none"
                    >
                      ×
                    </button>
                  </span>
                )}

                <button
                  onClick={() => {
                    setSearchTerm("");
                    setTypeFilter("all");
                    setStatusFilter("active");
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
                {filteredBenefits.length} of {benefits.length} benefits
              </span>
              {typeFilter !== "all" && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  Type: {typeOptions.find(opt => opt.key === typeFilter)?.label}
                </span>
              )}
              {statusFilter !== "active" && (
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  Status: {statusOptions.find(opt => opt.key === statusFilter)?.label}
                </span>
              )}
              {searchTerm && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Matching: "{searchTerm}"
                </span>
              )}
            </div>
            
            {filteredBenefits.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Active: {statusCounts.active || 0}</span>
                <div className="w-2 h-2 bg-gray-500 rounded-full ml-2"></div>
                <span>Inactive: {statusCounts.inactive || 0}</span>
                <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                <span>Cash: {typeCounts.cash || 0}</span>
              </div>
            )}
          </div>

          {/* Benefits Table */}
          <section className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <th className="px-8 py-5 font-semibold text-left text-sm uppercase tracking-wider">
                      Benefit Information
                    </th>
                    <th className="px-8 py-5 font-semibold text-left text-sm uppercase tracking-wider">
                      Type & Details
                    </th>
                    <th className="px-8 py-5 font-semibold text-left text-sm uppercase tracking-wider">
                      Budget Overview
                    </th>
                    <th className="px-8 py-5 font-semibold text-left text-sm uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBenefits.length > 0 ? (
                    filteredBenefits.map((benefit) => {
                      const totalBudget = (benefit.budget_amount || 0) * (benefit.locked_member_count || 0);
                      const typeInfo = getTypeInfo(benefit.type);

                      return (
                        <tr
                          key={benefit.id}
                          onClick={() => navigate(`/benefits/${benefit.id}/participants`)}
                          className={`hover:bg-gray-50/80 transition-all duration-150 group cursor-pointer ${
                            benefit.status === 'inactive' ? 'opacity-75' : ''
                          }`}
                        >
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Gift className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {benefit.name}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  ID: {benefit.id}
                                </div>
                                {benefit.status === 'inactive' && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Not available for distribution
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col gap-2">
                              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${typeInfo.color}`}>
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
                          <td className="px-8 py-5">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2 text-gray-700">
                                <TrendingUp className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium">
                                  {benefit.type === "cash"
                                    ? `₱${Number(totalBudget).toLocaleString()}`
                                    : `${(benefit.budget_quantity || 0) * (benefit.locked_member_count || 0)} ${benefit.unit || ""}`}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Users className="w-3 h-3 text-gray-400" />
                                <span>
                                  {benefit.locked_member_count || 0} members • {benefit.records_count || 0} claimed
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div onClick={(e) => e.stopPropagation()}>
                              <select
                                value={benefit.status || "active"}
                                onChange={(e) => handleStatusChange(benefit.id, e.target.value, e)}
                                disabled={updatingStatus === benefit.id}
                                className="border border-gray-300 rounded-xl px-4 py-2 bg-white/60 backdrop-blur-sm 
                                         focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium
                                         transition-all duration-200 hover:shadow-md"
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                              </select>
                              {updatingStatus === benefit.id && (
                                <div className="text-xs text-gray-500 mt-1">Updating...</div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-8 py-16 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <Gift className="w-20 h-20 mb-4 opacity-40" />
                          <p className="text-xl font-semibold text-gray-500 mb-2">No benefits found</p>
                          <p className="text-sm max-w-md">
                            {searchTerm || typeFilter !== "all" || statusFilter !== "active"
                              ? "Try adjusting your search or filter criteria"
                              : "No benefits have been created yet"
                            }
                          </p>
                          {(searchTerm || typeFilter !== "all" || statusFilter !== "active") && (
                            <button
                              onClick={() => {
                                setSearchTerm("");
                                setTypeFilter("all");
                                setStatusFilter("active");
                              }}
                              className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium underline"
                            >
                              Clear all filters
                            </button>
                          )}
                          {benefits.length === 0 && (
                            <button
                              onClick={() => navigate("/benefits/create")}
                              className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              Create First Benefit
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

        {/* Add custom animations */}
        <style jsx>{`
          @keyframes pulse-slow {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.5; }
          }
          .animate-pulse-slow { animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        `}</style>
      </div>
    </Layout>
  );
}

export default BenefitsList;