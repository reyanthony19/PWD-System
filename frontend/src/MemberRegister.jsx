import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import Layout from "./Layout";

function MemberRegister() {
  const [form, setForm] = useState({
    username: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    role: "member", // always member
    password: "",
    contact_number: "",
    birthdate: "",
    address: "",
    sex: "",
    disability_type: "",
    barangay: "",
    blood_type: "",
    sss_number: "",
    philhealth_number: "",
    guardian_full_name: "",
    guardian_relationship: "",
    guardian_contact_number: "",
    guardian_address: "",
  });

  const [documents, setDocuments] = useState({
    barangay_indigency: null,
    medical_certificate: null,
    picture_2x2: null,
    birth_certificate: null,
    remarks: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDocChange = (e) => {
    const { name, type, files, value } = e.target;
    setDocuments({
      ...documents,
      [name]: type === "file" ? files[0] : value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();

      // append only filled fields
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          formData.append(key, value);
        }
      });

      // append docs
      Object.entries(documents).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      await api.post("/member/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // reset
      setForm({
        username: "",
        first_name: "",
        middle_name: "",
        last_name: "",
        email: "",
        role: "member",
        password: "",
        contact_number: "",
        birthdate: "",
        address: "",
        sex: "",
        disability_type: "",
        barangay: "",
        blood_type: "",
        sss_number: "",
        philhealth_number: "",
        guardian_full_name: "",
        guardian_relationship: "",
        guardian_contact_number: "",
        guardian_address: "",
      });
      setDocuments({
        barangay_indigency: null,
        medical_certificate: null,
        picture_2x2: null,
        birth_certificate: null,
        remarks: "",
      });

      setShowModal(true);
    } catch (err) {
      const errors = err.response?.data?.errors;
      const errorMessage = errors
        ? Object.values(errors).flat().join(", ")
        : err.response?.data?.message || "Registration failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const closeModalAndRedirect = () => {
    setShowModal(false);
    navigate("/member/register");
  };

  return (
    <>
      <Layout />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-5xl bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-6">
            Member Registration
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
              {error}
            </div>
          )}

          <form
            onSubmit={handleRegister}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Basic Info */}
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              required
              className="w-full border p-3 rounded"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full border p-3 rounded"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full border p-3 rounded"
            />
            <input
              type="text"
              name="contact_number"
              placeholder="Contact Number"
              value={form.contact_number}
              onChange={handleChange}
              maxLength={11}
              className="w-full border p-3 rounded"
            />
            <input
              type="text"
              name="first_name"
              placeholder="First Name"
              value={form.first_name}
              onChange={handleChange}
              required
              className="w-full border p-3 rounded"
            />
            <input
              type="text"
              name="middle_name"
              placeholder="Middle Name"
              value={form.middle_name}
              onChange={handleChange}
              className="w-full border p-3 rounded"
            />
            <input
              type="text"
              name="last_name"
              placeholder="Last Name"
              value={form.last_name}
              onChange={handleChange}
              required
              className="w-full border p-3 rounded"
            />
            <input
              type="date"
              name="birthdate"
              value={form.birthdate}
              onChange={handleChange}
              className="w-full border p-3 rounded"
            />
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={form.address}
              onChange={handleChange}
              className="w-full border p-3 rounded"
            />

            {/* Dropdown for sex */}
            <select
              name="sex"
              value={form.sex}
              onChange={handleChange}
              required
              className="w-full border p-3 rounded"
            >
              <option value="">Select Sex</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>

            <input
              type="text"
              name="barangay"
              placeholder="Barangay"
              value={form.barangay}
              onChange={handleChange}
              className="w-full border p-3 rounded"
            />
            <input
              type="text"
              name="disability_type"
              placeholder="Disability Type"
              value={form.disability_type}
              onChange={handleChange}
              className="w-full border p-3 rounded"
            />
            <input
              type="text"
              name="blood_type"
              placeholder="Blood Type"
              value={form.blood_type}
              onChange={handleChange}
              className="w-full border p-3 rounded"
            />
            <input
              type="text"
              name="sss_number"
              placeholder="SSS Number"
              value={form.sss_number}
              onChange={handleChange}
              className="w-full border p-3 rounded"
            />
            <input
              type="text"
              name="philhealth_number"
              placeholder="Philhealth Number"
              value={form.philhealth_number}
              onChange={handleChange}
              className="w-full border p-3 rounded"
            />

            {/* Guardian */}
            <input
              type="text"
              name="guardian_full_name"
              placeholder="Guardian Full Name"
              value={form.guardian_full_name}
              onChange={handleChange}
              className="w-full border p-3 rounded"
            />
            <input
              type="text"
              name="guardian_relationship"
              placeholder="Guardian Relationship"
              value={form.guardian_relationship}
              onChange={handleChange}
              className="w-full border p-3 rounded"
            />
            <input
              type="text"
              name="guardian_contact_number"
              placeholder="Guardian Contact Number"
              value={form.guardian_contact_number}
              onChange={handleChange}
              maxLength={11}
              className="w-full border p-3 rounded"
            />
            <input
              type="text"
              name="guardian_address"
              placeholder="Guardian Address"
              value={form.guardian_address}
              onChange={handleChange}
              className="w-full border p-3 rounded"
            />

            {/* Documents */}
            <div className="md:col-span-2 mt-6">
              <h2 className="text-xl font-semibold mb-2">Member Documents</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label>Barangay Indigency</label>
                  <input
                    type="file"
                    name="barangay_indigency"
                    onChange={handleDocChange}
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div>
                  <label>Medical Certificate</label>
                  <input
                    type="file"
                    name="medical_certificate"
                    onChange={handleDocChange}
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div>
                  <label>2x2 Picture</label>
                  <input
                    type="file"
                    name="picture_2x2"
                    onChange={handleDocChange}
                    accept=".jpg,.jpeg,.png"
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div>
                  <label>Birth Certificate</label>
                  <input
                    type="file"
                    name="birth_certificate"
                    onChange={handleDocChange}
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="w-full border p-2 rounded"
                  />
                </div>
              </div>

              <input
                type="text"
                name="remarks"
                placeholder="Remarks"
                value={documents.remarks}
                onChange={handleDocChange}
                className="w-full border p-3 rounded mt-2"
              />
            </div>

            {/* Submit */}
            <div className="md:col-span-2 mt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
              >
                {loading ? "Registering..." : "Register"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm text-center">
            <h3 className="text-lg font-semibold mb-2">
              Registration Successful
            </h3>
            <p className="text-gray-600 mb-4">
              Member account has been created.
            </p>
            <button
              onClick={closeModalAndRedirect}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default MemberRegister;
