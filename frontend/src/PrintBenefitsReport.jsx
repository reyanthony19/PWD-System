import { useEffect, useState, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "./api";

function PrintBenefitsReport() {
  const { benefitId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [benefit, setBenefit] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasPrintedRef = useRef(false); // ✅ persists across re-renders

  // Get data from location state
  const { 
    benefit: benefitFromState, 
    participants: participantsFromState,
    filters = {},
    statistics = {}
  } = location.state || {};

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Location state:", location.state);

        if (benefitFromState && participantsFromState) {
          // Use data passed from state
          console.log("Using data from state");
          setBenefit(benefitFromState);
          setParticipants(participantsFromState);
          setLoading(false);
        } else {
          console.log("Fetching fresh data from API");
          // Fetch fresh data
          const benefitResponse = await api.get(`/benefits/${benefitId}`);
          const participantsResponse = await api.get(`/benefits/${benefitId}/participants`);
          
          setBenefit(benefitResponse.data);
          
          // Process participants to include claim status
          const claimsResponse = await api.get("/benefit-records");
          const filteredClaims = claimsResponse.data.filter(
            (record) => record.benefit_id === parseInt(benefitId)
          );

          const processedParticipants = participantsResponse.data.map(participant => {
            const userClaim = filteredClaims.find(claim =>
              claim.user_id === participant.id
            );

            return {
              ...participant,
              hasClaimed: !!userClaim,
              claimDetails: userClaim || null
            };
          });

          setParticipants(processedParticipants);
          setLoading(false);
        }

        // ✅ Set Page Title dynamically
        document.title = `${benefitFromState?.name || 'Benefit'} Report - PDAO`;

        // ✅ Only trigger print ONCE
        if (!hasPrintedRef.current) {
          hasPrintedRef.current = true;
          setTimeout(() => {
            window.print();
          }, 500);

          const handleAfterPrint = () => {
            // ✅ Navigate back to participants page after printing
            navigate(`/benefits/${benefitId}/participants`, { replace: true });
          };

          window.addEventListener("afterprint", handleAfterPrint);

          return () => {
            window.removeEventListener("afterprint", handleAfterPrint);
          };
        }
        
      } catch (error) {
        console.error("Error loading print data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [benefitId, benefitFromState, participantsFromState, location.state, navigate]);

  // Calculate budget values based on benefit type
  const calculateBudgetValues = (benefitData, claimedCount, notClaimedCount) => {
    if (!benefitData) return { 
      perMember: 'N/A', 
      totalBudget: 'N/A',
      releasedBudget: 'N/A',
      remainingBudget: 'N/A'
    };
    
    const lockedMemberCount = benefitData.locked_member_count || 0;
    const isCash = benefitData.type?.toLowerCase() === 'cash';
    
    let perMember = 'N/A';
    let totalBudget = 'N/A';
    let releasedBudget = 'N/A';
    let remainingBudget = 'N/A';
    
    if (isCash) {
      // For cash benefits: use budget_amount
      const budgetAmount = benefitData.budget_amount;
      if (budgetAmount !== null && budgetAmount !== undefined) {
        const amount = parseFloat(budgetAmount);
        perMember = `₱${amount.toLocaleString()}`;
        totalBudget = `₱${(amount * lockedMemberCount).toLocaleString()}`;
        releasedBudget = `₱${(amount * claimedCount).toLocaleString()}`;
        remainingBudget = `₱${(amount * notClaimedCount).toLocaleString()}`;
      }
    } else {
      // For relief benefits: use budget_quantity
      const budgetQuantity = benefitData.budget_quantity;
      if (budgetQuantity !== null && budgetQuantity !== undefined) {
        const quantity = parseFloat(budgetQuantity);
        perMember = `${quantity.toLocaleString()} ${benefitData.unit || ''}`.trim();
        totalBudget = `${(quantity * lockedMemberCount).toLocaleString()} ${benefitData.unit || ''}`.trim();
        releasedBudget = `${(quantity * claimedCount).toLocaleString()} ${benefitData.unit || ''}`.trim();
        remainingBudget = `${(quantity * notClaimedCount).toLocaleString()} ${benefitData.unit || ''}`.trim();
      }
    }
    
    return { perMember, totalBudget, releasedBudget, remainingBudget };
  };

  // Add manual cancel button handler
  const handleCancel = () => {
    navigate(`/benefits/${benefitId}/participants`, { replace: true });
  };

  const formatBirthdate = (birthdate) => {
    if (!birthdate) return "—";
    try {
      return new Date(birthdate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return "—";
    }
  };

  const calculateAge = (birthdate) => {
    if (!birthdate) return "—";
    try {
      const today = new Date();
      const birthDate = new Date(birthdate);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch (e) {
      return "—";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Preparing report for printing...</p>
          <p className="text-sm text-gray-500">Loading data...</p>
        </div>
      </div>
    );
  }

  const displayParticipants = participantsFromState || participants;
  const displayBenefit = benefitFromState || benefit;
  
  // Calculate statistics if not provided
  const claimedCount = statistics.claimed || displayParticipants.filter(p => p.hasClaimed).length;
  const notClaimedCount = statistics.notClaimed || displayParticipants.filter(p => !p.hasClaimed).length;
  const totalCount = statistics.total || displayParticipants.length;

  // Calculate budget values including released budget
  const { perMember, totalBudget, releasedBudget, remainingBudget } = calculateBudgetValues(
    displayBenefit, 
    claimedCount, 
    notClaimedCount
  );

  return (
    <div className="p-8 bg-white print:p-0 print:bg-white">
      {/* Print-specific styles */}
      <style>
        {`
          @media print {
            @page {
              margin: 0.5in;
              size: letter;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background: white;
              font-family: Arial, sans-serif;
            }
            .no-print {
              display: none !important;
            }
            .print-break {
              page-break-after: always;
            }
            .print-break-avoid {
              page-break-inside: avoid;
            }
            .print-shadow {
              box-shadow: none !important;
            }
            .bg-blue-600 {
              background-color: #2563eb !important;
            }
            .bg-green-600 {
              background-color: #059669 !important;
            }
            .bg-red-600 {
              background-color: #dc2626 !important;
            }
            .bg-purple-600 {
              background-color: #7c3aed !important;
            }
            .bg-orange-600 {
              background-color: #ea580c !important;
            }
            .bg-indigo-600 {
              background-color: #4f46e5 !important;
            }
            .text-blue-100 {
              color: #dbeafe !important;
            }
          }
          .print-table {
            border-collapse: collapse;
            width: 100%;
            font-size: 11px;
          }
          .print-table th, .print-table td {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: left;
          }
          .print-table th {
            background-color: #2563eb !important;
            color: white !important;
            font-weight: bold;
          }
          .print-table tr:nth-child(even) {
            background-color: #f9fafb;
          }
        `}
      </style>

      {/* Cancel Button - Only visible when not printing */}
      <div className="no-print mb-4">
        <button
          onClick={handleCancel}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          ← Back to Participants
        </button>
      </div>

      {/* Header */}
      <div className="text-center mb-8 print-break-avoid">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 rounded-lg mb-4 print:bg-gradient-to-r print:from-blue-600 print:to-purple-600 print-shadow">
          <h1 className="text-3xl font-bold">{displayBenefit?.name || 'Benefit Report'}</h1>
          <p className="text-blue-100 text-lg mt-2">
            Participants and Claims Report • {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-6 gap-4 mb-6 print-break-avoid">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 print-shadow">
            <div className="text-2xl font-bold text-blue-600">{totalCount}</div>
            <div className="text-sm text-blue-800">Total Participants</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500 print-shadow">
            <div className="text-2xl font-bold text-green-600">{claimedCount}</div>
            <div className="text-sm text-green-800">Claimed</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500 print-shadow">
            <div className="text-2xl font-bold text-red-600">{notClaimedCount}</div>
            <div className="text-sm text-red-800">Not Claimed</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500 print-shadow">
            <div className="text-2xl font-bold text-purple-600">
              {perMember}
            </div>
            <div className="text-sm text-purple-800">Per Member</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500 print-shadow">
            <div className="text-2xl font-bold text-orange-600">
              {releasedBudget}
            </div>
            <div className="text-sm text-orange-800">Released Budget</div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500 print-shadow">
            <div className="text-2xl font-bold text-indigo-600">
              {remainingBudget}
            </div>
            <div className="text-sm text-indigo-800">Remaining Budget</div>
          </div>
        </div>

        {/* Benefit Details */}
        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 mb-6 print-break-avoid print-shadow">
          <div className="grid grid-cols-2 gap-4">
            <div><strong>Benefit Type:</strong> {displayBenefit?.type || 'N/A'}</div>
            <div><strong>Per Member:</strong> {perMember}</div>
            <div><strong>Total Budget:</strong> {totalBudget}</div>
            <div><strong>Released Budget:</strong> {releasedBudget}</div>
            <div><strong>Remaining Budget:</strong> {remainingBudget}</div>
            <div><strong>Status:</strong> {displayBenefit?.status || 'N/A'}</div>
            <div><strong>Locked Members:</strong> {displayBenefit?.locked_member_count || 0}</div>
          </div>
          {(filters.search || filters.barangayFilter !== "All") && (
            <div className="mt-3 pt-3 border-t border-gray-300">
              <strong>Active Filters:</strong> 
              {filters.search && ` Search: "${filters.search}"`}
              {filters.barangayFilter !== "All" && ` Barangay: ${filters.barangayFilter}`}
            </div>
          )}
        </div>
      </div>

      {/* Participants Table */}
      <div className="print-break-avoid">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">
          Participants List ({displayParticipants.length} records)
        </h2>
        
        {displayParticipants.length === 0 ? (
          <div className="text-center py-8 bg-yellow-50 rounded-lg">
            <p className="text-yellow-800 font-medium">No participants found for this benefit.</p>
          </div>
        ) : (
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: '20%' }}>Full Name</th>
                <th style={{ width: '12%' }}>Birthdate</th>
                <th style={{ width: '8%' }}>Age</th>
                <th style={{ width: '12%' }}>Barangay</th>
                <th style={{ width: '15%' }}>Disability Type</th>
                <th style={{ width: '10%' }}>Status</th>
                <th style={{ width: '13%' }}>Claim Date</th>
                <th style={{ width: '10%' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {displayParticipants.map((member, index) => {
                const profile = member.member_profile || {};
                const fullName = `${profile.first_name || ''} ${profile.middle_name || ''} ${profile.last_name || ''}`.trim() || member.username || 'Unnamed Member';
                
                return (
                  <tr key={member.id || index}>
                    <td className="font-medium">{fullName}</td>
                    <td>{formatBirthdate(profile.birthdate)}</td>
                    <td>{calculateAge(profile.birthdate)}</td>
                    <td>{profile.barangay || '—'}</td>
                    <td>{profile.disability_type || '—'}</td>
                    <td>
                      <span className={member.hasClaimed ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                        {member.hasClaimed ? '✓ Received' : '✗ Not Received'}
                      </span>
                    </td>
                    <td>
                      {member.hasClaimed && member.claimDetails?.claimed_at 
                        ? new Date(member.claimDetails.claimed_at).toLocaleDateString() 
                        : '—'
                      }
                    </td>
                    <td className="font-medium">
                      {member.hasClaimed && member.claimDetails?.amount 
                        ? `₱${member.claimDetails.amount}` 
                        : '—'
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500 print-break-avoid">
        <p>Generated on {new Date().toLocaleString()} • {displayParticipants.length} participants</p>
        <p className="mt-1">Official Document - PDAO Benefits Management System</p>
        <p className="mt-1">Page 1 of 1</p>
      </div>
    </div>
  );
}

export default PrintBenefitsReport;