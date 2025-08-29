import React, { useEffect, useState } from "react";
import api from "./api";
import Layout from "./Layout"; // ✅ unified layout

function Profile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    old_password: "",
    password: "",
    password_confirmation: "", // ✅ new field
    first_name: "",
    middle_name: "",
    last_name: "",
    contact_number: "",
    birthdate: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get("/user");
        const fetchedUser = response.data;
        setUser(fetchedUser);

        const p =
          fetchedUser.admin_profile ||
          fetchedUser.staff_profile ||
          fetchedUser.member_profile ||
          {};

        setFormData((prev) => ({
          ...prev,
          username: fetchedUser.username || "",
          email: fetchedUser.email || "",
          first_name: p.first_name || "",
          middle_name: p.middle_name || "",
          last_name: p.last_name || "",
          contact_number: p.contact_number || "",
          birthdate: p.birthdate || "",
          address: p.address || "",
        }));
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    // ✅ Password confirmation check
    if (formData.password && formData.password !== formData.password_confirmation) {
      setModalMessage("New password and confirmation do not match.");
      setShowModal(true);
      setSaving(false);
      return;
    }

    const payload = { ...formData };
    if (!payload.password) delete payload.password;
    if (!payload.old_password) delete payload.old_password;
    if (!payload.password_confirmation) delete payload.password_confirmation;

    try {
      await api.put(`/user/${user?.id}`, payload);

      // ✅ show success modal
      setModalMessage("Profile updated successfully!");
      setShowModal(true);

      // clear password fields after success
      setFormData((prev) => ({
        ...prev,
        old_password: "",
        password: "",
        password_confirmation: "",
      }));
    } catch (err) {
      console.error("Failed to update profile:", err);
      setModalMessage(err.response?.data?.message || "Failed to update profile.");
      setShowModal(true);
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  // ✅ Loading state themed
  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-sky-600">
          <div className="w-20 h-20 border-8 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-xl font-semibold animate-pulse">
            Loading Profile...
          </p>
          <p className="text-gray-600 text-sm">Please wait a moment 👤</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 bg-gray-100 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <section className="bg-white rounded-xl shadow p-6">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">
              Edit Profile
            </h1>

            <form onSubmit={handleUpdate} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-sky-300"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-sky-300"
                />
              </div>

              {/* Old Password */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  name="old_password"
                  value={formData.old_password}
                  placeholder="Enter current password to change password"
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-red-300"
                />
              </div>

              {/* New Password + Confirmation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    placeholder="Leave blank to keep current password"
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-sky-300"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="password_confirmation"
                    value={formData.password_confirmation}
                    placeholder="Re-enter new password"
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-sky-300"
                  />
                </div>
              </div>

              {/* First Name */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-sky-300"
                />
              </div>

              {/* Middle Name */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Middle Name
                </label>
                <input
                  type="text"
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-sky-300"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-sky-300"
                />
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Contact Number
                </label>
                <input
                  type="text"
                  maxLength="11"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-sky-300"
                />
              </div>

              {/* Birthdate */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Birthdate
                </label>
                <input
                  type="date"
                  name="birthdate"
                  value={formData.birthdate}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-sky-300"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-sky-300"
                />
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-sky-600 text-white px-6 py-2 rounded-lg shadow hover:bg-sky-700 transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Update Profile"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>

      {/* ✅ Success / Error Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm text-center">
            <h3 className="text-lg font-semibold mb-2">
              {modalMessage.includes("successfully") ? "Success" : "Error"}
            </h3>
            <p className="text-gray-600 mb-4">{modalMessage}</p>
            <button
              onClick={closeModal}
              className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Profile;
