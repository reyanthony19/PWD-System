import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "./api";

function MemberProfile() {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const res = await api.get(`/users/${id}`);
        setMember(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMember();
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!member) return <div className="p-6">Member not found.</div>;

  const profile = member.member_profile || {};

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">
        {profile.first_name} {profile.last_name}
      </h1>
      <p><strong>Username:</strong> {member.username}</p>
      <p><strong>Email:</strong> {member.email}</p>
      <p><strong>Contact:</strong> {profile.contact_number || "-"}</p>
      <p><strong>Address:</strong> {profile.address || "-"}</p>
      <p><strong>Status:</strong> {member.status}</p>
      <Link to="/" className="text-blue-500 mt-4 inline-block">← Back to List</Link>
    </div>
  );
}

export default MemberProfile;
