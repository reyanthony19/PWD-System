import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, UserPlus, Trash2,  CheckCircle, Clock, XCircle, UserX, Ban } from "lucide-react";
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchStaffs = async () => {
      try {
        const res = await api.get("/users?role=staff");
        console.log("Staff data:", res.data); // Debug log to see actual data
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

  const handleDelete = async () => {
    if (!selectedStaff) return;

    try {
      setDeleting(true);
      await api.delete(`/user/${selectedStaff.id}`);

      // Remove from local state
      setStaffs(prev => prev.filter(staff => staff.id !== selectedStaff.id));
      setShowDeleteModal(false);
      setSelectedStaff(null);

      alert("Staff member deleted successfully!");
    } catch (err) {
      console.error("Error deleting staff:", err);
      alert(err.response?.data?.message || "Failed to delete staff.");
    } finally {
      setDeleting(false);
    }
  };



  // Correct status configuration matching your database
  const getStatusConfig = (status) => {
    const statusConfig = {
      approved: {
        color: "bg-green-100 text-green-800",
        text: "Approved",
        icon: <CheckCircle size={14} />,
        countText: "Approved"
      },
      pending: {
        color: "bg-yellow-100 text-yellow-800",
        text: "Pending",
        icon: <Clock size={14} />,
        countText: "Pending"
      },
      rejected: {
        color: "bg-red-100 text-red-800",
        text: "Rejected",
        icon: <XCircle size={14} />,
        countText: "Rejected"
      },
      inactive: {
        color: "bg-orange-100 text-orange-800",
        text: "Inactive",
        icon: <Ban size={14} />,
        countText: "Inactive"
      },
      deceased: {
        color: "bg-gray-100 text-gray-800",
        text: "Deceased",
        icon: <UserX size={14} />,
        countText: "Deceased"
      }
    };

    return statusConfig[status] || statusConfig.pending;
  };

  const getStatusBadge = (status) => {
    const config = getStatusConfig(status);
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  // Count staff by status for statistics
  const getStatusCounts = () => {
    const counts = {
      approved: 0,
      pending: 0,
      rejected: 0,
      inactive: 0,
      deceased: 0
    };

    staffs.forEach(staff => {
      const status = staff.status || 'pending';
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    });

    return counts;
  };

  const filteredStaffs = staffs
    .filter((s) => {
      const term = searchTerm.toLowerCase();
      const profile = s.staff_profile || {};
      const fullName = `${profile.first_name || ""} ${profile.middle_name || ""} ${profile.last_name || ""}`.trim();
      const assignedBarangay = profile.assigned_barangay?.toLowerCase() || '';

      return (
        fullName.toLowerCase().includes(term) ||
        s.id.toString().includes(term) ||
        s.email?.toLowerCase().includes(term) ||
        assignedBarangay.includes(term) ||
        profile.contact_number?.includes(term)
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

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
          <div className="w-20 h-20 border-8 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-xl font-semibold text-sky-600 animate-pulse">
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
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-red-600 text-xl font-semibold mb-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sky-600 hover:underline"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header with Add Staff Button on Right */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className={`text-3xl font-bold ${theme.primaryText} mb-2`}>
              Staff Management
            </h1>
            <p className="text-gray-600">
              Manage and oversee all staff members in the system
            </p>
          </div>

          <button
            onClick={() => navigate("/register")}
            className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 font-semibold flex items-center gap-2"
          >
            <UserPlus size={20} />
            <span>Add Staff</span>
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-2xl font-bold text-sky-600">{staffs.length}</div>
            <div className="text-sm text-gray-600">Total Staff</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{statusCounts.approved}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {new Set(staffs.map(s => s.staff_profile?.assigned_barangay).filter(Boolean)).size}
            </div>
            <div className="text-sm text-gray-600">Barangays</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {staffs.filter(staff => staff.staff_profile?.contact_number).length}
            </div>
            <div className="text-sm text-gray-600">With Contact</div>
          </div>
        </div>

        {/* Search & Sort Controls */}
        <section className={`${theme.cardBg} rounded-xl shadow p-6 mb-6`}>
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Search Staff
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, ID, barangay, or contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
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
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </section>

        {/* Results Summary */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredStaffs.length} of {staffs.length} staff members
          {searchTerm && ` matching "${searchTerm}"`}
        </div>

        {/* Staff Table */}
        <section className={`${theme.cardBg} rounded-xl shadow p-6`}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-sky-600 text-white uppercase">
                <tr>
                  <th className="px-6 py-4 font-semibold">Staff ID</th>
                  <th className="px-6 py-4 font-semibold">Full Name</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Assigned Barangay</th>
                  <th className="px-6 py-4 font-semibold">Contact Number</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaffs.length > 0 ? (
                  filteredStaffs.map((staff) => {
                    const profile = staff.staff_profile || {};
                    const fullName = `${profile.first_name || ""} ${profile.middle_name || ""} ${profile.last_name || ""}`.trim();

                    return (
                      <tr
                        key={staff.id}
                        className="border-b border-gray-100 hover:bg-sky-50 transition-colors duration-150 group"
                      >
                        <td
                          className="px-6 py-4 cursor-pointer"
                          onClick={() => navigate(`/staff/${staff.id}`)}
                        >
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            #{staff.id}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 cursor-pointer"
                          onClick={() => navigate(`/staff/${staff.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 font-semibold text-sm">
                              {fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 group-hover:text-sky-700">
                                {fullName || "Unnamed Staff"}
                              </div>
                              {profile.position && (
                                <div className="text-xs text-gray-500">{profile.position}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td
                          className="px-6 py-4 cursor-pointer"
                          onClick={() => navigate(`/staff/${staff.id}`)}
                        >
                          {staff.email || "—"}
                        </td>
                        <td
                          className="px-6 py-4 cursor-pointer"
                          onClick={() => navigate(`/staff/${staff.id}`)}
                        >
                          {profile.assigned_barangay ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {profile.assigned_barangay}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td
                          className="px-6 py-4 cursor-pointer"
                          onClick={() => navigate(`/staff/${staff.id}`)}
                        >
                          {profile.contact_number || "—"}
                        </td>
                        <td
                          className="px-6 py-4 cursor-pointer"
                          onClick={() => navigate(`/staff/${staff.id}`)}
                        >
                          {getStatusBadge(staff.status)}
                        </td>

                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <UserPlus className="w-16 h-16 mb-4 text-gray-300" />
                        <p className="text-lg font-medium mb-2">No staff members found</p>
                        <p className="text-sm">
                          {searchTerm
                            ? "Try adjusting your search criteria"
                            : "No staff members have been registered yet"
                          }
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedStaff && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Delete Staff Member
              </h3>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete{" "}
                <span className="font-semibold">
                  {selectedStaff.staff_profile?.first_name} {selectedStaff.staff_profile?.last_name}
                </span>
                ? This action cannot be undone and all associated data will be permanently removed.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedStaff(null);
                  }}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default StaffList;