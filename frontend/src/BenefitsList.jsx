import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import Layout from "./Layout";

const theme = {
  primary: "from-sky-600 to-sky-400",
  primaryText: "text-sky-600",
  secondaryText: "text-sky-400",
  cardBg: "bg-white",
  footerBg: "bg-sky-700",
};

function BenefitsList() {
  const [benefits, setBenefits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("name-asc");
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
      .filter((b) => b.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        if (sortOption === "name-asc") return a.name.localeCompare(b.name);
        if (sortOption === "name-desc") return b.name.localeCompare(a.name);
        if (sortOption === "amount-asc") return (a.budget_amount || 0) - (b.budget_amount || 0);
        if (sortOption === "amount-desc") return (b.budget_amount || 0) - (a.budget_amount || 0);
        return 0;
      });
  }, [benefits, typeFilter, searchTerm, sortOption]);

  const typeOptions = [
    { key: "all", label: "All Types" },
    { key: "cash", label: "Cash" },
    { key: "relief", label: "Relief Goods" },
  ];

  // Count benefits by type for the filter badge
  const typeCounts = benefits.reduce((acc, benefit) => {
    const type = benefit.type || "other";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Get type display info
  const getTypeInfo = (type) => {
    switch (type) {
      case "cash":
        return {
          color: "bg-green-100 text-green-800",
          icon: "💰"
        };
      case "relief":
        return {
          color: "bg-orange-100 text-orange-800",
          icon: "🛒"
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          icon: "🎁"
        };
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
          <div className="w-20 h-20 border-8 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-xl font-semibold text-sky-600 animate-pulse">
            Loading Benefits...
          </p>
          <p className="text-gray-600 text-sm">Please wait a moment 🎁</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen text-red-600 font-bold text-lg">
          {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <h1 className={`text-3xl font-bold ${theme.primaryText} mb-6`}>
          Manage Benefits
        </h1>

        {/* Type Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-green-600">{typeCounts.cash || 0}</div>
            <div className="text-sm text-green-800">Cash Benefits</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-orange-600">{typeCounts.relief || 0}</div>
            <div className="text-sm text-orange-800">Relief Goods</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-gray-600">{benefits.length}</div>
            <div className="text-sm text-gray-800">Total Benefits</div>
          </div>
        </div>

        {/* Search & Sort Controls */}
        <section className={`${theme.cardBg} rounded-2xl shadow p-6 mb-6`}>
          <div className="flex flex-wrap gap-4 items-center">
            {/* Type Filter */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none cursor-pointer"
              >
                {typeOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label} {option.key !== "all" && `(${typeCounts[option.key] || 0})`}
                  </option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="🔍 Search benefits by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
            />

            {/* Sort Option */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="amount-asc">Per Member (Low-High)</option>
              <option value="amount-desc">Per Member (High-Low)</option>
            </select>

            {/* Add Button */}
            <button
              onClick={() => navigate("/benefits/create")}
              className="ml-auto bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded-lg shadow transition duration-200 flex items-center gap-2"
            >
              <span>+</span>
              <span>Add Benefit</span>
            </button>
          </div>

          {/* Active Filters Display */}
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            {(searchTerm || typeFilter !== "all") && (
              <span className="text-xs text-gray-600 font-medium">Active filters:</span>
            )}

            {searchTerm && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                Search: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-blue-600 hover:text-blue-800 font-bold"
                >
                  ×
                </button>
              </span>
            )}

            {typeFilter !== "all" && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                Type: {typeOptions.find(opt => opt.key === typeFilter)?.label}
                <button
                  onClick={() => setTypeFilter("all")}
                  className="text-green-600 hover:text-green-800 font-bold"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </section>

        {/* Results Summary */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredBenefits.length} of {benefits.length} benefits
          {typeFilter !== "all" && ` of type "${typeOptions.find(opt => opt.key === typeFilter)?.label}"`}
          {searchTerm && ` matching "${searchTerm}"`}
        </div>

        {/* Benefits Table */}
        <section className={`${theme.cardBg} rounded-2xl shadow p-6`}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead className="bg-sky-600 text-white uppercase">
                <tr>
                  <th className="px-4 py-3">Benefit Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Per Member</th>
                  <th className="px-4 py-3">Total Budget</th>
                  <th className="px-4 py-3">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {filteredBenefits.length > 0 ? (
                  filteredBenefits.map((benefit) => {
                    const totalBudget =
                      (benefit.budget_amount || 0) * (benefit.locked_member_count || 0);

                    const remaining =
                      totalBudget - (benefit.records_count || 0) * (benefit.budget_amount || 0);

                    const typeInfo = getTypeInfo(benefit.type);

                    return (
                      <tr
                        key={benefit.id}
                        onClick={() => navigate(`/benefits/${benefit.id}/participants`)}
                        className="odd:bg-gray-100 even:bg-gray-50 hover:bg-sky-100 cursor-pointer transition"
                      >
                        <td className="px-4 py-3 font-medium text-gray-700">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{typeInfo.icon}</span>
                            {benefit.name}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                            {benefit.type?.charAt(0).toUpperCase() + benefit.type?.slice(1) || 'Other'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {benefit.type === "cash"
                            ? `₱${Number(benefit.budget_amount).toLocaleString()}`
                            : `${benefit.budget_quantity || 0} ${benefit.unit || ""}`}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {benefit.type === "cash"
                            ? `₱${Number(totalBudget).toLocaleString()}`
                            : `${(benefit.budget_quantity || 0) * (benefit.locked_member_count || 0)} ${benefit.unit || ""}`}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {benefit.type === "cash"
                            ? `₱${Number(remaining).toLocaleString()}`
                            : `${(benefit.budget_quantity || 0) * (benefit.locked_member_count || 0) - (benefit.records_count || 0)} ${benefit.unit || ""}`}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-4xl mb-2">🎁</div>
                        <p className="text-lg font-medium mb-1">No benefits found</p>
                        <p className="text-sm text-gray-600">
                          {searchTerm || typeFilter !== "all"
                            ? "Try adjusting your search or filter criteria"
                            : "No benefits have been created yet"
                          }
                        </p>
                        {(searchTerm || typeFilter !== "all") && (
                          <button
                            onClick={() => {
                              setSearchTerm("");
                              setTypeFilter("all");
                            }}
                            className="mt-3 text-sky-600 hover:text-sky-700 text-sm font-medium"
                          >
                            Clear all filters
                          </button>
                        )}
                        {benefits.length === 0 && (
                          <button
                            onClick={() => navigate("/benefits/create")}
                            className="mt-3 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200"
                          >
                            Create Your First Benefit
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
    </Layout>
  );
}

export default BenefitsList;