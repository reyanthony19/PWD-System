import React, { useEffect, useState } from "react";
import api from "./api";
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
import Layout from "./Layout";

function Dashboard() {
  const [members, setMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const COLORS = ["#10b981", "#ef4444", "#6b7280", "#f59e0b", "#3b82f6"];

  useEffect(() => {
    fetchMembers();
    fetchCurrentUser();
    const interval = setInterval(() => {
      fetchMembers();
      fetchCurrentUser();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await api.get("/users");
      setMembers(res.data.filter((user) => user.role === "member"));
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

  // Group by status
  const statusCounts = {
    Approved: members.filter((m) => m.status === "approved").length,
    Rejected: members.filter((m) => m.status === "rejected").length,
    Deceased: members.filter((m) => m.status === "deceased").length,
    Inactive: members.filter((m) => m.status === "inactive").length,
    Pending: members.filter((m) => m.status === "pending").length,
  };

  const chartData = Object.keys(statusCounts).map((status) => ({
    status,
    count: statusCounts[status],
  }));

  return (
    <Layout>
      <div className="p-6 bg-gray-100 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Overview Cards */}
          <section className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-800">
              Welcome, {currentUser?.username || "..."}
            </h2>
            <p className="text-gray-600 mt-2 mb-6">Members Overview</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.entries(statusCounts).map(([status, count], i) => {
                const colorClasses = {
                  Approved: "bg-green-100 text-green-700",
                  Pending: "bg-yellow-100 text-yellow-700",
                  Rejected: "bg-red-100 text-red-700",
                  Deceased: "bg-gray-200 text-gray-700",
                  Inactive: "bg-orange-100 text-orange-700",
                };
                return (
                  <div
                    key={status}
                    className={`p-4 rounded-lg text-center ${colorClasses[status]}`}
                  >
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm">{status}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Bar Chart */}
          <section className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Members by Status
            </h3>
            <div className="w-full h-80">
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

          {/* Pie Chart */}
          <section className="bg-white rounded-xl shadow p-6 col-span-1 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Status Distribution
            </h3>
            <div className="w-full h-[350px]">
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
                        key={index}
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
    </Layout>
  );
}

export default Dashboard;
