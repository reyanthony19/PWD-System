import { useEffect, useState } from "react";
import api from "./api";
import Header from "./Header";

function MemberList() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      setError("");
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
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="flex flex-col items-center">
          {/* Spinner */}
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          {/* Text */}
          <p className="mt-4 text-gray-600 text-lg animate-pulse">
            Loading Members...
          </p>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        {error}
      </div>
    );
  if (members.length === 0)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        No members found.
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Member List</h1>

        {loading && <p className="text-gray-600">Loading members...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && members.length === 0 && (
          <p className="text-gray-600">No members found.</p>
        )}

        {!loading && !error && members.length > 0 && (
          <div className="overflow-x-auto bg-white rounded-xl shadow">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead className="bg-gray-200 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">First Name</th>
                  <th className="px-4 py-3">Last Name</th>
                  <th className="px-4 py-3">Contact Number</th>
                  <th className="px-4 py-3">Birthdate</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {members.map((member) => {
                  const profile = member.member_profile || {};
                  return (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{member.id}</td>
                      <td className="px-4 py-3">{member.username}</td>
                      <td className="px-4 py-3">{member.email}</td>
                      <td className="px-4 py-3">{profile.first_name || "-"}</td>
                      <td className="px-4 py-3">{profile.last_name || "-"}</td>
                      <td className="px-4 py-3">{profile.contact_number || "-"}</td>
                      <td className="px-4 py-3">{profile.birthdate || "-"}</td>
                      <td className="px-4 py-3">{profile.address || "-"}</td>
                      <td
                        className={`px-4 py-3 font-semibold ${member.status?.toLowerCase() === "active"
                            ? "text-green-600"
                            : "text-red-600"
                          }`}
                      >
                        {member.status}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default MemberList;
