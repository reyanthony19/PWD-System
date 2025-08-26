import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Clock, Ban, UserX } from "lucide-react";
import api from "./api";
import Layout from "./Layout";

// Sky Theme
const theme = {
  primary: "from-sky-600 to-sky-400",
  primaryText: "text-sky-600",
  secondaryText: "text-sky-400",
  cardBg: "bg-white",
  footerBg: "bg-sky-700",
  chartColors: ["#0ea5e9", "#38bdf8", "#7dd3fc", "#0284c7", "#0369a1"],
};

function MemberList() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("firstname-asc");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const response = await api.get("/users?role=member");
        setMembers(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
    const interval = setInterval(fetchMembers, 100000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    const oldMembers = [...members];
    try {
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
      );
      await api.patch(`/user/${id}/status`, { status: newStatus });
    } catch (err) {
      console.error("Failed to update status", err);
      setMembers(oldMembers);
    }
  };

  const filteredMembers = members
    .filter((m) =>
      statusFilter === "all"
        ? true
        : m.status?.toLowerCase() === statusFilter.toLowerCase()
    )
    .filter((m) => {
      const term = searchTerm.toLowerCase();
      return (
        m.username?.toLowerCase().includes(term) ||
        m.email?.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      const profileA = a.member_profile || {};
      const profileB = b.member_profile || {};
      if (sortOption === "firstname-asc") {
        return (profileA.first_name || "").localeCompare(profileB.first_name || "");
      }
      if (sortOption === "firstname-desc") {
        return (profileB.first_name || "").localeCompare(profileA.first_name || "");
      }
      if (sortOption === "date-newest") {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      if (sortOption === "date-oldest") {
        return new Date(a.created_at) - new Date(b.created_at);
      }
      return 0;
    });

  const statusOptions = [
    { key: "all", label: "All", icon: <></>, color: "bg-gray-100 text-gray-700" },
    { key: "approved", label: "Approved", icon: <CheckCircle size={18} />, color: "bg-green-100 text-green-700" },
    { key: "pending", label: "Pending", icon: <Clock size={18} />, color: "bg-yellow-100 text-yellow-700" },
    { key: "rejected", label: "Rejected", icon: <XCircle size={18} />, color: "bg-red-100 text-red-700" },
    { key: "inactive", label: "Inactive", icon: <Ban size={18} />, color: "bg-orange-100 text-orange-700" },
    { key: "deceased", label: "Deceased", icon: <UserX size={18} />, color: "bg-gray-200 text-gray-700" },
  ];

  return (
    <Layout>
      <div className="p-6 bg-gray-100 min-h-screen">
        <h1 className={`text-3xl font-bold ${theme.primaryText} mb-6`}>
          👥 Member List
        </h1>

        {/* Controls */}
        <div className={`${theme.cardBg} rounded-xl shadow p-4 mb-6 flex flex-wrap gap-4 items-center`}>
          {/* Status Filters */}
          <div className="flex gap-2 flex-wrap">
            {statusOptions.map(({ key, label, icon, color }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition 
                ${color} ${statusFilter === key ? `ring-2 ring-sky-500` : ""}`}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="🔍 Search by username or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 w-72 text-base focus:outline-none focus:ring-2 focus:ring-sky-500"
          />

          {/* Sort */}
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="firstname-asc">First Name (A–Z)</option>
            <option value="firstname-desc">First Name (Z–A)</option>
            <option value="date-newest">Date Registered (Newest)</option>
            <option value="date-oldest">Date Registered (Oldest)</option>
          </select>

          <button
            onClick={() => navigate("/member/register")}
            className="ml-auto bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded-lg shadow font-semibold transition"
          >
            ➕ Add Member
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-sky-600">
            <div className="w-16 h-16 border-8 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-xl font-semibold animate-pulse">Loading Members...</p>
            <p className="text-gray-600 text-sm">Please wait a moment 🧑‍🦽</p>
          </div>
        ) : (
          <div className={`${theme.cardBg} overflow-x-auto rounded-xl shadow`}>
            <table className="min-w-full text-base text-left">
              <thead className={`${theme.footerBg} text-white uppercase`}>
                <tr>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => {
                    const profile = member.member_profile || {};
                    const fullName = `${profile.first_name || ""} ${profile.middle_name ? profile.middle_name + " " : ""}${profile.last_name || ""}`.trim();
                    return (
                      <tr
                        key={member.id}
                        className="odd:bg-gray-50 even:bg-gray-100 hover:bg-sky-50 cursor-pointer"
                        onClick={() => navigate(`/members/${member.id}`)}
                      >
                        <td className="px-4 py-3 font-semibold">{fullName}</td>
                        <td className="px-4 py-3">{member.username}</td>
                        <td className="px-4 py-3">{member.email}</td>
                        <td className="px-4 py-3">{profile.contact_number}</td>
                        <td className="px-4 py-3">{profile.address}</td>
                        <td className="px-4 py-3">
                          <select
                            value={member.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleStatusChange(member.id, e.target.value)}
                            className="border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                          >
                            <option value="approved">✅ Approved</option>
                            <option value="inactive">⏸ Inactive</option>
                            <option value="deceased">⚰️ Deceased</option>
                            <option value="rejected">❌ Rejected</option>
                            <option value="pending">⏳ Pending</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="px-4 py-6 text-center text-gray-600 text-lg">
                      No members found for "{statusFilter}" status.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default MemberList;
