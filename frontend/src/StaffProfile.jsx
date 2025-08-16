import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "./api";
import Layout from "./Layout";
import { Trash2 } from "lucide-react"; // ✅ delete icon

function StaffProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false); // ✅ modal state

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await api.get(`/user/${id}`);
        setStaff(res.data);
      } catch (err) {
        console.error("Error fetching staff:", err);
        setError(err.response?.data?.message || "Failed to load staff profile.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStaff();
    } else {
      setError("Invalid staff ID.");
      setLoading(false);
    }
  }, [id]);

  const handleDelete = async () => {
    try {
      await api.delete(`/user/${id}`);
      navigate("/staff"); // ✅ redirect back to staff list
    } catch (err) {
      console.error("Error deleting staff:", err);
      alert(err.response?.data?.message || "Failed to delete staff.");
    }
  };

  if (loading) {
    return (
      <Layout>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-6 text-red-600">{error}</div>
      </Layout>
    );
  }

  if (!staff) {
    return (
      <Layout>
        <div className="p-6">Staff not found.</div>
      </Layout>
    );
  }

  const profile = staff.staff_profile || {};

  const fields = [
    { label: "First Name", value: profile.first_name },
    { label: "Last Name", value: profile.last_name },
    { label: "Middle Name", value: profile.middle_name },
    { label: "Birthdate", value: profile.birthdate },
    { label: "Contact Number", value: profile.contact_number },
    { label: "Address", value: profile.address },
  ];

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-blue-600 p-6">
            <h1 className="text-3xl font-bold text-white">
              {profile.first_name || "-"} {profile.last_name || "-"}
            </h1>
            <p className="text-blue-100">Staff Profile</p>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map((field, index) => (
              <div key={index}>
                <p className="text-gray-500 text-sm">{field.label}</p>
                <p className="font-medium">{field.value || "-"}</p>
              </div>
            ))}
          </div>

          {/* ✅ Back & Delete inline */}
          <div className="p-6 border-t flex justify-between items-center">
            <Link
              to="/staff"
              className="text-blue-600 hover:underline font-medium"
            >
              ← Back to List
            </Link>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Trash2 size={18} /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm text-center">
            <h3 className="text-lg font-semibold mb-2">Confirm Deletion</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this staff?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <Trash2 size={18} /> Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default StaffProfile;
