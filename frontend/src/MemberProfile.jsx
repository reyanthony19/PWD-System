import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import api from "./api";
import Layout from "./Layout";

function MemberProfile() {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const [allEvents, setAllEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [benefits, setBenefits] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingBenefits, setLoadingBenefits] = useState(false);
  const [sortBy, setSortBy] = useState("event_date");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateFilter, setDateFilter] = useState("past");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

  // StatusBadge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      approved: { color: "bg-green-100 text-green-800", text: "Approved" },
      pending: { color: "bg-yellow-100 text-yellow-800", text: "Pending" },
      rejected: { color: "bg-red-100 text-red-800", text: "Rejected" },
      deceased: { color: "bg-gray-100 text-gray-800", text: "Deceased" },
      inactive: { color: "bg-orange-100 text-orange-800", text: "Inactive" },
      active: { color: "bg-green-100 text-green-800", text: "Active" }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  // Hard Copy Submission Badge component
  const HardCopyBadge = ({ hasHardCopy }) => {
    if (hasHardCopy) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 ml-2">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Hard Copy Submitted
        </span>
      );
    }
    return null;
  };

  // Check if member has submitted hard copies based on documents.remarks
  const hasSubmittedHardCopy = useMemo(() => {
    if (!member || !member.member_profile || !member.member_profile.documents) {
      return false;
    }

    const documents = member.member_profile.documents;
    const remarks = documents.remarks;

    // Check if remarks indicate hard copy submission
    if (!remarks) return false;

    const hardCopyIndicators = [
      'hard copy submitted',
      'hard copy received',
      'physical copy submitted',
      'original documents submitted',
      'hardcopy',
      'physical'
    ];

    return hardCopyIndicators.some(indicator =>
      remarks.toLowerCase().includes(indicator.toLowerCase())
    );
  }, [member]);

  // Success message function for approve
  const showApproveSuccessMessage = () => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
    toast.innerHTML = `
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
        </svg>
        <span class="font-medium">Member approved successfully</span>
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

  // Error message function for approve
  const showApproveErrorMessage = () => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
    toast.innerHTML = `
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
        </svg>
        <span class="font-medium">Failed to approve member</span>
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

  // Success message function for reject
  const showRejectSuccessMessage = () => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
    toast.innerHTML = `
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
        </svg>
        <span class="font-medium">Member rejected successfully</span>
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

  // Error message function for reject
  const showRejectErrorMessage = () => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
    toast.innerHTML = `
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
        </svg>
        <span class="font-medium">Failed to reject member</span>
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

  // Approve member by changing status to approved
  const handleApproveMember = async () => {
    // Create custom modal elements
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all">
        <div class="p-6">
          <!-- Icon -->
          <div class="flex justify-center mb-4">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
          
          <!-- Title -->
          <h3 class="text-xl font-bold text-gray-900 text-center mb-2">Approve Member</h3>
          
          <!-- Message -->
          <p class="text-gray-600 text-center mb-6">
            Are you sure you want to approve <span class="font-semibold">${fullName}</span>? This action will change their status to "approved".
          </p>
          
          <!-- Buttons -->
          <div class="flex gap-3">
            <button 
              id="cancelBtn"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button 
              id="confirmBtn"
              class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Approve Member
            </button>
          </div>
        </div>
      </div>
    `;

    // Add to DOM
    document.body.appendChild(modal);

    // Focus management
    modal.focus();

    // Handle confirm button
    const confirmBtn = modal.querySelector('#confirmBtn');
    const cancelBtn = modal.querySelector('#cancelBtn');

    return new Promise((resolve) => {
      const cleanup = () => {
        if (modal.parentNode) {
          modal.remove();
        }
        document.removeEventListener('keydown', handleEscape);
      };

      const handleConfirm = async () => {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = `
          <div class="flex items-center justify-center">
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Approving...
          </div>
        `;

        try {
          setUpdatingStatus(true);

          // Update user status to approved using the correct endpoint
          await api.patch(`/user/${id}/status`, {
            status: "approved"
          });

          // Update local state
          setMember(prev => prev ? { ...prev, status: "approved" } : null);

          cleanup();
          resolve(true);

          // Show success message
          showApproveSuccessMessage();

        } catch (err) {
          console.error("Error approving member:", err);
          cleanup();
          resolve(false);

          // Show error message
          showApproveErrorMessage();
        } finally {
          setUpdatingStatus(false);
        }
      };

      const handleCancel = () => {
        cleanup();
        resolve(false);
      };

      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          handleCancel();
        }
      };

      const handleBackgroundClick = (e) => {
        if (e.target === modal) {
          handleCancel();
        }
      };

      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);
      modal.addEventListener('click', handleBackgroundClick);
      document.addEventListener('keydown', handleEscape);

      // Focus the cancel button for better accessibility
      cancelBtn.focus();
    });
  };

  // Reject member by changing status to rejected with styled confirmation
  const handleRejectMember = async () => {
    // Create custom modal elements
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all">
        <div class="p-6">
          <!-- Icon -->
          <div class="flex justify-center mb-4">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
          </div>
          
          <!-- Title -->
          <h3 class="text-xl font-bold text-gray-900 text-center mb-2">Reject Member</h3>
          
          <!-- Message -->
          <p class="text-gray-600 text-center mb-6">
            Are you sure you want to reject <span class="font-semibold">${fullName}</span>? This action will change their status to "rejected" and cannot be undone.
          </p>
          
          <!-- Buttons -->
          <div class="flex gap-3">
            <button 
              id="cancelBtn"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button 
              id="confirmBtn"
              class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reject Member
            </button>
          </div>
        </div>
      </div>
    `;

    // Add to DOM
    document.body.appendChild(modal);

    // Focus management
    modal.focus();

    // Handle confirm button
    const confirmBtn = modal.querySelector('#confirmBtn');
    const cancelBtn = modal.querySelector('#cancelBtn');

    return new Promise((resolve) => {
      const cleanup = () => {
        if (modal.parentNode) {
          modal.remove();
        }
        document.removeEventListener('keydown', handleEscape);
      };

      const handleConfirm = async () => {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = `
          <div class="flex items-center justify-center">
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Rejecting...
          </div>
        `;

        try {
          setUpdatingStatus(true);

          // Update user status to rejected using the correct endpoint
          await api.patch(`/user/${id}/status`, {
            status: "rejected"
          });

          // Update local state
          setMember(prev => prev ? { ...prev, status: "rejected" } : null);

          cleanup();
          resolve(true);

          // Show success message
          showRejectSuccessMessage();

        } catch (err) {
          console.error("Error rejecting member:", err);
          cleanup();
          resolve(false);

          // Show error message
          showRejectErrorMessage();
        } finally {
          setUpdatingStatus(false);
        }
      };

      const handleCancel = () => {
        cleanup();
        resolve(false);
      };

      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          handleCancel();
        }
      };

      const handleBackgroundClick = (e) => {
        if (e.target === modal) {
          handleCancel();
        }
      };

      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);
      modal.addEventListener('click', handleBackgroundClick);
      document.addEventListener('keydown', handleEscape);

      // Focus the cancel button for better accessibility
      cancelBtn.focus();
    });
  };

  // Calculate profile completion percentage including images/documents
  const calculateProfileCompletion = useMemo(() => {
    if (!member || member.role !== "member" || !member.member_profile) return 0;

    const profile = member.member_profile;
    const documents = profile.documents || {};

    // Define all required fields with their weights
    const fieldWeights = {
      // Personal Information (40% weight)
      personal: {
        fields: [
          { name: 'first_name', label: 'First Name', weight: 2 },
          { name: 'last_name', label: 'Last Name', weight: 2 },
          { name: 'birthdate', label: 'Birthdate', weight: 1 },
          { name: 'sex', label: 'Sex', weight: 1 },
        ],
        totalWeight: 6
      },

      // Contact Information (20% weight)
      contact: {
        fields: [
          { name: 'contact_number', label: 'Contact Number', weight: 1 },
          { name: 'address', label: 'Address', weight: 1 },
          { name: 'barangay', label: 'Barangay', weight: 1 },
        ],
        totalWeight: 3
      },

      // Medical Information (15% weight)
      medical: {
        fields: [
          { name: 'disability_type', label: 'Disability Type', weight: 2 },
          { name: 'blood_type', label: 'Blood Type', weight: 1 },
        ],
        totalWeight: 3
      },

      // Government IDs (10% weight)
      government: {
        fields: [
          { name: 'sss_number', label: 'SSS Number', weight: 1 },
          { name: 'philhealth_number', label: 'PhilHealth Number', weight: 1 },
        ],
        totalWeight: 2
      },

      // Guardian Information (15% weight)
      guardian: {
        fields: [
          { name: 'guardian_full_name', label: 'Guardian Full Name', weight: 1 },
          { name: 'guardian_relationship', label: 'Guardian Relationship', weight: 1 },
          { name: 'guardian_contact_number', label: 'Guardian Contact', weight: 1 },
          { name: 'guardian_address', label: 'Guardian Address', weight: 1 },
        ],
        totalWeight: 4
      },

      // Documents/Images (20% weight) - 5% each
      documents: {
        fields: [
          { name: 'barangay_indigency', label: 'Barangay Indigency', weight: 1 },
          { name: 'medical_certificate', label: 'Medical Certificate', weight: 1 },
          { name: 'picture_2x2', label: '2x2 Picture', weight: 1 },
          { name: 'birth_certificate', label: 'Birth Certificate', weight: 1 },
        ],
        totalWeight: 4
      }
    };

    let totalScore = 0;
    let maxScore = 0;

    // Calculate scores for each category
    Object.keys(fieldWeights).forEach(category => {
      const categoryConfig = fieldWeights[category];

      categoryConfig.fields.forEach(field => {
        maxScore += field.weight;

        let fieldValue;
        if (category === 'documents') {
          // For documents, check if the file exists
          fieldValue = documents[field.name];
        } else {
          // For regular fields, get from profile
          fieldValue = profile[field.name];
        }

        // Check if field is filled
        const isFilled = fieldValue !== null &&
          fieldValue !== undefined &&
          fieldValue !== "" &&
          fieldValue !== " " &&
          (!Array.isArray(fieldValue) || fieldValue.length > 0);

        if (isFilled) {
          totalScore += field.weight;
        }
      });
    });

    const percentage = Math.round((totalScore / maxScore) * 100);
    return percentage;
  }, [member]);

  // Get profile completion color based on percentage
  const getCompletionColor = (percentage) => {
    if (percentage >= 90) return "bg-green-500";
    if (percentage >= 70) return "bg-blue-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Get completion status text
  const getCompletionStatus = (percentage) => {
    if (percentage >= 90) return "Excellent";
    if (percentage >= 70) return "Good";
    if (percentage >= 50) return "Fair";
    return "Needs Improvement";
  };

  // Get detailed completion breakdown
  const getCompletionBreakdown = useMemo(() => {
    if (!member || member.role !== "member" || !member.member_profile) return [];

    const profile = member.member_profile;
    const documents = profile.documents || {};

    const categories = [
      {
        name: "Personal Information",
        fields: [
          { label: "First Name", value: profile.first_name },
          { label: "Last Name", value: profile.last_name },
          { label: "Birthdate", value: profile.birthdate },
          { label: "Sex", value: profile.sex },
        ]
      },
      {
        name: "Contact Information",
        fields: [
          { label: "Contact Number", value: profile.contact_number },
          { label: "Address", value: profile.address },
          { label: "Barangay", value: profile.barangay },
        ]
      },
      {
        name: "Medical Information",
        fields: [
          { label: "Disability Type", value: profile.disability_type },
          { label: "Blood Type", value: profile.blood_type },
        ]
      },
      {
        name: "Government IDs",
        fields: [
          { label: "SSS Number", value: profile.sss_number },
          { label: "PhilHealth Number", value: profile.philhealth_number },
        ]
      },
      {
        name: "Guardian Information",
        fields: [
          { label: "Guardian Full Name", value: profile.guardian_full_name },
          { label: "Guardian Relationship", value: profile.guardian_relationship },
          { label: "Guardian Contact", value: profile.guardian_contact_number },
          { label: "Guardian Address", value: profile.guardian_address },
        ]
      },
      {
        name: "Required Documents",
        fields: [
          { label: "Barangay Indigency", value: documents.barangay_indigency },
          { label: "Medical Certificate", value: documents.medical_certificate },
          { label: "2x2 Picture", value: documents.picture_2x2 },
          { label: "Birth Certificate", value: documents.birth_certificate },
        ]
      }
    ];

    return categories.map(category => {
      const filledFields = category.fields.filter(field =>
        field.value !== null &&
        field.value !== undefined &&
        field.value !== "" &&
        field.value !== " " &&
        (!Array.isArray(field.value) || field.value.length > 0)
      ).length;

      const totalFields = category.fields.length;
      const percentage = Math.round((filledFields / totalFields) * 100);

      return {
        ...category,
        filledFields,
        totalFields,
        percentage
      };
    });
  }, [member]);

  // Calculate fullName and profile from member data using useMemo
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

  const profile = useMemo(() => {
    if (!member) return {};
    return member.role === "member" ? member.member_profile || {} : {};
  }, [member]);

  const docs = useMemo(() => {
    return profile?.documents || {};
  }, [profile]);

  // Helper function to calculate event status based on date
  const calculateEventStatus = (eventDate) => {
    const today = new Date();
    const event = new Date(eventDate);

    // Reset time parts to compare only dates
    today.setHours(0, 0, 0, 0);
    event.setHours(0, 0, 0, 0);

    if (event > today) {
      return "upcoming";
    } else if (event < today) {
      return "completed";
    } else {
      return "ongoing";
    }
  };

  useEffect(() => {
    const fetchMember = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/user/${id}`);
        setMember(res.data);
      } catch (err) {
        console.error("❌ Error fetching member:", err);
        setError(err.response?.data?.message || "Failed to load member profile.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchMember();
    else {
      setError("Invalid member ID.");
      setLoading(false);
    }
  }, [id]);

  const fetchAttendanceData = useCallback(async (events) => {
    try {
      console.log("🔄 Fetching attendance data...");

      // Try to get user's attendance records
      try {
        const userAttendancesRes = await api.get(`/users/${id}/attendances`);
        const userAttendances = userAttendancesRes.data.data || userAttendancesRes.data || [];
        console.log("📊 User attendance records:", userAttendances);

        // Update events with attendance data
        const eventsWithAttendance = events.map(event => {
          const userAttendance = userAttendances.find(att => att.event_id === event.id);
          return {
            ...event,
            attendanceRecords: userAttendance ? [userAttendance] : [],
            attendance: userAttendance || null,
            attendance_status: userAttendance ? 'present' : 'absent'
          };
        });

        setAllEvents(eventsWithAttendance);
        return;
      } catch (attendanceError) {
        console.log("⚠️ User attendance endpoint failed, trying event-by-event...");
      }

      // Fallback: fetch attendance for each event
      const eventsWithAttendance = await Promise.all(
        events.map(async (event) => {
          try {
            const attendanceRes = await api.get(`/attendances/${event.id}`);
            const attendanceRecords = attendanceRes.data.data || attendanceRes.data || [];
            const userAttendance = attendanceRecords.find(att => att.user_id === parseInt(id));

            return {
              ...event,
              attendanceRecords,
              attendance: userAttendance || null,
              attendance_status: userAttendance ? 'present' : 'absent'
            };
          } catch (error) {
            console.error(`❌ Error fetching attendance for event ${event.id}:`, error);
            return event; // Return event without attendance data
          }
        })
      );

      setAllEvents(eventsWithAttendance);

    } catch (err) {
      console.error("❌ Error in fetchAttendanceData:", err);
      // Keep the events even if attendance fetch fails
    }
  }, [id]);

  const fetchEvents = useCallback(async () => {
    try {
      setLoadingEvents(true);
      console.log("🔄 Fetching events...");

      const res = await api.get("/events");
      console.log("📦 Events API response:", res);

      // Use the same pattern as Events page: res.data.data || res.data
      const eventsData = res.data.data || res.data;
      console.log("🎯 Processed events data:", eventsData);

      if (!eventsData || eventsData.length === 0) {
        console.log("❌ No events data found");
        setAllEvents([]);
        return;
      }

      // Process events with computed fields
      const processedEvents = eventsData.map(event => {
        const eventDate = new Date(event.event_date || event.date);
        const calculatedStatus = calculateEventStatus(eventDate);

        return {
          ...event,
          computedDate: eventDate,
          isPast: calculatedStatus === "completed",
          isUpcoming: calculatedStatus === "upcoming",
          isOngoing: calculatedStatus === "ongoing",
          calculatedStatus: calculatedStatus,
          attendanceRecords: [], // Initialize empty, we'll fetch attendance separately
          attendance: null,
          attendance_status: 'absent'
        };
      });

      console.log("✅ Processed events:", processedEvents);
      setAllEvents(processedEvents);

      // Now fetch attendance data for these events
      await fetchAttendanceData(processedEvents);

    } catch (err) {
      console.error("❌ Error fetching events:", err);
      console.error("Error details:", err.response?.data);
    } finally {
      setLoadingEvents(false);
    }
  }, [fetchAttendanceData]);

  const fetchBenefits = useCallback(async () => {
    try {
      setLoadingBenefits(true);
      const res = await api.get(`/users/${id}/benefits`);
      const benefitsData = res.data.data || res.data || [];
      // Filter only claimed benefits
      const claimedBenefits = benefitsData.filter(benefit => benefit.status === 'claimed');
      setBenefits(claimedBenefits);
    } catch (err) {
      console.error("Error fetching benefits:", err);
    } finally {
      setLoadingBenefits(false);
    }
  }, [id]);

  // Filter and sort events based on current filters
  useEffect(() => {
    if (allEvents.length === 0) {
      setFilteredEvents([]);
      return;
    }

    console.log("🔍 Filtering events...", allEvents.length, "total events");

    let filtered = [...allEvents];

    // Date filtering
    switch (dateFilter) {
      case "past":
        filtered = filtered.filter(event => event.calculatedStatus === "completed");
        break;
      case "upcoming":
        filtered = filtered.filter(event => event.calculatedStatus === "upcoming");
        break;
      case "ongoing":
        filtered = filtered.filter(event => event.calculatedStatus === "ongoing");
        break;
      case "all":
        // No date filter
        break;
      default:
        break;
    }

    // Status filtering (using API status)
    if (filterStatus !== "all") {
      filtered = filtered.filter(event => event.status === filterStatus);
    }

    // Sorting
    switch (sortBy) {
      case "event_date":
        filtered.sort((a, b) => a.computedDate - b.computedDate);
        break;
      case "event_date_desc":
        filtered.sort((a, b) => b.computedDate - a.computedDate);
        break;
      case "created_at_asc":
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case "created_at_desc":
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      default:
        break;
    }

    console.log("✅ Filtered events:", filtered.length);
    setFilteredEvents(filtered);
  }, [allEvents, dateFilter, filterStatus, sortBy]);

  useEffect(() => {
    if (activeTab === "events") {
      fetchEvents();
    } else if (activeTab === "benefits") {
      fetchBenefits();
    }
  }, [activeTab, fetchEvents, fetchBenefits]);

  if (loading)
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
          <div className="w-16 h-16 border-8 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-xl font-semibold text-sky-600 animate-pulse">
            Loading Member Profile...
          </p>
          <p className="text-gray-600 text-sm mt-2">Please wait a moment 🧑‍🦽</p>
        </div>
      </Layout>
    );

  if (error)
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-red-600 text-xl font-semibold mb-2">{error}</p>
            <Link to="/member" className="text-sky-600 hover:underline">
              ← Back to Members List
            </Link>
          </div>
        </div>
      </Layout>
    );

  if (!member)
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

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-sky-600 to-sky-400 p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {fullName || "-"}
                  </h1>
                  <div className="flex items-center gap-4 flex-wrap">
                    <p className="text-blue-100 text-lg capitalize">{member.role} Profile</p>
                    <StatusBadge status={member.status} />
                    <HardCopyBadge hasHardCopy={hasSubmittedHardCopy} />
                    {profile.id_number && (
                      <p className="text-blue-100 bg-sky-700 px-3 py-1 rounded-lg">
                        ID: {profile.id_number}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 md:mt-0 flex items-center gap-3">
                  <Link
                    to="/member"
                    className="inline-flex items-center px-4 py-2 bg-white text-sky-600 rounded-lg hover:bg-blue-50 transition font-semibold"
                  >
                    ← Back to List
                  </Link>
                </div>
              </div>
            </div>

            {/* Profile Completion Progress Bar */}
            {member.role === "member" && (
              <div className="bg-white border-t border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Profile Completion
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {calculateProfileCompletion}% - {getCompletionStatus(calculateProfileCompletion)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${getCompletionColor(calculateProfileCompletion)}`}
                        style={{ width: `${calculateProfileCompletion}%` }}
                      ></div>
                    </div>
                  </div>
                  {calculateProfileCompletion < 100 && (
                    <div className="text-sm text-gray-500 text-center sm:text-right">
                      Complete all fields for full profile benefits
                    </div>
                  )}
                </div>

                {/* Detailed Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {getCompletionBreakdown.map((category, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-gray-700">
                          {category.name}
                        </span>
                        <span className="text-xs font-semibold text-gray-900">
                          {category.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${category.percentage >= 90 ? 'bg-green-400' :
                              category.percentage >= 70 ? 'bg-blue-400' :
                                category.percentage >= 50 ? 'bg-yellow-400' : 'bg-red-400'
                            }`}
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {category.filledFields} of {category.totalFields} fields completed
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-xl shadow-sm mb-6">
            <nav className="flex overflow-x-auto">
              {[
                { id: "profile", label: "Profile Information" },
                { id: "events", label: `Events & Attendance` },
                { id: "benefits", label: "Benefits & Claims" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-0 px-6 py-4 text-sm font-medium border-b-2 transition ${activeTab === tab.id
                      ? "border-sky-500 text-sky-600 bg-blue-50"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Personal Information</h2>
                    <p className="text-gray-600 mt-1">
                      Profile completion: <span className={`font-semibold ${getCompletionColor(calculateProfileCompletion).replace('bg-', 'text-')}`}>
                        {calculateProfileCompletion}%
                      </span>
                      {hasSubmittedHardCopy && (
                        <HardCopyBadge hasHardCopy={hasSubmittedHardCopy} />
                      )}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    {/* Approve Button - Only show when status is pending */}
                    {member.status === 'pending' && (
                      <button
                        onClick={handleApproveMember}
                        disabled={updatingStatus}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updatingStatus ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Approving...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Approve Member
                          </>
                        )}
                      </button>
                    )}
                    
                    {/* Reject Button - Only show if member is approved (not pending and not rejected) */}
                    {member.status === 'approved' && (
                      <button
                        onClick={handleRejectMember}
                        disabled={updatingStatus}
                        className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updatingStatus ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Rejecting...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Reject Member
                          </>
                        )}
                      </button>
                    )}
                    
                    {member.role === "member" && (
                      <Link
                        to={`/print/${member.id}`}
                        state={{ member }}
                        className="inline-flex items-center px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition font-semibold"
                      >
                        🖨️ Print ID
                      </Link>
                    )}
                  </div>
                </div>

                {/* Status Alert if Rejected */}
                {member.status === 'rejected' && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-red-800 font-medium">This member has been rejected and is no longer active in the system.</span>
                    </div>
                  </div>
                )}

                {/* Status Alert if Approved */}
                {member.status === 'approved' && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-green-800 font-medium">This member has been approved and is active in the system.</span>
                    </div>
                  </div>
                )}

                {/* Hard Copy Remarks Display */}
                {hasSubmittedHardCopy && docs.remarks && (
                  <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-purple-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <span className="text-purple-800 font-medium">Hard Copy Documents Submitted</span>
                        <p className="text-purple-700 text-sm mt-1">{docs.remarks}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: "Full Name", value: fullName || "-" },
                    { label: "ID Number", value: profile.id_number },
                    { label: "Birthdate", value: profile.birthdate },
                    { label: "Sex", value: profile.sex },
                    { label: "Guardian Full Name", value: profile.guardian_full_name },
                    { label: "Guardian Relationship", value: profile.guardian_relationship },
                    { label: "Guardian Contact Number", value: profile.guardian_contact_number },
                    { label: "Guardian Address", value: profile.guardian_address },
                    { label: "Disability Type", value: profile.disability_type },
                    { label: "Barangay", value: profile.barangay },
                    { label: "Address", value: profile.address },
                    { label: "Blood Type", value: profile.blood_type },
                    { label: "SSS Number", value: profile.sss_number },
                    { label: "PhilHealth Number", value: profile.philhealth_number },
                    { label: "Contact Number", value: profile.contact_number },
                  ].map((f, i) => (
                    <div key={i} className={`p-4 rounded-lg ${!f.value ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                      <p className="text-gray-500 text-sm">{f.label}</p>
                      <p className={`font-medium ${!f.value ? 'text-red-600' : 'text-gray-900'}`}>
                        {f.value || "Not provided"}
                      </p>
                      {!f.value && (
                        <p className="text-xs text-red-500 mt-1">
                          This field needs to be completed
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Documents Section */}
                <div className="mt-8 pt-8 border-t">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">Required Documents</h3>
                    {hasSubmittedHardCopy && (
                      <HardCopyBadge hasHardCopy={hasSubmittedHardCopy} />
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {[
                      { label: "Barangay Indigency", file: docs.barangay_indigency, icon: "📄" },
                      { label: "Medical Certificate", file: docs.medical_certificate, icon: "🏥" },
                      { label: "2x2 Picture", file: docs.picture_2x2, icon: "📷" },
                      { label: "Birth Certificate", file: docs.birth_certificate, icon: "🎂" },
                    ].map((doc, i) => (
                      <div key={i} className={`border-2 rounded-xl overflow-hidden transition group ${doc.file ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                        }`}>
                        <div className="aspect-square bg-gray-100 overflow-hidden">
                          {doc.file ? (
                            <img
                              src={
                                doc.file.startsWith("http")
                                  ? doc.file
                                  : `${API_URL}/storage/${doc.file}`
                              }
                              alt={doc.label}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <span className="text-4xl text-gray-400">{doc.icon}</span>
                            </div>
                          )}
                        </div>
                        <div className="p-4 text-center">
                          <div className="text-2xl mb-2">{doc.icon}</div>
                          <p className="text-sm font-medium text-gray-700 mb-2">{doc.label}</p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${doc.file ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {doc.file ? 'Uploaded' : 'Missing'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Events Tab */}
            {activeTab === "events" && (
              <div className="p-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 lg:mb-0">Events & Attendance</h2>

                  {/* Debug Info */}
                  <div className="text-sm text-gray-500 mb-4 lg:mb-0">
                    Showing {filteredEvents.length} of {allEvents.length} events
                  </div>

                  {/* Enhanced Filters and Sorting */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Date Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Date Filter</label>
                      <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      >
                        <option value="past">Past Events</option>
                        <option value="upcoming">Upcoming Events</option>
                        <option value="ongoing">Ongoing Events</option>
                        <option value="all">All Events</option>
                      </select>
                    </div>

                    {/* Sort By */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      >
                        <option value="event_date">Event Date (Oldest First)</option>
                        <option value="event_date_desc">Event Date (Latest First)</option>
                        <option value="created_at_asc">Created (Oldest First)</option>
                        <option value="created_at_desc">Created (Latest First)</option>
                      </select>
                    </div>

                    {/* Filter by Status */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Event Status</label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      >
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="scheduled">Scheduled</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">{allEvents.length}</div>
                    <div className="text-sm text-gray-500">Total Events</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {allEvents.filter(event => event.calculatedStatus === "upcoming").length}
                    </div>
                    <div className="text-sm text-blue-600">Upcoming</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {allEvents.filter(event => event.calculatedStatus === "ongoing").length}
                    </div>
                    <div className="text-sm text-orange-600">Ongoing</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {allEvents.filter(event => event.attendance_status === 'present').length}
                    </div>
                    <div className="text-sm text-green-600">Attended</div>
                  </div>
                </div>

                {loadingEvents ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading events and attendance records...</p>
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📅</div>
                    <p className="text-gray-500 text-lg">
                      {allEvents.length === 0 ? 'No events found in system.' :
                        dateFilter === 'past' ? 'No past events found.' :
                          dateFilter === 'upcoming' ? 'No upcoming events found.' :
                            dateFilter === 'ongoing' ? 'No ongoing events found.' :
                              'No events match your filters.'}
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      {allEvents.length === 0 ? 'Events will appear here once they are created in the system.' :
                        'Try adjusting your filters to see more events.'}
                    </p>
                   
                  </div>
                ) : (
                  <>
                    {/* Events Table */}
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Event Details
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date & Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Location
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Event Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Your Attendance
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredEvents.map((event) => {
                            const userAttendanceRecord = event.attendance;

                            // Determine what to show in attendance column
                            const getAttendanceDisplay = () => {
                              if (event.calculatedStatus === "completed") {
                                // For completed events, show Present/Absent
                                return userAttendanceRecord ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Present
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    Absent
                                  </span>
                                );
                              } else if (event.calculatedStatus === "ongoing") {
                                // For ongoing events, show "Ongoing"
                                return (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                    Ongoing
                                  </span>
                                );
                              } else {
                                // For upcoming events, show "Scheduled"
                                return (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                    Scheduled
                                  </span>
                                );
                              }
                            };

                            return (
                              <tr key={event.id} className="hover:bg-gray-50 transition">
                                {/* Event Details */}
                                <td className="px-6 py-4">
                                  <div>
                                    <h3 className="text-sm font-semibold text-gray-900">
                                      {event.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                      {event.description}
                                    </p>
                                    {event.calculatedStatus === "upcoming" && (
                                      <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                        Upcoming
                                      </span>
                                    )}
                                    {event.calculatedStatus === "ongoing" && (
                                      <span className="inline-block mt-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                                        Ongoing
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Date & Time */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {event.computedDate.toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </div>
                                  {(event.event_time || event.time) && (
                                    <div className="text-sm text-gray-500">
                                      {event.event_time || event.time}
                                    </div>
                                  )}
                                </td>

                                {/* Location */}
                                <td className="px-6 py-4">
                                  <div className="text-sm text-gray-900">
                                    {event.location || "Not specified"}
                                  </div>
                                </td>

                                {/* Event Status */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${event.calculatedStatus === "completed"
                                      ? 'bg-green-100 text-green-800'
                                      : event.calculatedStatus === "upcoming"
                                        ? 'bg-blue-100 text-blue-800'
                                        : event.calculatedStatus === "ongoing"
                                          ? 'bg-orange-100 text-orange-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {event.calculatedStatus?.charAt(0).toUpperCase() + event.calculatedStatus?.slice(1) || 'Scheduled'}
                                  </span>
                                </td>

                                {/* Attendance Status */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {getAttendanceDisplay()}
                                  {userAttendanceRecord?.scanned_at && event.calculatedStatus === "completed" && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Scanned: {new Date(userAttendanceRecord.scanned_at).toLocaleDateString()}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Benefits Tab */}
            {activeTab === "benefits" && (
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Benefits & Claims</h2>

                {loadingBenefits ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading benefits...</p>
                  </div>
                ) : benefits.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎁</div>
                    <p className="text-gray-500 text-lg">No benefits claimed by this member.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {benefits.map((benefit) => (
                      <div key={benefit.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition group">
                        <div className="text-center mb-4">
                          <div className="text-4xl mb-3">{benefit.type === 'financial' ? '💰' : benefit.type === 'medical' ? '🏥' : '🎁'}</div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-2">{benefit.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${benefit.status === 'claimed' ? 'bg-green-100 text-green-800' :
                              benefit.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {benefit.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Type:</span>
                            <span className="font-medium capitalize">{benefit.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Amount:</span>
                            <span className="font-medium text-green-600">
                              {benefit.amount ? `₱${benefit.amount}` : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Claimed Date:</span>
                            <span className="font-medium">
                              {benefit.claimed_at ? new Date(benefit.claimed_at).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                          {benefit.description && (
                            <div className="pt-2 border-t">
                              <p className="text-gray-700">{benefit.description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default MemberProfile;