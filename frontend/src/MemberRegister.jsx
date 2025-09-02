// MemberRegister.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, Phone, Calendar, MapPin, Users, FileText, Upload, CheckCircle } from "lucide-react";
import api from "./api";
import Layout from "./Layout";

/* ---------------------------
   Validation & formatting helpers
   --------------------------- */
function validateSSS(sssNumber) {
  const digits = (sssNumber || "").replace(/\D/g, "");
  if (digits.length !== 10) return false;
  if (digits === "0000000000" || digits === "1234567890") return false;
  const firstTwo = parseInt(digits.slice(0, 2));
  if (firstTwo < 1 || firstTwo > 98) return false;
  return true;
}

function validatePhilHealth(philHealthNumber) {
  const digits = (philHealthNumber || "").replace(/\D/g, "");
  if (digits.length !== 12) return false;
  if (digits === "000000000000") return false;
  const firstTwo = parseInt(digits.slice(0, 2));
  if (firstTwo < 1 || firstTwo > 99) return false;
  return true;
}

function getFieldError(fieldName, value) {
  if (!value) return "";

  if (fieldName === "sss_number" && !validateSSS(value)) {
    return "Invalid SSS format (should be XX-XXXXXXX-X with 10 digits)";
  }

  if (fieldName === "philhealth_number" && !validatePhilHealth(value)) {
    return "Invalid PhilHealth format (should be XX-XXXXXXXXX-X with 12 digits)";
  }

  return "";
}

function formatSSS(value = "") {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 9)}-${digits.slice(9, 10)}`;
}

function formatPhilHealth(value = "") {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  if (digits.length <= 11) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 11)}-${digits.slice(11, 12)}`;
}

/* ---------------------------
   Floating components (top-level so they don't remount)
   --------------------------- */
function FloatingInput({ name, label, type = "text", required = false, maxLength, value, onChange, onBlur, icon: Icon, ...rest }) {
  const error = getFieldError(name, value);
  const hasError = error !== "";

  return (
    <div className="relative group">
      <div className="relative">
        {Icon && (
          <div
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 z-10
              ${hasError ? "text-red-400" : "text-gray-400 group-focus-within:text-blue-500"}`}
          >
            <Icon size={18} />
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          required={required}
          maxLength={maxLength}
          className={`w-full border-2 rounded-xl bg-white/80 backdrop-blur-sm text-gray-900 
              transition-all duration-200 peer placeholder-transparent
              ${Icon ? "pl-12 pr-4 py-4" : "px-4 py-4"}
              ${hasError
                ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                : "border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 hover:border-gray-300"
              }`}
          placeholder={label}
          {...rest}
        />
        <label
          className={`absolute transition-all duration-200 pointer-events-none
              ${Icon ? "left-12" : "left-4"}
              ${value || type === "date"
              ? "top-2 text-xs font-medium"
              : "top-1/2 transform -translate-y-1/2 text-base"
            }
              ${hasError
              ? "text-red-500"
              : "text-gray-500 peer-focus:text-blue-600 peer-focus:top-2 peer-focus:text-xs peer-focus:font-medium peer-focus:transform-none"
            }`}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>

      {hasError && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 flex items-center">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        </div>
      )}
    </div>
  );
}

function FloatingSelect({ name, label, options, value, onChange, required = false, icon: Icon }) {
  return (
    <div className="relative group">
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200 z-10">
            <Icon size={18} />
          </div>
        )}
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={`w-full border-2 border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm text-gray-900 
            transition-all duration-200 cursor-pointer hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 peer
            ${Icon ? "pl-12 pr-4 py-4" : "px-4 py-4"}`}
        >
          <option value=""></option>
          {options.map((option) => (
            <option key={option.value} value={option.value} className="text-gray-900">
              {option.label}
            </option>
          ))}
        </select>
        <label
          className={`absolute transition-all duration-200 pointer-events-none
            ${Icon ? "left-12" : "left-4"}
            ${value ? "top-2 text-xs font-medium text-blue-600" : "top-1/2 transform -translate-y-1/2 text-base text-gray-500"}
            peer-focus:top-2 peer-focus:text-xs peer-focus:font-medium peer-focus:text-blue-600 peer-focus:transform-none`}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>
    </div>
  );
}

/* ---------------------------
   Main component
   --------------------------- */
function MemberRegister() {
  const [form, setForm] = useState({
    username: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    role: "member",
    password: "",
    contact_number: "",
    birthdate: "1999-01-01",
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

  const barangayOptions = [
    "Awang", "Bagocboc", "Barra", "Bonbon", "Cauyonan", "Igpit",
    "Limonda", "Luyong Bonbon", "Malanang", "Nangcaon", "Patag",
    "Poblacion", "Taboc", "Tingalan"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDocChange = (e) => {
    const { name, type, files, value } = e.target;
    setDocuments((prev) => ({
      ...prev,
      [name]: type === "file" ? files[0] : value,
    }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (name === "sss_number") {
      setForm((prev) => ({ ...prev, [name]: formatSSS(value) }));
    } else if (name === "philhealth_number") {
      setForm((prev) => ({ ...prev, [name]: formatPhilHealth(value) }));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          formData.append(key, value);
        }
      });

      Object.entries(documents).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      await api.post("/member/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setForm({
        username: "",
        first_name: "",
        middle_name: "",
        last_name: "",
        email: "",
        role: "member",
        password: "",
        contact_number: "",
        birthdate: "1999-01-01",
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

  const sexOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" }
  ];

  const barangaySelectOptions = barangayOptions.map(barangay => ({
    value: barangay,
    label: barangay
  }));

  return (
    <>
      <Layout />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Member Registration</h1>
          </div>

          {error && (
            <div className="mb-6 mx-auto max-w-4xl">
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-red-700 font-medium">{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleRegister} className="max-w-4xl mx-auto space-y-8">
            {/* Personal Information Section */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
              <div className="flex items-center mb-6">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg mr-4">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FloatingInput
                  name="username"
                  label="Username"
                  required
                  value={form.username}
                  onChange={handleChange}
                  icon={User}
                />
                <FloatingInput
                  name="email"
                  label="Email Address"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  icon={Mail}
                />
                <FloatingInput
                  name="password"
                  label="Password"
                  type="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  icon={Lock}
                />
                <FloatingInput
                  name="contact_number"
                  label="Contact Number"
                  maxLength={11}
                  value={form.contact_number}
                  onChange={handleChange}
                  icon={Phone}
                />
                <FloatingInput
                  name="first_name"
                  label="First Name"
                  required
                  value={form.first_name}
                  onChange={handleChange}
                  icon={User}
                />
                <FloatingInput
                  name="middle_name"
                  label="Middle Name"
                  value={form.middle_name}
                  onChange={handleChange}
                />
                <FloatingInput
                  name="last_name"
                  label="Last Name"
                  required
                  value={form.last_name}
                  onChange={handleChange}
                />
                <FloatingInput
                  name="birthdate"
                  label="Date of Birth"
                  type="date"
                  value={form.birthdate}
                  onChange={handleChange}
                  icon={Calendar}
                />
              </div>
            </div>

            {/* Address & Location Section */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
              <div className="flex items-center mb-6">
                <div className="flex items-center justify-center w-10 h-10 bg-green-600 rounded-lg mr-4">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Address & Location</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <FloatingInput
                    name="address"
                    label="Complete Address"
                    value={form.address}
                    onChange={handleChange}
                    icon={MapPin}
                  />
                </div>
                <FloatingSelect
                  name="barangay"
                  label="Barangay"
                  options={barangaySelectOptions}
                  value={form.barangay}
                  onChange={handleChange}
                  icon={MapPin}
                />
                <FloatingSelect
                  name="sex"
                  label="Sex"
                  options={sexOptions}
                  value={form.sex}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Medical & Government IDs Section */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
              <div className="flex items-center mb-6">
                <div className="flex items-center justify-center w-10 h-10 bg-purple-600 rounded-lg mr-4">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Medical & Government Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FloatingInput
                  name="disability_type"
                  label="Disability Type"
                  value={form.disability_type}
                  onChange={handleChange}
                />
                <FloatingInput
                  name="blood_type"
                  label="Blood Type"
                  value={form.blood_type}
                  onChange={handleChange}
                />
                <FloatingInput
                  name="sss_number"
                  label="SSS Number"
                  value={form.sss_number}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <FloatingInput
                  name="philhealth_number"
                  label="PhilHealth Number"
                  value={form.philhealth_number}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </div>
            </div>

            {/* Guardian Information Section */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
              <div className="flex items-center mb-6">
                <div className="flex items-center justify-center w-10 h-10 bg-orange-600 rounded-lg mr-4">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Guardian Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FloatingInput
                  name="guardian_full_name"
                  label="Guardian Full Name"
                  value={form.guardian_full_name}
                  onChange={handleChange}
                />
                <FloatingInput
                  name="guardian_relationship"
                  label="Relationship"
                  value={form.guardian_relationship}
                  onChange={handleChange}
                />
                <FloatingInput
                  name="guardian_contact_number"
                  label="Guardian Contact"
                  maxLength={11}
                  value={form.guardian_contact_number}
                  onChange={handleChange}
                  icon={Phone}
                />
                <FloatingInput
                  name="guardian_address"
                  label="Guardian Address"
                  value={form.guardian_address}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Documents Section */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
              <div className="flex items-center mb-6">
                <div className="flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-lg mr-4">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Required Documents</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {[
                  { name: "barangay_indigency", label: "Barangay Indigency", accept: ".jpg,.jpeg,.png,.pdf" },
                  { name: "medical_certificate", label: "Medical Certificate", accept: ".jpg,.jpeg,.png,.pdf" },
                  { name: "picture_2x2", label: "2x2 Picture", accept: ".jpg,.jpeg,.png" },
                  { name: "birth_certificate", label: "Birth Certificate", accept: ".jpg,.jpeg,.png,.pdf" }
                ].map((doc) => (
                  <div key={doc.name} className="relative group">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 transition-colors duration-200 group-hover:bg-blue-50/50">
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:text-blue-500 transition-colors duration-200" />
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {doc.label}
                        </label>
                        <input
                          type="file"
                          name={doc.name}
                          onChange={handleDocChange}
                          accept={doc.accept}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative">
                <FloatingInput
                  name="remarks"
                  label="Additional Remarks"
                  value={documents.remarks}
                  onChange={handleDocChange}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 
                  hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 
                  text-white font-bold text-lg rounded-2xl shadow-xl 
                  transform transition-all duration-200 hover:scale-105 active:scale-95 
                  disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Registering Member...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-6 h-6 mr-3" />
                    Register Member
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
            <div className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">
                Registration Successful! 🎉
              </h3>
              <button
                onClick={closeModalAndRedirect}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 
                  text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MemberRegister;
