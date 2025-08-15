import React, { useEffect, useState } from "react";
import Header from "./Header";
import api from "./api";

function Profile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    old_password: "",
    password: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    contact_number: "",
    birthdate: "",
    address: ""
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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
          address: p.address || ""
        }));
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };

    fetchUser();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const payload = { ...formData };
    if (!payload.password) delete payload.password;
    if (!payload.old_password) delete payload.old_password;

    try {
      await api.put(`/user/${user?.id}`, payload);
      setMessage("Profile updated successfully!");
      setFormData((prev) => ({ ...prev, old_password: "", password: "" }));
    } catch (err) {
      console.error("Failed to update profile:", err);
      setMessage(
        err.response?.data?.message || "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">Edit Profile</h1>

          {message && (
            <div
              className={`mb-4 p-3 rounded ${
                message.includes("successfully")
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
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

            {/* New Password */}
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
              />
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
              />
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-600 transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Update Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
