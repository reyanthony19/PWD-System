import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, DollarSign, Clock } from "lucide-react";
import Layout from "./Layout";
import api from "./api";

function BenefitsClaimRecord() {
  const { benefitId } = useParams();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        setLoading(true);
        const response = await api.get("/benefit-records");

        const filteredClaims = response.data.filter(
          (record) => record.benefit_id === benefitId
        );

        setClaims(filteredClaims);
      } catch (err) {
        console.error(err);
        setError("Failed to load claims.");
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
  }, [benefitId]);

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
          <div className="w-20 h-20 border-8 border-purple-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-xl font-semibold text-blue-600 animate-pulse">
            Loading Claims...
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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
            <div className="flex items-center gap-4">
              <FileText className="w-10 h-10 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Benefit Claims
                </h1>
                <h2 className="text-lg font-medium text-gray-600 mt-2 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Review all claims for this benefit record.
                </h2>
              </div>
            </div>
          </div>

          {/* Claims Table */}
          <section className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left border-collapse">
                <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white uppercase">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-2xl">ID</th>
                    <th className="px-6 py-4">Member</th>
                    <th className="px-6 py-4">Claim Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 rounded-tr-2xl">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.length > 0 ? (
                    claims.map((claim) => (
                      <tr
                        key={claim.id}
                        className="odd:bg-gray-50 even:bg-gray-100 hover:bg-blue-50 transition cursor-pointer"
                        onClick={() =>
                          navigate(`/benefit-records/claim/${claim.id}`)
                        }
                      >
                        <td className="px-6 py-4">{claim.id}</td>
                        <td className="px-6 py-4">{claim.member_name}</td>
                        <td className="px-6 py-4">
                          {claim.claimed_at
                            ? new Date(claim.claimed_at).toLocaleDateString(
                                [],
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )
                            : "—"}
                        </td>
                        <td
                          className={`px-6 py-4 font-semibold ${
                            claim.status === "claimed"
                              ? "text-green-600"
                              : claim.status === "pending"
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {claim.status.charAt(0).toUpperCase() +
                            claim.status.slice(1)}
                        </td>
                        <td className="px-6 py-4 flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          {claim.amount ? `$${claim.amount}` : "—"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        🚫 No claims found.
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
