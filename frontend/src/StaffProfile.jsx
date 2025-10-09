import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "./api";
import Layout from "./Layout";
import { UserCheck, Ban, Edit, Save, X, Key, Eye, EyeOff } from "lucide-react";

// ✅ Theme applied consistently
const theme = {
  primary: "from-sky-600 to-sky-400",
  primaryText: "text-sky-600",
  secondaryText: "text-sky-400",
  cardBg: "bg-white",
  footerBg: "bg-sky-700",
};

// Barangay options
const barangayOptions = [
  "All", "Awang", "Bagocboc", "Barra", "Bonbon", "Cauyonan", "Igpit",
  "Limonda", "Luyong Bonbon", "Malanang", "Nangcaon", "Patag",
  "Poblacion", "Taboc", "Tingalan"
];

function StaffProfile() {
  const { id } = useParams();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [editingBarangay, setEditingBarangay] = useState(false);
  const [assignedBarangay, setAssignedBarangay] = useState("");
  const [updatingBarangay, setUpdatingBarangay] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState({
    newPassword: false,
    confirmPassword: false
  });

  // Success message function
  const showSuccessMessage = (message) => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
    toast.innerHTML = `
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
        </svg>
        <span class="font-medium">${message}</span>
      </div>
    `;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }, 3000);
  };

  // Error message function
  const showErrorMessage = (message) => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
    toast.innerHTML = `
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
        </svg>
        <span class="font-medium">${message}</span>
      </div>
    `;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }, 3000);
  };

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await api.get(`/user/${id}`);
        setStaff(res.data);
        setAssignedBarangay(res.data.staff_profile?.assigned_barangay || "");
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

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      await api.patch(`/user/${id}/status`, { status: newStatus });
      
      // Update local state
      setStaff(prev => prev ? { ...prev, status: newStatus } : null);
      setShowStatusModal(false);
      
      // Show success message
      showSuccessMessage(
        `Staff member ${newStatus === 'approved' ? 'activated' : 'deactivated'} successfully!`
      );
      
    } catch (err) {
      console.error("Error updating staff status:", err);
      showErrorMessage(err.response?.data?.message || "Failed to update staff status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleBarangayUpdate = async () => {
    if (!assignedBarangay.trim()) {
      showErrorMessage("Please select a barangay.");
      return;
    }

    try {
      setUpdatingBarangay(true);
      
      // Prepare update data
      const updateData = {
        username: staff.username,
        email: staff.email,
        first_name: staff.staff_profile?.first_name || "",
        middle_name: staff.staff_profile?.middle_name || "",
        last_name: staff.staff_profile?.last_name || "",
        contact_number: staff.staff_profile?.contact_number || "",
        birthdate: staff.staff_profile?.birthdate || "",
        address: staff.staff_profile?.address || "",
        barangay: assignedBarangay, // This will update assigned_barangay in staff_profile
      };

      await api.put(`/user/${id}`, updateData);
      
      // Update local state
      setStaff(prev => prev ? {
        ...prev,
        staff_profile: {
          ...prev.staff_profile,
          assigned_barangay: assignedBarangay
        }
      } : null);
      
      setEditingBarangay(false);
      showSuccessMessage("Assigned barangay updated successfully!");
      
    } catch (err) {
      console.error("Error updating assigned barangay:", err);
      showErrorMessage(err.response?.data?.message || "Failed to update assigned barangay.");
    } finally {
      setUpdatingBarangay(false);
    }
  };

  const handlePasswordUpdate = async () => {
    // Validation
    if (!passwordData.newPassword) {
      showErrorMessage("Please enter a new password.");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setUpdatingPassword(true);
      
      // Call API to update password
      await api.put(`/user/${id}`, {
        username: staff.username,
        email: staff.email,
        password: passwordData.newPassword,
        password_confirmation: passwordData.confirmPassword
      });
      
      // Reset form and close modal
      setPasswordData({
        newPassword: "",
        confirmPassword: ""
      });
      setShowPasswordModal(false);
      
      showSuccessMessage("Password updated successfully!");
      
    } catch (err) {
      console.error("Error updating password:", err);
      showErrorMessage(err.response?.data?.message || "Failed to update password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const cancelBarangayEdit = () => {
    setAssignedBarangay(staff.staff_profile?.assigned_barangay || "");
    setEditingBarangay(false);
  };

  const cancelPasswordUpdate = () => {
    setPasswordData({
      newPassword: "",
      confirmPassword: ""
    });
    setShowPassword({
      newPassword: false,
      confirmPassword: false
    });
    setShowPasswordModal(false);
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getStatusConfig = (status) => {
    const statusConfig = {
      approved: { 
        color: "bg-green-100 text-green-800", 
        text: "Active", 
        icon: <UserCheck size={16} />,
        description: "Active and approved staff member",
        actionText: "Activate",
        buttonText: "Deactivate Staff",
        buttonColor: "bg-red-600 hover:bg-red-700",
        modalTitle: "Deactivate Staff",
        modalIcon: <Ban className="w-8 h-8 text-red-600" />,
        modalIconBg: "bg-red-100",
        modalDescription: "They will temporarily lose access to the system but can be reactivated later.",
        confirmButtonColor: "bg-red-600 hover:bg-red-700",
        confirmText: "Deactivate"
      },
      inactive: { 
        color: "bg-orange-100 text-orange-800", 
        text: "Inactive", 
        icon: <Ban size={16} />,
        description: "Temporarily inactive staff member",
        actionText: "Deactivate",
        buttonText: "Activate Staff",
        buttonColor: "bg-green-600 hover:bg-green-700",
        modalTitle: "Activate Staff",
        modalIcon: <UserCheck className="w-8 h-8 text-green-600" />,
        modalIconBg: "bg-green-100",
        modalDescription: "They will regain full access to the system.",
        confirmButtonColor: "bg-green-600 hover:bg-green-700",
        confirmText: "Activate"
      },
      pending: { 
        color: "bg-yellow-100 text-yellow-800", 
        text: "Pending", 
        icon: <Ban size={16} />,
        description: "Waiting for approval",
        actionText: "Activate",
        buttonText: "Activate Staff",
        buttonColor: "bg-green-600 hover:bg-green-700",
        modalTitle: "Activate Staff",
        modalIcon: <UserCheck className="w-8 h-8 text-green-600" />,
        modalIconBg: "bg-green-100",
        modalDescription: "They will be approved and gain full access to the system.",
        confirmButtonColor: "bg-green-600 hover:bg-green-700",
        confirmText: "Activate"
      },
      rejected: { 
        color: "bg-red-100 text-red-800", 
        text: "Rejected", 
        icon: <Ban size={16} />,
        description: "Application rejected",
        actionText: "Activate",
        buttonText: "Activate Staff",
        buttonColor: "bg-green-600 hover:bg-green-700",
        modalTitle: "Activate Staff",
        modalIcon: <UserCheck className="w-8 h-8 text-green-600" />,
        modalIconBg: "bg-green-100",
        modalDescription: "They will be approved and gain full access to the system.",
        confirmButtonColor: "bg-green-600 hover:bg-green-700",
        confirmText: "Activate"
      },
      deceased: { 
        color: "bg-gray-100 text-gray-800", 
        text: "Deceased", 
        icon: <Ban size={16} />,
        description: "Deceased staff member",
        actionText: "Activate",
        buttonText: "Activate Staff",
        buttonColor: "bg-green-600 hover:bg-green-700",
        modalTitle: "Activate Staff",
        modalIcon: <UserCheck className="w-8 h-8 text-green-600" />,
        modalIconBg: "bg-green-100",
        modalDescription: "They will be approved and gain full access to the system.",
        confirmButtonColor: "bg-green-600 hover:bg-green-700",
        confirmText: "Activate"
      }
    };

    return statusConfig[status] || statusConfig.pending;
  };

  const getStatusBadge = (status) => {
    const config = getStatusConfig(status);
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  const getTargetStatus = () => {
    if (!staff) return 'approved';
    
    // If current status is approved, target is inactive
    // If current status is anything else, target is approved
    return staff.status === 'approved' ? 'inactive' : 'approved';
  };

  const getActionButtonConfig = () => {
    if (!staff) return null;
    
    const targetStatus = getTargetStatus();
    
    return {
      buttonText: targetStatus === 'approved' ? 'Activate Staff' : 'Deactivate Staff',
      buttonColor: targetStatus === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700',
      modalTitle: targetStatus === 'approved' ? 'Activate Staff' : 'Deactivate Staff',
      modalIcon: targetStatus === 'approved' ? <UserCheck className="w-8 h-8 text-green-600" /> : <Ban className="w-8 h-8 text-red-600" />,
      modalIconBg: targetStatus === 'approved' ? 'bg-green-100' : 'bg-red-100',
      modalDescription: targetStatus === 'approved' 
        ? 'They will regain full access to the system.'
        : 'They will temporarily lose access to the system but can be reactivated later.',
      confirmButtonColor: targetStatus === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700',
      confirmText: targetStatus === 'approved' ? 'Activate' : 'Deactivate',
      targetStatus: targetStatus
    };
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20">
          <div
            className={`w-16 h-16 border-8 border-sky-200 border-t-sky-600 rounded-full animate-spin`}
          ></div>
          <p className={`mt-4 text-xl font-semibold animate-pulse ${theme.primaryText}`}>
            Loading Staff Profile...
          </p>
          <p className="text-gray-600 text-sm">Please wait a moment 🧑‍💼</p>
        </div>
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
  const actionConfig = getActionButtonConfig();

  // ✅ Format birthdate (avoid ugly ISO string)
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const fields = [
    { label: "First Name", value: profile.first_name },
    { label: "Last Name", value: profile.last_name },
    { label: "Middle Name", value: profile.middle_name },
    { label: "Birthdate", value: formatDate(profile.birthdate) },
    { label: "Contact Number", value: profile.contact_number },
    { label: "Address", value: profile.address },
  ];

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className={`${theme.cardBg} rounded-lg shadow-lg overflow-hidden`}>
          {/* ✅ Header */}
          <div className={`bg-gradient-to-r ${theme.primary} p-6`}>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {profile.first_name || "-"} {profile.last_name || "-"}
                </h1>
                <p className="text-sky-100">Staff Profile</p>
              </div>
              {getStatusBadge(staff.status)}
            </div>
          </div>

          {/* Status Description */}
          <div className={`p-4 ${
            staff.status === 'approved' ? 'bg-green-50 border-l-4 border-green-400' :
            staff.status === 'pending' ? 'bg-yellow-50 border-l-4 border-yellow-400' :
            staff.status === 'rejected' ? 'bg-red-50 border-l-4 border-red-400' :
            staff.status === 'inactive' ? 'bg-orange-50 border-l-4 border-orange-400' :
            'bg-gray-50 border-l-4 border-gray-400'
          }`}>
            <div className="flex items-center">
              {getStatusConfig(staff.status).icon}
              <p className={`ml-2 ${
                staff.status === 'approved' ? 'text-green-700' :
                staff.status === 'pending' ? 'text-yellow-700' :
                staff.status === 'rejected' ? 'text-red-700' :
                staff.status === 'inactive' ? 'text-orange-700' :
                'text-gray-700'
              }`}>
                {getStatusConfig(staff.status).description}
              </p>
            </div>
          </div>

          {/* ✅ Details */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map((field, index) => (
              <div key={index} className={`p-4 rounded-lg ${!field.value ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                <p className="text-gray-500 text-sm">{field.label}</p>
                <p className={`font-medium ${!field.value ? 'text-red-600' : 'text-gray-900'}`}>
                  {field.value || "Not provided"}
                </p>
                {!field.value && (
                  <p className="text-xs text-red-500 mt-1">
                    This field needs to be completed
                  </p>
                )}
              </div>
            ))}
            
            {/* Assigned Barangay Field with Edit Option */}
            <div className={`p-4 rounded-lg ${!profile.assigned_barangay ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-gray-500 text-sm">Assigned Barangay</p>
                  {editingBarangay ? (
                    <div className="mt-2">
                      <select
                        value={assignedBarangay}
                        onChange={(e) => setAssignedBarangay(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        disabled={updatingBarangay}
                      >
                        <option value="">Select a barangay</option>
                        {barangayOptions.map((barangay) => (
                          <option key={barangay} value={barangay}>
                            {barangay}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={handleBarangayUpdate}
                          disabled={updatingBarangay || !assignedBarangay}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {updatingBarangay ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save size={14} />
                              Save
                            </>
                          )}
                        </button>
                        <button
                          onClick={cancelBarangayEdit}
                          disabled={updatingBarangay}
                          className="px-3 py-1 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <X size={14} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <p className={`font-medium ${!profile.assigned_barangay ? 'text-red-600' : 'text-gray-900'}`}>
                        {profile.assigned_barangay || "Not assigned"}
                      </p>
                      <button
                        onClick={() => setEditingBarangay(true)}
                        className="ml-2 p-1 text-sky-600 hover:bg-sky-100 rounded transition-colors"
                        title="Edit assigned barangay"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {!profile.assigned_barangay && !editingBarangay && (
                <p className="text-xs text-red-500 mt-1">
                  This field needs to be completed
                </p>
              )}
            </div>
          </div>

          {/* ✅ Back & Action buttons */}
          <div className="p-6 border-t flex justify-between items-center">
            <Link
              to="/staff"
              className={`${theme.primaryText} hover:underline font-medium`}
            >
              ← Back to List
            </Link>

            <div className="flex gap-2">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors bg-amber-600 hover:bg-amber-700 text-white font-medium"
              >
                <Key size={18} />
                Reset Password
              </button>
              {actionConfig && (
                <button
                  onClick={() => setShowStatusModal(true)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-white font-medium ${actionConfig.buttonColor}`}
                >
                  {actionConfig.targetStatus === 'approved' ? <UserCheck size={18} /> : <Ban size={18} />}
                  {actionConfig.buttonText}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Status Change Confirmation Modal */}
      {showStatusModal && actionConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md text-center">
            <div className="flex justify-center mb-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${actionConfig.modalIconBg}`}>
                {actionConfig.modalIcon}
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {actionConfig.modalTitle}
            </h3>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to {actionConfig.targetStatus === 'approved' ? 'activate' : 'deactivate'}{" "}
              <span className="font-semibold">
                {profile.first_name} {profile.last_name}
              </span>
              ?
              <br /><br />
              <span className="text-sm">
                {actionConfig.modalDescription}
              </span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowStatusModal(false)}
                disabled={updatingStatus}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusChange(actionConfig.targetStatus)}
                disabled={updatingStatus}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition font-medium disabled:opacity-50 flex items-center justify-center gap-2 ${actionConfig.confirmButtonColor}`}
              >
                {updatingStatus ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {actionConfig.targetStatus === 'approved' ? 'Activating...' : 'Deactivating...'}
                  </>
                ) : (
                  <>
                    {actionConfig.confirmText}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Password Update Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Key className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Reset Password
                </h3>
                <p className="text-gray-600 text-sm">
                  Set a new password for {profile.first_name} {profile.last_name}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword.newPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      newPassword: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent pr-10"
                    placeholder="Enter new password"
                    disabled={updatingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('newPassword')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.newPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 6 characters long
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword.confirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      confirmPassword: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent pr-10"
                    placeholder="Confirm new password"
                    disabled={updatingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.confirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={cancelPasswordUpdate}
                disabled={updatingPassword}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordUpdate}
                disabled={updatingPassword}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg transition font-medium hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updatingPassword ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Update Password
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default StaffProfile;