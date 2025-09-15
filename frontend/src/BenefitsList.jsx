import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Filter, Search, SortAsc, Gift } from "lucide-react";
import api from "./api";
import Layout from "./Layout";

function BenefitsList() {
  const [benefits, setBenefits] = useState([]);
  const [loading, setLoading] = useState(true);
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
      } catch (err) {
        console.error(err);
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
    { key: "all", label: "All" },
    { key: "cash", label: "Cash" },
    { key: "relief", label: "Relief Goods" },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="w-20 h-20 border-8 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="mt-6 text-xl font-semibold text-indigo-700 animate-pulse">
            Loading Benefits...
          </p>
          <p className="text-gray-500 text-sm mt-2">Please wait a moment</p>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Layout />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Benefits List
            </h1>
            <p className="text-gray-600">
              Manage all available benefits for verified members.
            </p>
          </div>

          {/* Filters + Search + Sort */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center flex-wrap">
              {/* Type Filter */}
              <div className="flex gap-2 flex-wrap">
                {typeOptions.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setTypeFilter(key)}
                    className={`px-4 py-2 rounded-xl font-medium transition shadow-sm
                      ${typeFilter === key ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                  >
                    <Filter className="inline-block w-4 h-4 mr-1" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search benefits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
                />
              </div>

              {/* Sort */}
              <div className="relative">
                <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="pl-9 pr-4 py-2 border-2 border-gray-200 rounded-xl text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
                >
                  <option value="name-asc">Name (A–Z)</option>
                  <option value="name-desc">Name (Z–A)</option>
                  <option value="amount-asc">Per Member (Low–High)</option>
                  <option value="amount-desc">Per Member (High–Low)</option>
                </select>
              </div>

              {/* Add Button */}
              <button
                onClick={() => navigate("/benefits/create")}
                className="ml-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white px-5 py-2 rounded-xl shadow font-semibold transition flex items-center gap-2"
              >
                <Plus size={16} /> Add Benefit
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <table className="min-w-full text-base text-left">
              <thead className="bg-indigo-600 text-white uppercase text-sm">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Per Member</th>
                  <th className="px-6 py-4">Total Budget</th>
                  <th className="px-6 py-4">Remaining</th>
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
                        className="odd:bg-white even:bg-indigo-50 hover:bg-indigo-100 cursor-pointer transition"
                        onClick={() => navigate(`/benefits/claim/${benefit.id}`)}
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">{benefit.name}</td>
                        <td className="px-6 py-4 capitalize text-gray-700">{benefit.type}</td>
                        <td className="px-6 py-4 text-gray-700">
                          {benefit.type === "cash"
                            ? `₱${Number(benefit.budget_amount).toLocaleString()}`
                            : `${benefit.budget_quantity || 0} ${benefit.unit || ""}`}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {benefit.type === "cash"
                            ? `₱${Number(totalBudget).toLocaleString()}`
                            : `${(benefit.budget_quantity || 0) * (benefit.locked_member_count || 0)} ${benefit.unit || ""}`}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {benefit.type === "cash"
                            ? `₱${Number(remaining).toLocaleString()}`
                            : `${(benefit.budget_quantity || 0) * (benefit.locked_member_count || 0) - (benefit.records_count || 0)} ${benefit.unit || ""}`}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-600 text-lg">
                      🚫 No benefits found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default BenefitsList;
