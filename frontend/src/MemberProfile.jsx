import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "./api";
import Layout from "./Layout";

function MemberProfile() {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔹 Define API URL (set REACT_APP_API_URL in .env)
  const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

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

  if (loading)
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 text-sky-600">
          <div className="w-16 h-16 border-8 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-xl font-semibold animate-pulse">
            Loading Member Profile...
          </p>
          <p className="text-gray-600 text-sm">Please wait a moment 🧑‍🦽</p>
        </div>
      </Layout>
    );

  if (error)
    return (
      <Layout>
        <p className="p-6 text-red-600">{error}</p>
      </Layout>
    );

  if (!member)
    return (
      <Layout>
        <p className="p-6">No member data found.</p>
      </Layout>
    );

  const profile = member.role === "member" ? member.member_profile || {} : {};
  const fullName = [profile.first_name, profile.middle_name, profile.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  // 🔹 Documents (object with filenames)
  const docs = profile.documents || {};

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-sky-700 p-6">
            <h1 className="text-3xl font-bold text-white">
              {fullName || member.username || "-"}
            </h1>
            <p className="text-blue-100 capitalize">{member.role} Profile</p>
          </div>

          {/* Personal Information */}
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-sky-700">
              Personal Information
            </h2>
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
              ].map((f, i) => (
                <div key={i}>
                  <p className="text-gray-500 text-sm">{f.label}</p>
                  <p className="font-medium">{f.value || "-"}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 📂 Documents Section */}
          {Object.values(docs).some(Boolean) && (
            <div className="p-6 border-t">
              <h2 className="text-xl font-semibold mb-4 text-sky-700">Documents</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Barangay Indigency", file: docs.barangay_indigency },
                  { label: "Medical Certificate", file: docs.medical_certificate },
                  { label: "2x2 Picture", file: docs.picture_2x2 },
                  { label: "Birth Certificate", file: docs.birth_certificate },
                ].map(
                  (doc, i) =>
                    doc.file && (
                      <div
                        key={i}
                        className="border rounded-lg overflow-hidden shadow-sm"
                      >
                        <img
                          src={
                            doc.file.startsWith("http")
                              ? doc.file
                              : `${API_URL}/storage/${doc.file}`
                          }
                          alt={doc.label}
                          className="w-full h-48 object-cover hover:scale-105 transition"
                        />
                        <div className="p-2 text-center text-sm text-gray-600">
                          {doc.label}
                        </div>
                      </div>
                    )
                )}
              </div>
            </div>
          )}

          {/* ✅ Print Button */}
          {member.role === "member" && (
            <div className="p-6 border-t">
              <Link to={`/print/${member.id}`} state={{ member }}>
                <button className="no-print mt-4 bg-sky-600 text-white px-4 py-2 rounded shadow hover:bg-sky-900">
                  🖨️ Print ID
                </button>
              </Link>
            </div>
          )}

          {/* Footer */}
          <div className="p-6 border-t flex justify-between items-center">
            <Link
              to="/member"
              className="text-blue-600 hover:underline font-medium"
            >
              ← Back to List
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default MemberProfile;
