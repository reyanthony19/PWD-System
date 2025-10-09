import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, FileText, DollarSign, Clock, Users, Check, X, Calendar, Heart, Search, Plus, UserPlus, MapPin, Stethoscope, TrendingUp, AlertTriangle } from "lucide-react";
import Layout from "./Layout";
import api from "./api";

// Barangay options for consistent filtering
const barangayOptions = [
  "All", "Awang", "Bagocboc", "Barra", "Bonbon", "Cauyonan", "Igpit",
  "Limonda", "Luyong Bonbon", "Malanang", "Nangcaon", "Patag",
  "Poblacion", "Taboc", "Tingalan"
];

// Custom toast hook for better alert management
const useToast = () => {
  const showToast = useCallback((message, type = 'success') => {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

    toast.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl z-50 transform transition-all duration-300 translate-x-full opacity-0 border-l-4 ${type === 'success' ? 'border-green-300' : 'border-red-300'}`;

    const iconSVG = type === 'success'
      ? `<svg class="w-6 h-6 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
         </svg>`
      : `<svg class="w-6 h-6 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
         </svg>`;

    toast.innerHTML = `
      <div class="flex items-center">
        ${iconSVG}
        <div>
          <p class="font-semibold">${type === 'success' ? 'Success!' : 'Error!'}</p>
          <p class="text-sm opacity-90">${message}</p>
        </div>
      </div>
    `;

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
    });

    // Remove after 4 seconds
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }, 4000);
  }, []);

  return showToast;
};

function BenefitsClaimRecord() {
  const { benefitId } = useParams();
  const [combinedList, setCombinedList] = useState([]);
  const [benefit, setBenefit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filters
  const [search, setSearch] = useState("");
  const [barangayFilter, setBarangayFilter] = useState("All");

  // Add participants modal
  const [showAddParticipants, setShowAddParticipants] = useState(false);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [selectedNewParticipants, setSelectedNewParticipants] = useState([]);
  const [addingParticipants, setAddingParticipants] = useState(false);

  // Remove participant modal
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [removingParticipant, setRemovingParticipant] = useState(false);

  // Modal filters and search
  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const [modalFilters, setModalFilters] = useState({
    barangay: "",
    disability_type: ""
  });
  const [modalSortBy, setModalSortBy] = useState("priority");

  const navigate = useNavigate();
  const showToast = useToast();

  // Severity scoring system (higher score = more severe) - wrapped in useMemo
  const severityScores = useMemo(() => ({
    "mild": 1,
    "moderate": 3,
    "severe": 5,
    "profound": 7
  }), []);

  // Income brackets scoring (lower income = higher score)
  const getIncomeScore = useCallback((monthlyIncome) => {
    if (!monthlyIncome || monthlyIncome === 0) return 10;
    if (monthlyIncome <= 3000) return 8;
    if (monthlyIncome <= 6000) return 6;
    if (monthlyIncome <= 10000) return 4;
    if (monthlyIncome <= 15000) return 2;
    return 1;
  }, []);

  // Dependants scoring (more dependants = higher score)
  const getDependantsScore = useCallback((dependants) => {
    if (!dependants || dependants === 0) return 1;
    if (dependants === 1) return 2;
    if (dependants === 2) return 3;
    if (dependants === 3) return 4;
    if (dependants >= 4) return 5;
    return 1;
  }, []);

  // Calculate priority score for each member and convert to percentage
  const calculatePriorityScore = useCallback((member) => {
    const profile = member.member_profile || {};

    const severityScore = severityScores[profile.severity?.toLowerCase()] || 1;
    const incomeScore = getIncomeScore(parseFloat(profile.monthly_income) || 0);
    const dependantsScore = getDependantsScore(parseInt(profile.dependants) || 0);

    const isSeniorCitizen = profile.age >= 60 ? 2 : 0;
    const isSoloParent = profile.is_solo_parent ? 2 : 0;

    const totalScore =
      (severityScore * 3) +
      (incomeScore * 2.5) +
      (dependantsScore * 2) +
      isSeniorCitizen +
      isSoloParent;

    const maxPossibleScore = (7 * 3) + (10 * 2.5) + (5 * 2) + 2 + 2;
    const percentageScore = Math.round((totalScore / maxPossibleScore) * 100);

    return {
      totalScore: Math.round(totalScore * 100) / 100,
      percentageScore,
      severityScore,
      incomeScore,
      dependantsScore,
      isSeniorCitizen: profile.age >= 60,
      isSoloParent: profile.is_solo_parent
    };
  }, [severityScores, getIncomeScore, getDependantsScore]);

  // Get priority level based on percentage score
  const getPriorityLevel = useCallback((percentage) => {
    if (percentage >= 80) return { level: "Very High", color: "bg-red-100 text-red-800", icon: "🔥" };
    if (percentage >= 60) return { level: "High", color: "bg-orange-100 text-orange-800", icon: "⭐" };
    if (percentage >= 40) return { level: "Medium", color: "bg-yellow-100 text-yellow-800", icon: "📊" };
    return { level: "Standard", color: "bg-blue-100 text-blue-800", icon: "📝" };
  }, []);

  // Helper function to get full name from member profile
  const getFullName = useCallback((member) => {
    if (!member.member_profile) return "Unnamed Member";

    const { first_name, middle_name, last_name } = member.member_profile;
    const nameParts = [first_name, middle_name, last_name].filter(Boolean);
    return nameParts.join(" ").trim() || "Unnamed Member";
  }, []);

  // Helper function to get member ID
  const getMemberId = useCallback((member) => {
    return member.member_profile?.id_number || member.id;
  }, []);

  const fetchBenefitData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch benefit details
      const benefitResponse = await api.get(`/benefits/${benefitId}`);
      const benefitData = benefitResponse.data;
      setBenefit(benefitData);

      // Set barangay filter based on benefit target barangay
      if (benefitData.target_barangay && benefitData.target_barangay !== "All") {
        setBarangayFilter(benefitData.target_barangay);
      }

      // Fetch ALL members with member profiles
      const membersResponse = await api.get("/users?role=member");
      const membersData = membersResponse.data.data || membersResponse.data;

      // Fetch participants for this benefit
      const participantsResponse = await api.get(`/benefits/${benefitId}/participants`);

      // Fetch claims for this benefit
      const claimsResponse = await api.get("/benefit-records");
      const filteredClaims = claimsResponse.data.filter(
        (record) => record.benefit_id === benefitId
      );

      // Filter members who are participants in this benefit
      const participantUserIds = participantsResponse.data.map(p => p.user_id);
      const benefitParticipants = membersData.filter(member =>
        participantUserIds.includes(member.id)
      );

      // Get available members (non-participants who are approved) - EXCLUDING CURRENT PARTICIPANTS
      const nonParticipants = membersData
        .filter(member =>
          !participantUserIds.includes(member.id) &&
          member.status === 'approved'
        )
        .map(member => {
          const priorityData = calculatePriorityScore(member);
          const priorityLevel = getPriorityLevel(priorityData.percentageScore);

          return {
            ...member,
            fullName: getFullName(member),
            memberId: getMemberId(member),
            priorityData,
            priorityLevel
          };
        });

      setAvailableMembers(nonParticipants);

      // Combine participants with their claim status
      const combined = benefitParticipants.map(member => {
        const userClaim = filteredClaims.find(claim =>
          claim.user_id === member.id
        );

        return {
          ...member,
          hasClaimed: !!userClaim,
          claimDetails: userClaim || null,
          type: 'participant'
        };
      });

      setCombinedList(combined);

    } catch (err) {
      console.error(err);
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [benefitId, calculatePriorityScore, getPriorityLevel, getFullName, getMemberId]);

  useEffect(() => {
    fetchBenefitData();
  }, [fetchBenefitData]);

  // Add participants functionality using the correct endpoint
  const handleAddParticipants = async () => {
    if (selectedNewParticipants.length === 0) {
      showToast("Please select at least one member to add.", "error");
      return;
    }

    setAddingParticipants(true);
    try {
      // Use the dedicated addParticipants endpoint
      await api.post(`/benefits/${benefitId}/participants`, {
        user_ids: selectedNewParticipants
      });

      // Refresh the data
      await fetchBenefitData();

      // Close modal and reset selection
      setShowAddParticipants(false);
      setSelectedNewParticipants([]);
      setModalSearchTerm("");
      setModalFilters({ barangay: "", disability_type: "" });
      setModalSortBy("priority");

      // Show success message
      showToast(`Successfully added ${selectedNewParticipants.length} participants!`, "success");

    } catch (err) {
      console.error("Add participants error:", err);
      showToast("Failed to add participants. Please try again.", "error");
    } finally {
      setAddingParticipants(false);
    }
  };

  // Open remove confirmation modal
  const openRemoveModal = (member) => {
    setMemberToRemove(member);
    setShowRemoveModal(true);
  };

  // Close remove confirmation modal
  const closeRemoveModal = () => {
    setShowRemoveModal(false);
    setMemberToRemove(null);
    setRemovingParticipant(false);
  };

  // Remove participant - CORRECTED VERSION
  const handleRemoveParticipant = async () => {
    if (!memberToRemove) return;

    setRemovingParticipant(true);
    try {
      // Use the correct endpoint that exists in your backend
      await api.delete(`/benefits/${benefitId}/participants`, {
        data: {
          user_ids: [memberToRemove.id] // Send as array as expected by your backend
        }
      });

      // Refresh the data
      await fetchBenefitData();

      // Close modal and reset
      closeRemoveModal();

      // Show success message
      showToast("Participant removed successfully!", "success");

    } catch (err) {
      console.error("Remove participant error:", err);
      showToast("Failed to remove participant. Please try again.", "error");
      setRemovingParticipant(false);
    }
  };

  // Get unique barangays and disability types for modal filters
  const modalBarangays = [...new Set(availableMembers.map(member => member.member_profile?.barangay).filter(Boolean))].sort();
  const modalDisabilityTypes = [...new Set(availableMembers.map(member => member.member_profile?.disability_type).filter(Boolean))].sort();

  // Sort options for modal
  const modalSortOptions = [
    { value: "priority", label: "Priority Score (Highest First)" },
    { value: "name-asc", label: "Name (A-Z)" },
    { value: "name-desc", label: "Name (Z-A)" },
    { value: "severity", label: "Disability Severity" },
    { value: "income", label: "Monthly Income (Lowest First)" },
    { value: "dependants", label: "Number of Dependants" },
    { value: "barangay", label: "Barangay" },
  ];

  // Filter and sort available members for modal
  const filteredAvailableMembers = availableMembers
    .filter(member => {
      const fullName = getFullName(member).toLowerCase();
      const memberId = getMemberId(member).toString().toLowerCase();
      const barangay = member.member_profile?.barangay?.toLowerCase() || '';
      const disabilityType = member.member_profile?.disability_type?.toLowerCase() || '';
      const contactNumber = member.member_profile?.contact_number?.toLowerCase() || '';
      const severity = member.member_profile?.severity?.toLowerCase() || '';

      const matchesSearch =
        fullName.includes(modalSearchTerm.toLowerCase()) ||
        memberId.includes(modalSearchTerm.toLowerCase()) ||
        barangay.includes(modalSearchTerm.toLowerCase()) ||
        disabilityType.includes(modalSearchTerm.toLowerCase()) ||
        contactNumber.includes(modalSearchTerm.toLowerCase()) ||
        severity.includes(modalSearchTerm.toLowerCase());

      const matchesBarangay = !modalFilters.barangay || member.member_profile?.barangay === modalFilters.barangay;
      const matchesDisabilityType = !modalFilters.disability_type || member.member_profile?.disability_type === modalFilters.disability_type;

      return matchesSearch && matchesBarangay && matchesDisabilityType;
    })
    .sort((a, b) => {
      switch (modalSortBy) {
        case "priority":
          return b.priorityData.percentageScore - a.priorityData.percentageScore;
        case "name-asc":
          return a.fullName.localeCompare(b.fullName);
        case "name-desc":
          return b.fullName.localeCompare(a.fullName);
        case "severity":
          return (severityScores[b.member_profile?.severity?.toLowerCase()] || 0) -
            (severityScores[a.member_profile?.severity?.toLowerCase()] || 0);
        case "income":
          return (parseFloat(a.member_profile?.monthly_income) || Infinity) -
            (parseFloat(b.member_profile?.monthly_income) || Infinity);
        case "dependants":
          return (parseInt(b.member_profile?.dependants) || 0) -
            (parseInt(a.member_profile?.dependants) || 0);
        case "barangay":
          return (a.member_profile?.barangay || "").localeCompare(b.member_profile?.barangay || "");
        default:
          return b.priorityData.percentageScore - a.priorityData.percentageScore;
      }
    });

  // Apply search filter for main list
  const filteredMembers = combinedList.filter(member => {
    if (!search) return true;

    const fullName = `${member.member_profile?.first_name || ''} ${member.member_profile?.middle_name || ''} ${member.member_profile?.last_name || ''}`.toLowerCase();
    const barangay = member.member_profile?.barangay?.toLowerCase() || '';
    const username = member.username?.toLowerCase() || '';
    const guardianName = member.member_profile?.guardian_full_name?.toLowerCase() || '';

    return fullName.includes(search.toLowerCase()) ||
      barangay.includes(search.toLowerCase()) ||
      username.includes(search.toLowerCase()) ||
      guardianName.includes(search.toLowerCase());
  });

  // Apply barangay filter for main list
  const finalFilteredMembers = barangayFilter === "All"
    ? filteredMembers
    : filteredMembers.filter(member => member.member_profile?.barangay === barangayFilter);

  // Statistics
  const claimedCount = combinedList.filter(item => item.hasClaimed).length;
  const notClaimedCount = combinedList.length - claimedCount;

  // Format birthdate
  const formatBirthdate = (birthdate) => {
    if (!birthdate) return "—";
    return new Date(birthdate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate age from birthdate
  const calculateAge = (birthdate) => {
    if (!birthdate) return "—";
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
          <div className="w-20 h-20 border-8 border-purple-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-xl font-semibold text-blue-600 animate-pulse">
            Loading Data...
          </p>
          <p className="text-gray-600 text-sm">Please wait a moment 🧑‍🦽</p>
        </div>
      </Layout>
    );
  }

  if (error && !error.includes("Successfully")) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen text-red-600 font-bold text-lg">
          {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-10 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
            <div className="flex items-center gap-4">
              <FileText className="w-10 h-10 text-blue-600" />
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">
                  {benefit ? benefit.name : "Benefit Claims"}
                </h1>
                <h2 className="text-lg font-medium text-gray-600 mt-2 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  {benefit ? `Manage ${benefit.type} benefit` : "Review all claims for this benefit record."}
                </h2>
                {benefit && (
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="bg-blue-100 px-3 py-1 rounded-full">
                      Type: {benefit.type}
                    </span>
                    {benefit.budget_amount && (
                      <span className="bg-green-100 px-3 py-1 rounded-full">
                        Per Member: ₱{benefit.budget_amount}
                      </span>
                    )}
                    {benefit.budget_quantity && (
                      <span className="bg-purple-100 px-3 py-1 rounded-full">
                        Quantity: {benefit.budget_quantity} {benefit.unit}
                      </span>
                    )}
                    {benefit.target_barangay && benefit.target_barangay !== "All" && (
                      <span className="bg-orange-100 px-3 py-1 rounded-full">
                        Target Barangay: {benefit.target_barangay}
                      </span>
                    )}
                    <span className="bg-orange-100 px-3 py-1 rounded-full">
                      Total: {combinedList.length}
                    </span>
                    <span className="bg-green-100 px-3 py-1 rounded-full">
                      Claimed: {claimedCount}
                    </span>
                    <span className="bg-gray-100 px-3 py-1 rounded-full">
                      Not Claimed: {notClaimedCount}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowAddParticipants(true)}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors duration-200 font-medium"
              >
                <UserPlus className="w-5 h-5" />
                Add Participants
              </button>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-end gap-6">
              {/* Search */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Search Members
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, username, or guardian name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Barangay Filter */}
              <div className="w-full lg:w-64">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Filter by Barangay
                </label>
                <select
                  value={barangayFilter}
                  onChange={(e) => setBarangayFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="All">All Barangays</option>
                  {barangayOptions.filter(barangay => barangay !== "All").map(barangay => (
                    <option key={barangay} value={barangay}>
                      {barangay}
                    </option>
                  ))}
                </select>
              </div>

              {/* Print Button */}
              <Link
                to={`/print-benefits/${benefitId}`}
                state={{
                  benefit: benefit,
                  participants: finalFilteredMembers,
                  filters: {
                    search,
                    barangayFilter
                  },
                  statistics: {
                    total: combinedList.length,
                    claimed: claimedCount,
                    notClaimed: notClaimedCount
                  }
                }}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl transition-colors duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 no-underline"
              >
                <FileText className="w-4 h-4" />
                Print Report
              </Link>
            </div>

            {/* Active Filters */}
            <div className="flex flex-wrap gap-2 mt-4">
              {(search || barangayFilter !== "All") && (
                <span className="text-sm text-gray-600 font-medium">Active filters:</span>
              )}

              {search && (
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full flex items-center gap-2">
                  Search: "{search}"
                  <button onClick={() => setSearch("")} className="text-blue-600 hover:text-blue-800 font-bold">
                    ×
                  </button>
                </span>
              )}

              {barangayFilter !== "All" && (
                <span className="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full flex items-center gap-2">
                  Barangay: {barangayFilter}
                  <button onClick={() => setBarangayFilter("All")} className="text-purple-600 hover:text-purple-800 font-bold">
                    ×
                  </button>
                </span>
              )}

              {(search || barangayFilter !== "All") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setBarangayFilter("All");
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium underline"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Results Summary */}
          <div className="mb-4 text-sm text-gray-600 flex items-center gap-4">
            <span>
              Showing {finalFilteredMembers.length} of {combinedList.length} participants
            </span>
            {barangayFilter !== "All" && (
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                Filtered by: {barangayFilter}
              </span>
            )}
            {benefit?.target_barangay && benefit.target_barangay !== "All" && (
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                Benefit Target: {benefit.target_barangay}
              </span>
            )}
          </div>

          {/* Combined Participants & Claims List */}
          <section className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Participants & Claims Status</h2>
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                {combinedList.length} total
              </span>
              <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                {claimedCount} received
              </span>
              <span className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                {notClaimedCount} not received
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left border-collapse">
                <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white uppercase">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-2xl">Full Name</th>
                    <th className="px-6 py-4">Birthdate & Age</th>
                    <th className="px-6 py-4">Sex</th>
                    <th className="px-6 py-4">Guardian Name</th>
                    <th className="px-6 py-4">Disability Type</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Claim Date</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4 rounded-tr-2xl">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {finalFilteredMembers.length > 0 ? (
                    finalFilteredMembers.map((member) => (
                      <tr
                        key={member.id}
                        className={`border-b hover:bg-gray-50 transition ${member.hasClaimed ? 'bg-green-50' : 'bg-white'}`}
                      >
                        {/* Full Name */}
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {`${member.member_profile?.first_name || ''} ${member.member_profile?.middle_name || ''} ${member.member_profile?.last_name || ''}`.trim() || member.username}
                        </td>

                        {/* Birthdate & Age */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              {formatBirthdate(member.member_profile?.birthdate)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Age: {calculateAge(member.member_profile?.birthdate)}
                            </div>
                          </div>
                        </td>

                        {/* Sex */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {member.member_profile?.sex || "—"}
                          </span>
                        </td>

                        {/* Guardian Name */}
                        <td className="px-6 py-4 text-gray-700">
                          <div className="flex items-center gap-1">
                            <Heart className="w-3 h-3 text-gray-400" />
                            {member.member_profile?.guardian_full_name || "—"}
                          </div>
                        </td>


                        {/* Disability Type */}
                        <td className="px-6 py-4">
                          {member.member_profile?.disability_type ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              {member.member_profile.disability_type}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {member.hasClaimed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Check className="w-3 h-3" />
                              Received
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <X className="w-3 h-3" />
                              Not Received
                            </span>
                          )}
                        </td>

                        {/* Claim Date */}
                        <td className="px-6 py-4">
                          {member.hasClaimed && member.claimDetails?.claimed_at ? (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              {new Date(member.claimDetails.claimed_at).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="px-6 py-4">
                          {member.hasClaimed && member.claimDetails ? (
                            <div className="flex items-center gap-1 font-medium">
                              <DollarSign className="w-4 h-4 text-gray-500" />
                              {member.claimDetails.amount ? `$${member.claimDetails.amount}` : "—"}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          {!member.hasClaimed && (
                            <button
                              onClick={() => openRemoveModal(member)}
                              className="text-red-600 hover:text-red-800 font-medium text-sm transition-colors duration-200"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="10"
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-lg">No participants found</p>
                        <p className="text-sm text-gray-400">This benefit doesn't have any participants yet.</p>
                        <button
                          onClick={() => setShowAddParticipants(true)}
                          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add Participants
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Back Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate("/benefits/list")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Benefits
            </button>
          </div>
        </div>

        {/* Add Participants Modal */}
        {showAddParticipants && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserPlus className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-900">Add Participants</h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddParticipants(false);
                      setSelectedNewParticipants([]);
                      setModalSearchTerm("");
                      setModalFilters({ barangay: "", disability_type: "" });
                      setModalSortBy("priority");
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-gray-600 mt-2">
                  Select members to add as participants to this benefit. Only approved members not already in this benefit are shown.
                </p>
                {benefit?.target_barangay && benefit.target_barangay !== "All" && (
                  <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-sm text-orange-800 font-medium">
                      💡 This benefit is targeted for {benefit.target_barangay} barangay. 
                      Consider filtering by this barangay to see relevant members.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Search and Filters */}
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search members by name, member ID, barangay, disability type, or contact number..."
                      value={modalSearchTerm}
                      onChange={(e) => setModalSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Filters and Sort */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                      <select
                        value={modalFilters.barangay}
                        onChange={(e) => setModalFilters(prev => ({ ...prev, barangay: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">All Barangays</option>
                        {benefit?.target_barangay && benefit.target_barangay !== "All" && (
                          <option value={benefit.target_barangay}>
                            {benefit.target_barangay} (Target)
                          </option>
                        )}
                        {modalBarangays
                          .filter(barangay => barangay !== benefit?.target_barangay)
                          .map(barangay => (
                            <option key={barangay} value={barangay}>{barangay}</option>
                          ))
                        }
                      </select>
                    </div>

                    <div className="relative">
                      <Stethoscope className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                      <select
                        value={modalFilters.disability_type}
                        onChange={(e) => setModalFilters(prev => ({ ...prev, disability_type: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">All Disability Types</option>
                        {modalDisabilityTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div className="relative">
                      <TrendingUp className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                      <select
                        value={modalSortBy}
                        onChange={(e) => setModalSortBy(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {modalSortOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => {
                        setModalSearchTerm("");
                        setModalFilters({ barangay: "", disability_type: "" });
                        setModalSortBy("priority");
                      }}
                      className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear All
                    </button>
                  </div>

                  {/* Selection Controls */}
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          const allFilteredIds = filteredAvailableMembers.map(member => member.id);
                          setSelectedNewParticipants(allFilteredIds);
                        }}
                        className="text-sm bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        Select All on Page
                      </button>
                      <button
                        onClick={() => setSelectedNewParticipants([])}
                        className="text-sm bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >
                        Deselect All
                      </button>
                    </div>
                    <span className="text-sm text-gray-500 font-medium">
                      Showing {filteredAvailableMembers.length} of {availableMembers.length} available members
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 max-h-96 overflow-y-auto">
                {availableMembers.length > 0 ? (
                  <div className="space-y-3">
                    {filteredAvailableMembers.map(member => (
                      <div
                        key={member.id}
                        className={`flex items-start p-4 rounded-xl border-2 transition-all cursor-pointer group ${selectedNewParticipants.includes(member.id)
                            ? 'bg-blue-50 border-blue-500 shadow-sm'
                            : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-25'
                          }`}
                        onClick={() => {
                          setSelectedNewParticipants(prev =>
                            prev.includes(member.id)
                              ? prev.filter(id => id !== member.id)
                              : [...prev, member.id]
                          );
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedNewParticipants.includes(member.id)}
                          onChange={() => { }}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                        />
                        <div className="ml-4 flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">
                                {member.fullName}
                              </h3>
                              {member.member_profile?.contact_number && (
                                <p className="text-sm text-gray-600 mt-1">
                                  📞 {member.member_profile.contact_number}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                ID: {member.memberId}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${member.priorityLevel.color}`}>
                                {member.priorityLevel.icon} {member.priorityLevel.level}
                              </span>
                            </div>
                          </div>

                          {/* Priority Score Display */}
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-600">Priority Score:</span>
                              <span className="text-xs font-bold text-blue-700">
                                {member.priorityData.percentageScore}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${member.priorityData.percentageScore}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Member Details */}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {member.member_profile?.barangay && (
                              <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full font-medium ${
                                member.member_profile.barangay === benefit?.target_barangay 
                                  ? 'bg-orange-100 text-orange-800 border border-orange-300' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                <MapPin className="w-3 h-3 mr-1" />
                                {member.member_profile.barangay}
                                {member.member_profile.barangay === benefit?.target_barangay && " 🎯"}
                              </span>
                            )}
                            {member.member_profile?.disability_type && (
                              <span className="inline-flex items-center text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                <Stethoscope className="w-3 h-3 mr-1" />
                                {member.member_profile.disability_type}
                              </span>
                            )}
                            {member.member_profile?.severity && (
                              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                                {member.member_profile.severity}
                              </span>
                            )}
                            {member.member_profile?.monthly_income && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                ₱{parseFloat(member.member_profile.monthly_income).toLocaleString()}/mo
                              </span>
                            )}
                            {member.member_profile?.dependants && (
                              <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                                👥 {member.member_profile.dependants} dependants
                              </span>
                            )}
                            {member.priorityData.isSeniorCitizen && (
                              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                👵 Senior Citizen
                              </span>
                            )}
                            {member.priorityData.isSoloParent && (
                              <span className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded-full">
                                👨‍👦 Solo Parent
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg">No available members</p>
                    <p className="text-sm text-gray-400">All approved members are already participants in this benefit.</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-600">
                      {selectedNewParticipants.length} members selected
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowAddParticipants(false);
                        setSelectedNewParticipants([]);
                        setModalSearchTerm("");
                        setModalFilters({ barangay: "", disability_type: "" });
                        setModalSortBy("priority");
                      }}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddParticipants}
                      disabled={selectedNewParticipants.length === 0 || addingParticipants}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl transition-colors"
                    >
                      {addingParticipants ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Add Selected ({selectedNewParticipants.length})
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Remove Participant Confirmation Modal */}
        {showRemoveModal && memberToRemove && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
              <div className="p-6">
                {/* Warning Icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                </div>
                
                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                  Remove Participant
                </h3>
                
                {/* Message */}
                <div className="text-gray-600 text-center mb-6 space-y-3">
                  <p>
                    Are you sure you want to remove <span className="font-semibold text-gray-900">
                      {`${memberToRemove.member_profile?.first_name || ''} ${memberToRemove.member_profile?.last_name || ''}`.trim() || memberToRemove.username}
                    </span> from this benefit?
                  </p>
                  
                  {/* Member Details */}
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-left">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-500">Member ID:</span>
                        <p className="font-medium">{getMemberId(memberToRemove)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Barangay:</span>
                        <p className="font-medium">{memberToRemove.member_profile?.barangay || "—"}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Disability Type:</span>
                        <p className="font-medium">{memberToRemove.member_profile?.disability_type || "—"}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-red-600 font-medium text-sm">
                    ⚠️ This action cannot be undone. The member will need to be added again if needed.
                  </p>
                </div>
                
                {/* Buttons */}
                <div className="flex gap-3">
                  <button 
                    onClick={closeRemoveModal}
                    disabled={removingParticipant}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleRemoveParticipant}
                    disabled={removingParticipant}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {removingParticipant ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Removing...
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4" />
                        Remove Participant
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default BenefitsClaimRecord;