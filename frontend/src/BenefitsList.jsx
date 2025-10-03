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

        {/* Search & Sort Controls */}
        <section className={`${theme.cardBg} rounded-2xl shadow p-6 mb-6`}>
          <div className="flex flex-wrap gap-4 items-center">
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {typeOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Search */}
            <input
              type="text"
              placeholder="🔍 Search benefits by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
            />

            {/* Sort */}
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
              className="ml-auto bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded-lg shadow transition duration-200"
            >
              + Add Benefit
            </button>
          </div>
        </section>

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

                    return (
                      <tr
                        key={benefit.id}
                        onClick={() => navigate(`/benefits/claim/${benefit.id}`)}
                        className="odd:bg-gray-100 even:bg-gray-50 hover:bg-sky-100 cursor-pointer transition"
                      >
                        <td className="px-4 py-3 font-medium text-gray-700">
                          {benefit.name}
                        </td>
                        <td className="px-4 py-3 text-gray-600 capitalize">
                          {benefit.type}
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
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      No benefits found.
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