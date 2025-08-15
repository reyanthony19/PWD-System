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
  PieChart,
  Pie,
  Cell,
} from "recharts";

function Dashboard() {
  const [members, setMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [trendData, setTrendData] = useState([]);

  const COLORS = ["#10b981", "#ef4444", "#6b7280", "#f59e0b", "#3b82f6"];

  useEffect(() => {
    fetchMembers();
    fetchCurrentUser();
    fetchTrends();

    const interval = setInterval(() => {
      fetchMembers();
      fetchCurrentUser();
      fetchTrends();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await api.get("/users");
      const allMembers = res.data.filter((user) => user.role === "member");
      setMembers(allMembers);
    } catch (err) {
      console.error("Error loading members:", err);
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

  const fetchTrends = async () => {
    try {
      const res = await api.get("/members/status-trends");
      setTrendData(res.data);
    } catch (err) {
      console.error("Error fetching trends:", err);
    }
  };

  // Group by status
  const statusCounts = {
    Approved: members.filter((m) => m.status === "approved").length,
    Rejected: members.filter((m) => m.status === "rejected").length,
    Deceased: members.filter((m) => m.status === "deceased").length,
    Inactive: members.filter((m) => m.status === "inactive").length,
    Pending: members.filter((m) => m.status === "pending").length,
  };

  const totalMembers = members.length;
  const activeMembers = statusCounts["Approved"];

  const chartData = Object.keys(statusCounts).map((status) => ({
    status,
    count: statusCounts[status],
  }));

  return (
    <>
      <Header />

      <div className="min-h-screen bg-gray-100">
        {/* Main container now uses almost full screen width */}
        <div className="max-w-[95%] mx-auto px-8 py-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Summary Overview */}
          <section className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-800">
              Welcome, {currentUser?.username || "..."}
            </h2>
            <h3 className="text-lg font-semibold text-gray-600 mt-2 mb-4">
              Members Overview
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-blue-100 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-700">{totalMembers}</p>
                <p className="text-sm text-gray-600">Total Members</p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-700">{activeMembers}</p>
                <p className="text-sm text-gray-600">Active (Approved)</p>
              </div>
              <div className="bg-yellow-100 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-yellow-700">{statusCounts["Pending"]}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
              <div className="bg-red-100 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-700">{statusCounts["Rejected"]}</p>
                <p className="text-sm text-gray-600">Rejected</p>
              </div>
              <div className="bg-gray-200 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-700">{statusCounts["Deceased"]}</p>
                <p className="text-sm text-gray-600">Deceased</p>
              </div>
              <div className="bg-orange-100 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-orange-700">{statusCounts["Inactive"]}</p>
                <p className="text-sm text-gray-600">Inactive</p>
              </div>
            </div>
          </section>

          {/* Members Status - Bar Chart */}
          <section className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Members by Status (Bar Chart)
            </h3>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Members Status - Pie Chart */}
          <section className="bg-white rounded-xl shadow p-6 col-span-1 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Status Distribution (Pie Chart)
            </h3>
            <div style={{ width: "100%", height: 350 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label
                  >
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
