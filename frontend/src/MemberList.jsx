import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Clock, Ban, UserX, Search, Filter, MapPin } from "lucide-react";
import api from "./api";
import Layout from "./Layout";

// Barangay options
const barangayOptions = [
  "All", "Awang", "Bagocboc", "Barra", "Bonbon", "Cauyonan", "Igpit",
  "Limonda", "Luyong Bonbon", "Malanang", "Nangcaon", "Patag",
  "Poblacion", "Taboc", "Tingalan"
];

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
  const [barangayFilter, setBarangayFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("name-asc");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const response = await api.get("/users?role=member");
        setMembers(response.data.data || response.data);
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

  // Filter members based on status, barangay, and search
  const filteredMembers = members
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

  // Status options with correct terms
  const statusOptions = [
    { 
      key: "all", 
      label: "All Members", 
      icon: <Filter size={16} />, 
      color: "bg-gray-100 text-gray-700 hover:bg-gray-200" 
    },
    { 
      key: "approved", 
      label: "Active", 
      icon: <CheckCircle size={16} />, 
      color: "bg-green-100 text-green-700 hover:bg-green-200" 
    },
    { 
      key: "pending", 
      label: "Pending Review", 
      icon: <Clock size={16} />, 
      color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" 
    },
    { 
      key: "rejected", 
      label: "Rejected", 
      icon: <XCircle size={16} />, 
      color: "bg-red-100 text-red-700 hover:bg-red-200" 
    },
    { 
      key: "inactive", 
      label: "Inactive", 
      icon: <Ban size={16} />, 
      color: "bg-orange-100 text-orange-700 hover:bg-orange-200" 
    },
    { 
      key: "deceased", 
      label: "Deceased", 
      icon: <UserX size={16} />, 
      color: "bg-gray-200 text-gray-700 hover:bg-gray-300" 
    },
  ];

  // Count members per barangay
  const barangayCounts = members.reduce((acc, member) => {
    const barangay = member.member_profile?.barangay || "Unspecified";
    acc[barangay] = (acc[barangay] || 0) + 1;
    return acc;
  }, {});

  // Count members per status
  const statusCounts = members.reduce((acc, member) => {
    const status = member.status || "pending";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
          <div className="w-20 h-20 border-8 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-xl font-semibold text-sky-600 animate-pulse">
            Loading Members...
          </p>
          <p className="text-gray-600 text-sm">Please wait a moment 👥</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <h1 className={`text-3xl font-bold ${theme.primaryText} mb-2`}>
            Member Management
          </h1>
          <p className="text-gray-600">
            Manage and review all registered members in the system
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-2xl font-bold text-sky-600">{members.length}</div>
            <div className="text-sm text-gray-600">Total Members</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{statusCounts.approved || 0}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending || 0}</div>
            <div className="text-sm text-gray-600">Pending Review</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Object.keys(barangayCounts).length}
            </div>
            <div className="text-sm text-gray-600">Barangay</div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Search Members
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, username, email, or barangay..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            </div>

            {/* Barangay Filter */}
            <div className="w-full lg:w-64">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Filter by Barangay
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={barangayFilter}
                  onChange={(e) => setBarangayFilter(e.target.value)}
                  className="w-full pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 appearance-none"
                >
                  {barangayOptions.map((barangay) => (
                    <option key={barangay} value={barangay}>
                      {barangay} {barangay !== "All" && `(${barangayCounts[barangay] || 0})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sort Option */}
            <div className="w-full lg:w-64">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Sort By
              </label>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
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
              className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 font-semibold flex items-center gap-2"
            >
              <span>+</span>
              <span>Add Member</span>
            </button>
          </div>

          {/* Status Filter Buttons */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-600 mb-3">
              Filter by Status
            </label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(({ key, label, icon, color }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    statusFilter === key 
                      ? "ring-2 ring-sky-500 ring-offset-2 transform scale-105" 
                      : "hover:scale-105"
                  } ${color}`}
                >
                  {icon}
                  {label}
                  {key !== "all" && (
                    <span className="bg-white bg-opacity-50 px-1.5 py-0.5 rounded-full text-xs">
                      {statusCounts[key] || 0}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchTerm || barangayFilter !== "All" || statusFilter !== "all") && (
            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-600 font-medium">Active filters:</span>
              
              {searchTerm && (
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full flex items-center gap-2">
                  Search: "{searchTerm}"
                  <button onClick={() => setSearchTerm("")} className="text-blue-600 hover:text-blue-800 font-bold">
                    ×
                  </button>
                </span>
              )}
              
              {barangayFilter !== "All" && (
                <span className="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full flex items-center gap-2">
                  Barangay: {barangayFilter}
                  <button onClick={() => setBarangayFilter("All")} className="text-purple-600 hover:text-purple-800 font-bold">
                    ×
                  </button>
                </span>
              )}

              {statusFilter !== "all" && (
                <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full flex items-center gap-2">
                  Status: {statusOptions.find(s => s.key === statusFilter)?.label}
                  <button onClick={() => setStatusFilter("all")} className="text-green-600 hover:text-green-800 font-bold">
                    ×
                  </button>
                </span>
              )}

              <button
                onClick={() => {
                  setSearchTerm("");
                  setBarangayFilter("All");
                  setStatusFilter("all");
                }}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredMembers.length} of {members.length} members
          {barangayFilter !== "All" && ` from ${barangayFilter}`}
          {statusFilter !== "all" && ` with status: ${statusOptions.find(s => s.key === statusFilter)?.label}`}
          {searchTerm && ` matching "${searchTerm}"`}
        </div>

        {/* Members Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-sky-600 text-white uppercase">
                <tr>
                  <th className="px-6 py-4 font-semibold">Member Name</th>
                  <th className="px-6 py-4 font-semibold">Username</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Barangay</th>
                  <th className="px-6 py-4 font-semibold">Contact Number</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => {
                    const profile = member.member_profile || {};
                    const fullName = `${profile.first_name || ""} ${profile.middle_name || ""} ${profile.last_name || ""}`.trim();
                    
                    return (
                      <tr
                        key={member.id}
                        onClick={() => navigate(`/members/${member.id}`)}
                        className="border-b border-gray-100 hover:bg-sky-50 cursor-pointer transition-colors duration-150"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {fullName || "Unnamed Member"}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {member.username}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {member.email || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {profile.barangay || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {profile.contact_number || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={member.status || "pending"}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleStatusChange(member.id, e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
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
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <UserX className="w-16 h-16 mb-4 text-gray-300" />
                        <p className="text-lg font-medium mb-2">No members found</p>
                        <p className="text-sm">
                          {searchTerm || barangayFilter !== "All" || statusFilter !== "all"
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
        </div>
      </div>
    </Layout>
  );
}

export default MemberList;