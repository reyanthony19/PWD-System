import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import Layout from "./Layout";

function StaffList() {
  const [staffs, setStaffs] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("firstname-asc");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchStaffs = async () => {
      try {
        const res = await api.get("/users?role=staff");
        setStaffs(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchStaffs();
    const interval = setInterval(fetchStaffs, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredStaffs = staffs
    .filter((s) => {
      const term = searchTerm.toLowerCase();
      const profile = s.staff_profile || {};
      return (
        profile.first_name?.toLowerCase().includes(term) ||
        profile.last_name?.toLowerCase().includes(term) ||
        s.id.toString().includes(term)
      );
    })
    .sort((a, b) => {
      const profileA = a.staff_profile || {};
      const profileB = b.staff_profile || {};
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
      <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-extrabold text-gray-800">
              Staff List
            </h1>

          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-wrap gap-4 mb-4 items-center">
            <input
              type="text"
              placeholder="🔍 Search by name or ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-400 rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            />

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
            <button
              onClick={() => navigate("/register")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow transition duration-200"
            >
              + Add Staff
            </button>
          </div>

          {/* Staff Table */}
          <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
            <table className="min-w-full text-base text-left border-collapse">
              <thead className="bg-blue-700 text-white uppercase">
                <tr>
                  <th className="px-4 py-3">User ID</th>
                  <th className="px-4 py-3">First Name</th>
                  <th className="px-4 py-3">Last Name</th>
                  <th className="px-4 py-3">Middle Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Contact Number</th>
                  <th className="px-4 py-3">Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaffs.length > 0 ? (
                  filteredStaffs.map((staff) => {
                    const profile = staff.staff_profile || {};
                    return (
                      <tr
                        key={staff.id}
                        className="odd:bg-gray-100 even:bg-gray-50 hover:bg-yellow-100 cursor-pointer"
                        onClick={() => navigate(`/staff/${staff.id}`)}
                      >
                        <td className="px-4 py-3">{staff.id}</td>
                        <td className="px-4 py-3 font-semibold">
                          {profile.first_name}
                        </td>
                        <td className="px-4 py-3">{profile.last_name}</td>
                        <td className="px-4 py-3">{profile.middle_name}</td>
                        <td className="px-4 py-3">{staff.email}</td>
                        <td className="px-4 py-3">
                          {profile.contact_number}
                        </td>
                        <td className="px-4 py-3">{profile.address}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-4 py-3 text-center text-gray-500"
                    >
                      No staff found.
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

export default StaffList;
