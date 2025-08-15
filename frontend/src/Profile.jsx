import React, { useEffect, useState } from "react";
import api from "./api";
import Header from "./Header";

function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get("/user").then((res) => setUser(res.data)).catch(console.error);
  }, []);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Profile</h2>
          <div className="space-y-3">
            <p><span className="font-semibold">Username:</span> {user.username}</p>
            <p><span className="font-semibold">Email:</span> {user.email}</p>
            <p><span className="font-semibold">Role:</span> {user.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
