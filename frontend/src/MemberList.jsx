import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import Header from "./Header";

function MemberList() {
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("firstname-asc");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await api.get("/users?role=member");
        setMembers(response.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch members.");
      }
    };

    fetchMembers();
    const interval = setInterval(fetchMembers, 5000);
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
        return (profileA.first_name || "").localeCompare(
          profileB.first_name || ""
        );
      }
      if (sortOption === "firstname-desc") {
        return (profileB.first_name || "").localeCompare(
          profileA.first_name || ""
        );
      }
      if (sortOption === "date-newest") {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      if (sortOption === "date-oldest") {
        return new Date(a.created_at) - new Date(b.created_at);
      }
      return 0;
    });

  const getStatusButtonStyle = (status) => {
    const base =
      "px-4 py-2 rounded-lg font-semibold text-white shadow focus:outline-none focus:ring-4 focus:ring-offset-2 transition-all duration-200";
    switch (status) {
      case "approved":
        return `${base} bg-green-600 focus:ring-green-300`;
      case "inactive":
        return `${base} bg-yellow-600 focus:ring-yellow-300`;
      case "deceased":
        return `${base} bg-gray-700 focus:ring-gray-400`;
      case "rejected":
        return `${base} bg-red-600 focus:ring-red-300`;
      case "pending":
        return `${base} bg-blue-600 focus:ring-blue-300`;
      default:
        return `${base} bg-gray-400 focus:ring-gray-300`;
    }
  };

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-600 font-bold text-lg">
        {error}
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
        <div className="max-w-7xl mx-auto p-6">
          <h1 className="text-3xl font-extrabold text-gray-800 mb-6">
            Member List
          </h1>

          {/* Filter & Controls */}
          <div className="flex flex-wrap gap-4 mb-4 items-center">
            {/* Status Filters */}
            <div className="flex gap-2 flex-wrap">
              {["all", "approved", "inactive", "deceased", "rejected", "pending"].map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`${getStatusButtonStyle(status)} ${
                      statusFilter === status
                        ? "ring-4 ring-offset-2 ring-white"
                        : ""
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                )
              )}
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="🔍 Search by username or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-400 rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            />

            {/* Sort */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="border border-gray-400 rounded-lg px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="firstname-asc">First Name (A–Z)</option>
              <option value="firstname-desc">First Name (Z–A)</option>
              <option value="date-newest">Date Registered (Newest)</option>
              <option value="date-oldest">Date Registered (Oldest)</option>
            </select>
          </div>

          {/* Member Table */}
          <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
            <table className="min-w-full text-base text-left border-collapse">
              <thead className="bg-blue-700 text-white uppercase">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">First Name</th>
                  <th className="px-4 py-3">Last Name</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => {
                    const profile = member.member_profile || {};
                    return (
                      <tr
                        key={member.id}
                        className="odd:bg-gray-100 even:bg-gray-50 hover:bg-yellow-100 cursor-pointer"
                        onClick={() => navigate(`/members/${member.id}`)}
                      >
                        <td className="px-4 py-3">{member.id}</td>
                        <td className="px-4 py-3 font-semibold">
                          {profile.first_name || "-"}
                        </td>
                        <td className="px-4 py-3">{profile.last_name || "-"}</td>
                        <td className="px-4 py-3">{member.username}</td>
                        <td className="px-4 py-3">{member.email}</td>
                        <td className="px-4 py-3">{profile.contact_number || "-"}</td>
                        <td className="px-4 py-3">{profile.address || "-"}</td>
                        <td className="px-4 py-3">{member.status}</td>
                        <td className="px-4 py-3">
                          <select
                            value={member.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              handleStatusChange(member.id, e.target.value)
                            }
                            className="border rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="approved">Approved</option>
                            <option value="inactive">Inactive</option>
                            <option value="deceased">Deceased</option>
                            <option value="rejected">Rejected</option>
                            <option value="pending">Pending</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-4 py-3 text-center text-gray-500"
                    >
                      No members found for "{statusFilter}" status.
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

export default MemberList;
