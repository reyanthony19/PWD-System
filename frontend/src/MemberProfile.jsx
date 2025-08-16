import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "./api";
import Layout from "./Layout"; // ✅ Use Layout instead of manually adding Header

function MemberProfile() {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const res = await api.get(`/user/${id}`);
        setMember(res.data);
      } catch (err) {
        console.error("Error fetching member:", err);
        setError(err.response?.data?.message || "Failed to load member profile.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMember();
    } else {
      setError("Invalid member ID.");
      setLoading(false);
    }
  }, [id]);

  if (loading) return <Layout><p className="p-6">Loading member profile...</p></Layout>;
  if (error) return <Layout><p className="p-6 text-red-600">{error}</p></Layout>;
  if (!member) return <Layout><p className="p-6">No member data found.</p></Layout>;

  const profile = member.member_profile || {};

  const fields = [
    { label: "First Name", value: profile.first_name },
    { label: "Middle Name", value: profile.middle_name },
    { label: "Last Name", value: profile.last_name },
    { label: "ID Number", value: profile.id_number },
    { label: "Guardian", value: profile.Guardian },
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
  ];

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-blue-600 p-6">
            <h1 className="text-3xl font-bold text-white">
              {profile.first_name || "-"} {profile.last_name || "-"}
            </h1>
            <p className="text-blue-100">Member Profile</p>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map((field, index) => (
              <div key={index}>
                <p className="text-gray-500 text-sm">{field.label}</p>
                <p className="font-medium">{field.value || "-"}</p>
              </div>
            ))}
          </div>

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
