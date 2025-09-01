import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "./Layout";
import api from "./api"; // Ensure your API endpoint matches the new controller

const theme = {
  primaryText: "text-yellow-600",
  cardBg: "bg-white",
  footerBg: "bg-yellow-700",
};

function BenefitsClaimRecord() {
  const { benefitId } = useParams(); // Get benefit ID from URL
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        setLoading(true);
        const response = await api.get("/benefit-records");

        // Filter the records for this benefit
        const filteredClaims = response.data.filter(record => record.benefit_id === benefitId);

        // Then set to state
        setClaims(filteredClaims);
        
        setClaims(response.data); // Expected: [{ id, member_name, status, claimed_at, amount }]
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
  }, [benefitId]);

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-yellow-600">
          <div className="w-20 h-20 border-8 border-yellow-200 border-t-yellow-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-xl font-semibold animate-pulse">Loading Claims...</p>
          <p className="text-gray-600 text-sm">Please wait a moment 🧑‍🦽</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 bg-gray-100 min-h-screen">
        <h1 className={`text-3xl font-bold ${theme.primaryText} mb-2`}>
          📝 Benefit Claims
        </h1>
        <p className="text-gray-600 mb-6">
          Review all claims for this benefit record.
        </p>

        <div className={`${theme.cardBg} overflow-x-auto rounded-xl shadow border border-gray-200`}>
          <table className="min-w-full text-base text-left">
            <thead className={`${theme.footerBg} text-white uppercase`}>
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Claim Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {claims.length > 0 ? (
                claims.map((claim) => (
                  <tr
                    key={claim.id}
                    className="odd:bg-gray-50 even:bg-gray-100 hover:bg-yellow-50 cursor-pointer transition hover:scale-[.99]"
                    onClick={() => navigate(`/benefit-records/claim/${claim.id}`)} // Link to claim detail
                  >
                    <td className="px-4 py-3">{claim.id}</td>
                    <td className="px-4 py-3">{claim.member_name}</td>
                    <td className="px-4 py-3">
                      {claim.claimed_at ? new Date(claim.claimed_at).toLocaleDateString() : "-"}
                    </td>
                    <td className={`px-4 py-3 font-semibold ${claim.status === "claimed" ? "text-green-600" :
                      claim.status === "pending" ? "text-yellow-600" :
                        "text-red-600"
                      }`}>
                      {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                    </td>
                    <td className="px-4 py-3">{claim.amount ? `$${claim.amount}` : "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-600 text-lg">
                    🚫 No claims found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

export default BenefitsClaimRecord;
