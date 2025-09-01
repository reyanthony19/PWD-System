import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import api from "./api";
import Layout from "./Layout";

// Theme
const theme = {
    primary: "from-yellow-600 to-orange-400",
    primaryText: "text-yellow-600",
    secondaryText: "text-yellow-400",
    cardBg: "bg-white",
    footerBg: "bg-yellow-700",
};

function BenefitsList() {
    const [benefits, setBenefits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOption, setSortOption] = useState("name-asc");
    const navigate = useNavigate();

    // Fetch benefits from /benefits route
    useEffect(() => {
        const fetchBenefits = async () => {
            try {
                setLoading(true);
                const response = await api.get("/benefits-lists"); // GET all benefits
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
    const filteredBenefits = benefits
        .filter((b) => (typeFilter === "all" ? true : b.type === typeFilter))
        .filter((b) => b.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            if (sortOption === "name-asc") return a.name.localeCompare(b.name);
            if (sortOption === "name-desc") return b.name.localeCompare(a.name);
            if (sortOption === "amount-asc") return (a.amount || 0) - (b.amount || 0);
            if (sortOption === "amount-desc") return (b.amount || 0) - (a.amount || 0);
            return 0;
        });

    const typeOptions = [
        { key: "all", label: "All" },
        { key: "cash", label: "Cash" },
        { key: "relief", label: "Relief Goods" },
        { key: "medical", label: "Medical Assistance" },
        { key: "other", label: "Other" },
    ];

    if (loading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-yellow-600">
                    <div className="w-20 h-20 border-8 border-yellow-200 border-t-yellow-600 rounded-full animate-spin"></div>
                    <p className="mt-4 text-xl font-semibold animate-pulse">Loading Benefits...</p>
                    <p className="text-gray-600 text-sm">Please wait a moment 🧑‍🦽</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-6 bg-gray-100 min-h-screen">
                {/* Title */}
                <h1 className={`text-3xl font-bold ${theme.primaryText} mb-2`}>
                    🎁 Benefits List
                </h1>
                <p className="text-gray-600 mb-6">
                    Manage all available benefits for verified members.
                </p>

                {/* Controls */}
                <div className={`${theme.cardBg} rounded-xl shadow p-4 mb-6 flex flex-col md:flex-row flex-wrap gap-4 items-center`}>
                    {/* Type Filter */}
                    <div className="flex gap-2 flex-wrap">
                        {typeOptions.map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setTypeFilter(key)}
                                className={`px-3 py-2 rounded-lg font-medium transition 
                                ${typeFilter === key ? `ring-2 ring-yellow-500 bg-yellow-100 text-yellow-700` : "bg-gray-100 text-gray-700"}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <input
                        type="text"
                        placeholder="🔍 Search by name"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-72 text-base focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />

                    {/* Sort */}
                    <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                        <option value="name-asc">Name (A–Z)</option>
                        <option value="name-desc">Name (Z–A)</option>
                        <option value="amount-asc">Amount (Low–High)</option>
                        <option value="amount-desc">Amount (High–Low)</option>
                    </select>

                    <button
                        onClick={() => navigate("/benefits/create")}
                        className="ml-auto bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-2 rounded-lg shadow font-semibold transition"
                    >
                        <Plus size={16} className="inline mr-2" /> Add Benefit
                    </button>
                </div>

                {/* Table */}
                <div className={`${theme.cardBg} overflow-x-auto rounded-xl shadow border border-gray-200`}>
                    <table className="min-w-full text-base text-left">
                        <thead className={`${theme.footerBg} text-white uppercase`}>
                            <tr>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Amount</th>
                                <th className="px-4 py-3">Unit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBenefits.length > 0 ? (
                                filteredBenefits.map((benefit) => (
                                    <tr
                                        key={benefit.id}
                                        className="odd:bg-gray-50 even:bg-gray-100 hover:bg-yellow-50 cursor-pointer transition hover:scale-[.99]"
                                        onClick={() => navigate(`/benefits/claim/${benefit.id}`)} // updated route for benefit records per benefit
                                    >
                                        <td className="px-4 py-3">{benefit.name}</td>
                                        <td className="px-4 py-3">{benefit.type}</td>
                                        <td className="px-4 py-3">{benefit.amount || "-"}</td>
                                        <td className="px-4 py-3">{benefit.unit || "-"}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-4 py-8 text-center text-gray-600 text-lg">
                                        🚫 No benefits found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
}

export default BenefitsList;
