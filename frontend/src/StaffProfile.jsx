import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "./api";
import Layout from "./Layout";
import { UserCheck, Ban, } from "lucide-react";

// ✅ Theme applied consistently
const theme = {
  primary: "from-sky-600 to-sky-400",
  primaryText: "text-sky-600",
  secondaryText: "text-sky-400",
  cardBg: "bg-white",
  footerBg: "bg-sky-700",
};

function StaffProfile() {
  const { id } = useParams();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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
    { label: "Assigned Barangay", value: profile.assigned_barangay },
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
    </Layout>
  );
}

export default StaffProfile;