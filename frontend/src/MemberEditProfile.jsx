import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "./api";
import Layout from "./Layout";
import { Save, X, Upload, Camera, User, Mail, Phone, MapPin, Calendar, Users, FileText } from "lucide-react";

const EditMemberProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    // Personal Information
    first_name: "",
    middle_name: "",
    last_name: "",
    birthdate: "",
    sex: "",
    contact_number: "",
    
    // Address
    address: "",
    barangay: "",
    
    // Disability Information
    disability_type: "",
    blood_type: "",
    
    // Government IDs
    sss_number: "",
    philhealth_number: "",
    
    // Guardian Information
    guardian_full_name: "",
    guardian_relationship: "",
    guardian_contact_number: "",
    guardian_address: "",
  });

  const [existingDocuments, setExistingDocuments] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});

  const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

  // Disability type options
  const disabilityTypeOptions = [
    { value: "physical", label: "Physical Disability" },
    { value: "mental_health", label: "Mental Health Disability" },
    { value: "sensory", label: "Sensory Disability" },
    { value: "neurological", label: "Neurological Disability" },
    { value: "developmental", label: "Developmental Disability" },
    { value: "chronic_health", label: "Chronic Health Condition" },
    { value: "other", label: "Other Disability" }
  ];

  const bloodTypeOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  // Success message function
  const showSuccessMessage = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 5000);
  };

  // Error message function
  const showErrorMessage = (message) => {
    setError(message);
    setTimeout(() => setError(""), 5000);
  };

  // Fetch member data
  useEffect(() => {
    const fetchMember = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/user/${id}`);
        const memberData = res.data;
        setMember(memberData);

        const profile = memberData.member_profile || {};
        const documents = profile.documents || {};

        // Set form data
        setFormData({
          first_name: profile.first_name || "",
          middle_name: profile.middle_name || "",
          last_name: profile.last_name || "",
          birthdate: profile.birthdate || "",
          sex: profile.sex || "",
          contact_number: profile.contact_number || "",
          address: profile.address || "",
          barangay: profile.barangay || "",
          disability_type: profile.disability_type || "",
          blood_type: profile.blood_type || "",
          sss_number: profile.sss_number || "",
          philhealth_number: profile.philhealth_number || "",
          guardian_full_name: profile.guardian_full_name || "",
          guardian_relationship: profile.guardian_relationship || "",
          guardian_contact_number: profile.guardian_contact_number || "",
          guardian_address: profile.guardian_address || "",
        });

        // Set existing documents for display
        setExistingDocuments(documents);

      } catch (err) {
        console.error("❌ Error fetching member:", err);
        showErrorMessage("Failed to load member profile.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchMember();
  }, [id]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle document upload
  const handleFileUpload = async (field, file) => {
    if (!file) return;

    try {
      setUploadProgress(prev => ({ ...prev, [field]: 0 }));

      const uploadFormData = new FormData();
      uploadFormData.append('document', file);
      uploadFormData.append('document_type', field);

      const response = await api.put(`/member/${id}/documents`, uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({ ...prev, [field]: progress }));
        }
      });

      // Update existing documents display
      setExistingDocuments(prev => ({
        ...prev,
        [field]: response.data.document_path || response.data.path
      }));

      showSuccessMessage(`${field.replace(/_/g, ' ').toUpperCase()} uploaded successfully!`);

    } catch (err) {
      console.error(`Error uploading ${field}:`, err);
      showErrorMessage(`Failed to upload ${field.replace(/_/g, ' ')}`);
    } finally {
      setUploadProgress(prev => ({ ...prev, [field]: null }));
    }
  };

  // NEW: Handle form submission using the dedicated member profile update endpoint
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);

      // Prepare data for the new API endpoint
      const updateData = {
        // Personal Information
        first_name: formData.first_name || '',
        middle_name: formData.middle_name || '',
        last_name: formData.last_name || '',
        birthdate: formData.birthdate || '',
        sex: formData.sex || '',
        contact_number: formData.contact_number || '',
        
        // Address
        address: formData.address || '',
        barangay: formData.barangay || '',
        
        // Medical Information
        disability_type: formData.disability_type || '',
        blood_type: formData.blood_type || '',
        
        // Government IDs
        sss_number: formData.sss_number || '',
        philhealth_number: formData.philhealth_number || '',
        
        // Guardian Information
        guardian_full_name: formData.guardian_full_name || '',
        guardian_relationship: formData.guardian_relationship || '',
        guardian_contact_number: formData.guardian_contact_number || '',
        guardian_address: formData.guardian_address || '',
      };

      // Remove empty strings but keep other falsy values that might be valid
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === '') {
          delete updateData[key];
        }
      });

      console.log("Sending update data to member profile endpoint:", updateData);

      // Use the new dedicated endpoint for member profile updates
      const response = await api.put(`/member/${id}/profile`, updateData);
      console.log("Update response:", response.data);

      showSuccessMessage("Member profile updated successfully!");
      
      // Redirect back to profile after short delay
      setTimeout(() => {
        navigate(`/members/${id}`);
      }, 2000);

    } catch (err) {
      console.error("Error updating member profile:", err);
      
      // Detailed error handling
      if (err.response?.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors).flat();
        showErrorMessage(`Validation errors: ${errorMessages.join(', ')}`);
      } else if (err.response?.data?.message) {
        showErrorMessage(err.response.data.message);
      } else {
        showErrorMessage("Failed to update member profile. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  // Calculate full name
  const fullName = useMemo(() => {
    if (!member) return "";
    if (member.role === "member" && member.member_profile) {
      const profile = member.member_profile;
      return [profile.first_name, profile.middle_name, profile.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() || member.username || "-";
    }
    return member.username || "-";
  }, [member]);

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
          <div className="w-16 h-16 border-8 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-xl font-semibold text-sky-600 animate-pulse">
            Loading Member Profile...
          </p>
        </div>
      </Layout>
    );
  }

  if (!member) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="text-gray-500 text-6xl mb-4">😕</div>
            <p className="text-gray-600 text-xl font-semibold mb-4">No member data found.</p>
            <Link to="/member" className="text-sky-600 hover:underline">
              ← Back to Members List
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Member Profile</h1>
                <p className="text-gray-600 mt-2">Update profile information for {fullName}</p>
              </div>
              <div className="flex gap-3">
                <Link
                  to={`/members/${id}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  <X size={16} className="mr-2" />
                  Cancel
                </Link>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="inline-flex items-center px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={16} className="mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-green-800 font-medium">{success}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-red-800 font-medium">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <User className="w-6 h-6 text-sky-600" />
                <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={formData.middle_name}
                    onChange={(e) => handleInputChange('middle_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Birthdate
                  </label>
                  <input
                    type="date"
                    value={formData.birthdate}
                    onChange={(e) => handleInputChange('birthdate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sex
                  </label>
                  <select
                    value={formData.sex}
                    onChange={(e) => handleInputChange('sex', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="">Select Sex</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_number}
                    onChange={(e) => handleInputChange('contact_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="w-6 h-6 text-sky-600" />
                <h2 className="text-xl font-bold text-gray-900">Address Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Complete Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Street, Subdivision, Village, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barangay
                  </label>
                  <input
                    type="text"
                    value={formData.barangay}
                    onChange={(e) => handleInputChange('barangay', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-6 h-6 text-sky-600" />
                <h2 className="text-xl font-bold text-gray-900">Medical Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Disability Type
                  </label>
                  <select
                    value={formData.disability_type}
                    onChange={(e) => handleInputChange('disability_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="">Select Disability Type</option>
                    {disabilityTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Type
                  </label>
                  <select
                    value={formData.blood_type}
                    onChange={(e) => handleInputChange('blood_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="">Select Blood Type</option>
                    {bloodTypeOptions.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Government IDs */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-6 h-6 text-sky-600" />
                <h2 className="text-xl font-bold text-gray-900">Government IDs</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SSS Number
                  </label>
                  <input
                    type="text"
                    value={formData.sss_number}
                    onChange={(e) => handleInputChange('sss_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PhilHealth Number
                  </label>
                  <input
                    type="text"
                    value={formData.philhealth_number}
                    onChange={(e) => handleInputChange('philhealth_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Guardian Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-sky-600" />
                <h2 className="text-xl font-bold text-gray-900">Guardian Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Guardian Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.guardian_full_name}
                    onChange={(e) => handleInputChange('guardian_full_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship
                  </label>
                  <input
                    type="text"
                    value={formData.guardian_relationship}
                    onChange={(e) => handleInputChange('guardian_relationship', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="e.g., Parent, Sibling, Relative"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Guardian Contact Number
                  </label>
                  <input
                    type="tel"
                    value={formData.guardian_contact_number}
                    onChange={(e) => handleInputChange('guardian_contact_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Guardian Address
                  </label>
                  <input
                    type="text"
                    value={formData.guardian_address}
                    onChange={(e) => handleInputChange('guardian_address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <Upload className="w-6 h-6 text-sky-600" />
                <h2 className="text-xl font-bold text-gray-900">Required Documents</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { key: 'barangay_indigency', label: 'Barangay Indigency', icon: '📄' },
                  { key: 'medical_certificate', label: 'Medical Certificate', icon: '🏥' },
                  { key: 'picture_2x2', label: '2x2 Picture', icon: '📷' },
                  { key: 'birth_certificate', label: 'Birth Certificate', icon: '🎂' },
                  { key: 'guardian_picture_2x2', label: 'Guardian 2x2 Picture', icon: '👤' },
                ].map((doc) => (
                  <div key={doc.key} className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{doc.icon}</span>
                        <span className="font-medium text-gray-700">{doc.label}</span>
                      </div>
                      {existingDocuments[doc.key] && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Uploaded
                        </span>
                      )}
                    </div>

                    {existingDocuments[doc.key] && (
                      <div className="mb-3">
                        <img
                          src={existingDocuments[doc.key].startsWith('http') 
                            ? existingDocuments[doc.key] 
                            : `${API_URL}/storage/${existingDocuments[doc.key]}`
                          }
                          alt={doc.label}
                          className="w-full h-32 object-cover rounded-lg mb-2"
                        />
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(doc.key, e.target.files[0])}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                    />

                    {uploadProgress[doc.key] !== null && uploadProgress[doc.key] !== undefined && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-sky-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress[doc.key]}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Uploading... {uploadProgress[doc.key]}%
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-end gap-3">
                <Link
                  to={`/members/${id}`}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save size={16} />
                  {saving ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default EditMemberProfile;