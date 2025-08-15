import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "./api";
import Header from "./Header";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function Dashboard() {
  const [admins, setAdmins] = useState([]);
  const [staff, setStaff] = useState([]);
  const [members, setMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();

    const interval = setInterval(() => {
      fetchUsers();
      fetchCurrentUser();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      const allUsers = res.data;
      setAdmins(allUsers.filter((user) => user.role === "admin"));
      setStaff(allUsers.filter((user) => user.role === "staff"));
      setMembers(allUsers.filter((user) => user.role === "member"));
    } catch (err) {
      console.error("Error loading users:", err);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get("/user");
      setCurrentUser(res.data);
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  };

  const chartData = [
    { role: "Admins", count: admins.length },
    { role: "Staff", count: staff.length },
    { role: "Members", count: members.length },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Quick Actions */}
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-800">
            Welcome, {currentUser?.username || "..."}
          </h2>
          <h3 className="text-lg font-semibold text-gray-600 mt-2 mb-4">
            Quick Actions
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to="/announcements"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
            >
              📢 Post Announcement
            </Link>
            <Link
              to="/staff"
              className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
            >
              👨‍💼 Manage Staff
            </Link>
            <Link
              to="/members"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow hover:bg-purple-700 transition"
            >
              👥 Manage Members
            </Link>
            <Link
              to="/events"
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow hover:bg-yellow-600 transition"
            >
              📅 Manage Events
            </Link>
          </div>

          <button
            onClick={async () => {
              try {
                await api.post("/logout");
                window.location.href = "/login";
              } catch (err) {
                console.error("Logout failed", err);
              }
            }}
            className="mt-6 w-full bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700 transition"
          >
            🚪 Logout
          </button>
        </section>

        {/* Users Chart */}
        <section className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Users</h3>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="role" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
