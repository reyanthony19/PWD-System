import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, DollarSign, Clock, Users, Check, X, Calendar, Phone, Heart, Search, Download } from "lucide-react";
import Layout from "./Layout";
import api from "./api";

// Barangay options for consistent filtering
const barangayOptions = [
  "All", "Awang", "Bagocboc", "Barra", "Bonbon", "Cauyonan", "Igpit",
  "Limonda", "Luyong Bonbon", "Malanang", "Nangcaon", "Patag",
  "Poblacion", "Taboc", "Tingalan"
];

function BenefitsClaimRecord() {
  const { benefitId } = useParams();
  const [combinedList, setCombinedList] = useState([]);
  const [benefit, setBenefit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // filters
  const [search, setSearch] = useState("");
  const [barangayFilter, setBarangayFilter] = useState("All");
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch benefit details
        const benefitResponse = await api.get(`/benefits/${benefitId}`);
        setBenefit(benefitResponse.data);

        // Fetch ALL members with member profiles (similar to attendance component)
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

        // Combine participants with their claim status
        const combined = benefitParticipants.map(member => {
          // Find if this participant has a claim
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
    };
    fetchData();
  }, [benefitId]);

  // Apply search filter
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

  // Apply barangay filter
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

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Full Name", "Birthdate", "Age", "Sex", "Guardian Name", "Guardian Contact", "Disability Type", "Status", "Claim Date", "Amount"];
    const csvData = finalFilteredMembers.map(member => {
      const fullName = `${member.member_profile?.first_name || ""} ${member.member_profile?.middle_name || ""} ${member.member_profile?.last_name || ""}`.trim();
      const birthdate = member.member_profile?.birthdate || "—";
      const age = calculateAge(birthdate);
      const sex = member.member_profile?.sex || "—";
      const guardianName = member.member_profile?.guardian_full_name || "—";
      const guardianContact = member.member_profile?.guardian_contact_number || "—";
      const disabilityType = member.member_profile?.disability_type || "—";
      const status = member.hasClaimed ? "Received" : "Not Received";
      const claimDate = member.claimDetails?.claimed_at ? new Date(member.claimDetails.claimed_at).toLocaleDateString() : "—";
      const amount = member.claimDetails?.amount ? `$${member.claimDetails.amount}` : "—";

      return [
        `"${fullName}"`,
        birthdate !== "—" ? formatBirthdate(birthdate) : "—",
        age !== "—" ? age : "—",
        sex,
        `"${guardianName}"`,
        guardianContact,
        disabilityType,
        status,
        claimDate,
        amount
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `benefit-${benefit?.name || benefitId}-participants-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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

  if (error) {
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
              <div>
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
                        Budget: ${benefit.budget_amount}
                      </span>
                    )}
                    {benefit.budget_quantity && (
                      <span className="bg-purple-100 px-3 py-1 rounded-full">
                        Quantity: {benefit.budget_quantity} {benefit.unit}
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

              {/* Export Button */}
              <button
                onClick={exportToCSV}
                disabled={finalFilteredMembers.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl transition-colors duration-200 font-medium"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
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
                    <th className="px-6 py-4">Guardian Contact</th>
                    <th className="px-6 py-4">Disability Type</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Claim Date</th>
                    <th className="px-6 py-4 rounded-tr-2xl">Amount</th>
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

                        {/* Guardian Contact */}
                        <td className="px-6 py-4 text-gray-700">
                          {member.member_profile?.guardian_contact_number ? (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-gray-400" />
                              {member.member_profile.guardian_contact_number}
                            </div>
                          ) : (
                            "—"
                          )}
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
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="9"
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-lg">No participants found</p>
                        <p className="text-sm text-gray-400">This benefit doesn't have any participants yet.</p>
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
              onClick={() => navigate("/benefits")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Benefits
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default BenefitsClaimRecord;