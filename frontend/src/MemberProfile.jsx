import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "./api";
import Layout from "./Layout";

function MemberProfile() {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const res = await api.get(`/user/${id}`);
        console.log("✅ Full API response:", res.data);

        // Log documents only if role is member
        if (res.data.role === "member" && res.data.member_profile?.documents) {
          console.log("📂 Documents data:", res.data.member_profile.documents);
        } else {
          console.warn(
            `⚠️ No documents for this user (role: ${res.data.role})`
          );
        }

        setMember(res.data);
      } catch (err) {
        console.error("❌ Error fetching member:", err);
        setError(err.response?.data?.message || "Failed to load member profile.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      console.log("🔍 Fetching member with ID:", id);
      fetchMember();
    } else {
      setError("Invalid member ID.");
      setLoading(false);
    }
  }, [id]);

  if (loading)
    return (
      <Layout>
        <p className="p-6">Loading member profile...</p>
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

  // Role-based profile/documents
  const profile = member.role === "member" ? member.member_profile || {} : {};
  const documents =
    member.role === "member" ? profile.documents || {} : {};

  const fields = member.role === "member"
    ? [
        { label: "First Name", value: profile.first_name },
        { label: "Middle Name", value: profile.middle_name },
        { label: "Last Name", value: profile.last_name },
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
      ]
    : [];

  const docFields = member.role === "member"
    ? [
        { label: "Barangay Indigency", value: documents.barangay_indigency },
        { label: "Medical Certificate", value: documents.medical_certificate },
        { label: "2x2 Picture", value: documents.picture_2x2 },
        { label: "Birth Certificate", value: documents.birth_certificate },
      ]
    : [];

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 p-6">
            <h1 className="text-3xl font-bold text-white">
              {profile.first_name || member.username || "-"}{" "}
              {profile.last_name || ""}
            </h1>
            <p className="text-blue-100 capitalize">{member.role} Profile</p>
          </div>

          {/* Profile Information */}
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
            {fields.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fields.map((field, index) => (
                  <div key={index}>
                    <p className="text-gray-500 text-sm">{field.label}</p>
                    <p className="font-medium">{field.value || "-"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">
                No detailed profile available for this role.
              </p>
            )}
          </div>

          {/* Document Section (only for members) */}
          {member.role === "member" && (
            <div className="p-6 border-t">
              <h2 className="text-xl font-semibold mb-4">Documents</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {docFields.map((doc, index) => (
                  <div key={index}>
                    <p className="text-gray-500 text-sm mb-2">{doc.label}</p>
                    {doc.value ? (
                      <p className="font-medium text-gray-800 break-words">
                        {doc.value}
                      </p>
                    ) : (
                      <p className="text-gray-400 italic">Not uploaded</p>
                    )}
                  </div>
                ))}
              </div>
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
