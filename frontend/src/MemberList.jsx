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
      <div className="flex justify-center items-center min-h-screen text-lg">
        Loading members...
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
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Member List</h1>

        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Username</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">First Name</th>
                <th className="px-4 py-2">Last Name</th>
                <th className="px-4 py-2">Contact Number</th>
                <th className="px-4 py-2">Birthdate</th>
                <th className="px-4 py-2">Address</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const profile = member.member_profile || {};
                return (
                  <tr
                    key={member.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-2">{member.id}</td>
                    <td className="px-4 py-2">{member.username}</td>
                    <td className="px-4 py-2">{member.email}</td>
                    <td className="px-4 py-2">{profile.first_name || "-"}</td>
                    <td className="px-4 py-2">{profile.last_name || "-"}</td>
                    <td className="px-4 py-2">{profile.contact_number || "-"}</td>
                    <td className="px-4 py-2">{profile.birthdate || "-"}</td>
                    <td className="px-4 py-2">{profile.address || "-"}</td>
                    <td
                      className={`px-4 py-2 font-semibold ${
                        member.status?.toLowerCase() === "active"
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
      </div>
    </div>
  );
}

export default MemberList;
