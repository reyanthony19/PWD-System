import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import Layout from "./Layout";

const theme = {
  primary: "from-sky-600 to-sky-400",
  primaryText: "text-sky-600",
  secondaryText: "text-sky-400",
  cardBg: "bg-white",
  footerBg: "bg-sky-700",
  chartColors: ["#0ea5e9", "#38bdf8", "#7dd3fc", "#0284c7", "#0369a1"],
};

function StaffList() {
  const [staffs, setStaffs] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("name-asc");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchStaffs = async () => {
      try {
        const res = await api.get("/users?role=staff");
        setStaffs(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load staff list.");
      } finally {
        setLoading(false);
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
      const fullName = `${profile.first_name || ""} ${profile.middle_name || ""} ${profile.last_name || ""}`.trim();
      return (
        fullName.toLowerCase().includes(term) ||
        s.id.toString().includes(term) ||
        s.email?.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      const profileA = a.staff_profile || {};
      const profileB = b.staff_profile || {};
      const nameA = `${profileA.first_name || ""} ${profileA.middle_name || ""} ${profileA.last_name || ""}`.trim();
      const nameB = `${profileB.first_name || ""} ${profileB.middle_name || ""} ${profileB.last_name || ""}`.trim();

      if (sortOption === "name-asc") {
        return nameA.localeCompare(nameB);
      }
      if (sortOption === "name-desc") {
        return nameB.localeCompare(nameA);
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
      <Layout>
        <div
          className={`flex flex-col items-center justify-center min-h-screen bg-gray-100 ${theme.primaryText}`}
        >
          <div
            className="w-20 h-20 border-8 border-sky-200 border-t-sky-600 rounded-full animate-spin"
          ></div>
          <p className="mt-4 text-xl font-semibold animate-pulse">
            Loading Staff List...
          </p>
          <p className="text-gray-600 text-sm">Please wait a moment 🧑‍💼</p>
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
      <div className="p-6 bg-gray-100 min-h-screen">
        <h1 className={`text-3xl font-bold ${theme.primaryText} mb-6`}>
          Staff List
        </h1>

        {/* Search & Sort Controls */}
        <section className={`${theme.cardBg} rounded-xl shadow p-6 mb-6`}>
          <div className="flex flex-wrap gap-4 items-center">
            <input
              type="text"
              placeholder="🔍 Search by name, email or ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
            />

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="name-asc">Full Name (A–Z)</option>
              <option value="name-desc">Full Name (Z–A)</option>
              <option value="date-newest">Date Registered (Newest)</option>
              <option value="date-oldest">Date Registered (Oldest)</option>
            </select>

            <button
              onClick={() => navigate("/register")}
              className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded-lg shadow transition duration-200"
            >
              + Add Staff
            </button>
          </div>
        </section>

        {/* Staff Table */}
        <section className={`${theme.cardBg} rounded-xl shadow p-6`}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead className="bg-sky-700 text-white uppercase">
                <tr>
                  <th className="px-4 py-3">User ID</th>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Contact Number</th>
                  <th className="px-4 py-3">Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaffs.length > 0 ? (
                  filteredStaffs.map((staff) => {
                    const profile = staff.staff_profile || {};
                    const fullName = `${profile.first_name || ""} ${profile.middle_name || ""} ${profile.last_name || ""}`.replace(/\s+/g, " ").trim();
                    return (
                      <tr
                        key={staff.id}
                        className="odd:bg-gray-100 even:bg-gray-50 hover:bg-sky-100 cursor-pointer"
                        onClick={() => navigate(`/staff/${staff.id}`)}
                      >
                        <td className="px-4 py-3">{staff.id}</td>
                        <td className="px-4 py-3">{fullName}</td>
                        <td className="px-4 py-3">{staff.email}</td>
                        <td className="px-4 py-3">{profile.contact_number}</td>
                        <td className="px-4 py-3">{profile.address}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-4 py-3 text-center text-gray-500"
                    >
                      No staff found.
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

export default StaffList;
