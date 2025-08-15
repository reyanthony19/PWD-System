import { useEffect, useState } from "react";
import api from "./api";
import Header from "./Header";

function MemberList() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("firstname-asc");

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await api.get("/users?role=member");
        setMembers(response.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch members.");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
    const interval = setInterval(fetchMembers, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
      );
      await api.put(`/users/${id}`, { status: newStatus });
    } catch (err) {
      console.error("Failed to update status", err);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        {error}
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Member List</h1>

          {/* Controls */}
          <div className="flex flex-wrap gap-4 mb-4">
            {/* Filter Menu */}
            <div className="flex gap-2">
              {["all", "approved", "inactive", "deceased", "rejected", "pending"].map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${statusFilter === status
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
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
              placeholder="Search by username or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded-lg px-3 py-2 w-64"
            />

            {/* Sort */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="firstname-asc">First Name (A–Z)</option>
              <option value="firstname-desc">First Name (Z–A)</option>
              <option value="date-newest">Date Registered (Newest)</option>
              <option value="date-oldest">Date Registered (Oldest)</option>
            </select>
          </div>

          <div className="overflow-x-auto bg-white rounded-xl shadow">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead className="bg-gray-200 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">First Name</th>
                  <th className="px-4 py-3">Last Name</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Contact Number</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">update</th>

                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => {
                    const profile = member.member_profile || {};
                    return (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{profile.first_name || "-"}</td>
                        <td className="px-4 py-3">{profile.last_name || "-"}</td>
                        <td className="px-4 py-3">{member.username}</td>
                        <td className="px-4 py-3">{member.email}</td>

                        <td className="px-4 py-3">
                          {profile.contact_number || "-"}
                        </td>
                        <td className="px-4 py-3">{profile.address || "-"}</td>
                        <td
                          className={`px-4 py-3 font-semibold ${member.status?.toLowerCase() === "approved"
                            ? "text-green-600"
                            : member.status?.toLowerCase() === "inactive"
                              ? "text-gray-600"
                              : member.status?.toLowerCase() === "deceased"
                                ? "text-black"
                                : member.status?.toLowerCase() === "rejected"
                                  ? "text-red-600"
                                  : "text-yellow-600"
                            }`}
                        >
                          {member.status}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={member.status}
                            onChange={(e) =>
                              handleStatusChange(member.id, e.target.value)
                            }
                            className="border rounded px-2 py-1"
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
                      colSpan="10"
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
