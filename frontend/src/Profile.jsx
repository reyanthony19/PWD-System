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
    password_confirmation: "",
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

      setModalMessage("Profile updated successfully!");
      setShowModal(true);

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
          <section className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">
              Edit Profile
            </h1>

            <form onSubmit={handleUpdate} className="space-y-6">
              {/* Generic Floating Input */}
              {[
                { name: "username", type: "text", label: "Username" },
                { name: "email", type: "email", label: "Email" },
              ].map((f) => (
                <div key={f.name} className="relative">
                  <input
                    type={f.type}
                    name={f.name}
                    value={formData[f.name]}
                    onChange={handleChange}
                    required
                    placeholder=" "
                    className="peer w-full border border-gray-300 rounded-lg px-4 pt-5 pb-2
                               focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                  <label
                    htmlFor={f.name}
                    className="absolute left-4 top-2 text-gray-500 text-sm transition-all
                               peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
                               peer-focus:top-2 peer-focus:text-sm peer-focus:text-sky-600
                               peer-not-placeholder-shown:top-2 peer-not-placeholder-shown:text-sm peer-not-placeholder-shown:text-gray-700"
                  >
                    {f.label}
                  </label>
                </div>
              ))}

              {/* Current Password */}
              <div className="relative">
                <input
                  type="password"
                  name="old_password"
                  value={formData.old_password}
                  onChange={handleChange}
                  placeholder=" "
                  className="peer w-full border border-gray-300 rounded-lg px-4 pt-5 pb-2
                             focus:outline-none focus:ring-2 focus:ring-red-400"
                />
                <label
                  htmlFor="old_password"
                  className="absolute left-4 top-2 text-gray-500 text-sm transition-all
                             peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
                             peer-focus:top-2 peer-focus:text-sm peer-focus:text-red-500
                             peer-not-placeholder-shown:top-2 peer-not-placeholder-shown:text-sm peer-not-placeholder-shown:text-gray-700"
                >
                  Current Password
                </label>
              </div>

              {/* New + Confirm Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { name: "password", label: "New Password" },
                  { name: "password_confirmation", label: "Confirm Password" },
                ].map((f) => (
                  <div key={f.name} className="relative">
                    <input
                      type="password"
                      name={f.name}
                      value={formData[f.name]}
                      onChange={handleChange}
                      placeholder=" "
                      className="peer w-full border border-gray-300 rounded-lg px-4 pt-5 pb-2
                                 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                    <label
                      htmlFor={f.name}
                      className="absolute left-4 top-2 text-gray-500 text-sm transition-all
                                 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
                                 peer-focus:top-2 peer-focus:text-sm peer-focus:text-sky-600
                                 peer-not-placeholder-shown:top-2 peer-not-placeholder-shown:text-sm peer-not-placeholder-shown:text-gray-700"
                    >
                      {f.label}
                    </label>
                  </div>
                ))}
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {["first_name", "middle_name", "last_name"].map((field) => (
                  <div key={field} className="relative">
                    <input
                      type="text"
                      name={field}
                      value={formData[field]}
                      onChange={handleChange}
                      placeholder=" "
                      className="peer w-full border border-gray-300 rounded-lg px-4 pt-5 pb-2
                                 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                    <label
                      htmlFor={field}
                      className="absolute left-4 top-2 text-gray-500 text-sm capitalize transition-all
                                 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
                                 peer-focus:top-2 peer-focus:text-sm peer-focus:text-sky-600
                                 peer-not-placeholder-shown:top-2 peer-not-placeholder-shown:text-sm peer-not-placeholder-shown:text-gray-700"
                    >
                      {field.replace("_", " ")}
                    </label>
                  </div>
                ))}
              </div>

              {/* Contact Number */}
              <div className="relative">
                <input
                  type="text"
                  maxLength="11"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleChange}
                  placeholder=" "
                  className="peer w-full border border-gray-300 rounded-lg px-4 pt-5 pb-2
                             focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                <label
                  htmlFor="contact_number"
                  className="absolute left-4 top-2 text-gray-500 text-sm transition-all
                             peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
                             peer-focus:top-2 peer-focus:text-sm peer-focus:text-sky-600
                             peer-not-placeholder-shown:top-2 peer-not-placeholder-shown:text-sm peer-not-placeholder-shown:text-gray-700"
                >
                  Contact Number
                </label>
              </div>

              {/* Birthdate */}
              <div className="relative">
                <input
                  type="date"
                  name="birthdate"
                  value={formData.birthdate}
                  onChange={handleChange}
                  className="peer w-full border border-gray-300 rounded-lg px-4 pt-5 pb-2
                             focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                <label
                  htmlFor="birthdate"
                  className="absolute left-4 top-2 text-gray-500 text-sm transition-all
                             peer-focus:text-sky-600
                             peer-not-placeholder-shown:top-2 peer-not-placeholder-shown:text-sm peer-not-placeholder-shown:text-gray-700"
                >
                  Birthdate
                </label>
              </div>

              {/* Address */}
              <div className="relative">
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder=" "
                  className="peer w-full border border-gray-300 rounded-lg px-4 pt-5 pb-2
                             focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                <label
                  htmlFor="address"
                  className="absolute left-4 top-2 text-gray-500 text-sm transition-all
                             peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
                             peer-focus:top-2 peer-focus:text-sm peer-focus:text-sky-600
                             peer-not-placeholder-shown:top-2 peer-not-placeholder-shown:text-sm peer-not-placeholder-shown:text-gray-700"
                >
                  Address
                </label>
              </div>

              {/* Submit */}
              <div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-sky-600 text-white px-6 py-3 rounded-lg shadow-md
                             hover:bg-sky-700 transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Update Profile"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>

      {/* ✅ Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm text-center">
            <h3 className="text-lg font-semibold mb-2">
              {modalMessage.includes("successfully") ? "✅ Success" : "⚠️ Error"}
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
