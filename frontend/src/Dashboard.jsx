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

// 🎨 Sky Blue Theme
const theme = {
  primary: "from-sky-600 to-sky-400",
  primaryText: "text-sky-600",
  secondaryText: "text-sky-400",
  cardBg: "bg-white",
  footerBg: "bg-sky-700",
  chartColors: ["#0ea5e9", "#38bdf8", "#7dd3fc", "#0284c7", "#0369a1"],
};

function Dashboard() {
  const [members, setMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchMembers(), fetchCurrentUser()]);
      } catch (err) {
        console.error("Error loading dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 50000);
    return () => clearInterval(interval);
  }, []);

  const fetchMembers = async () => {
    const res = await api.get("/users");
    setMembers(res.data.filter((user) => user.role === "member"));
  };

  const fetchCurrentUser = async () => {
    const res = await api.get("/user");
    setCurrentUser(res.data);
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

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-sky-700">
          <div className="w-20 h-20 border-8 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-xl font-semibold animate-pulse">
            Loading Dashboard...
          </p>
          <p className="text-gray-600 text-sm">Please wait a moment ⏳</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`p-6 min-h-screen bg-gradient-to-br ${theme.primary} bg-opacity-10`}>
        <h1 className={`text-3xl font-bold mb-6 ${theme.primaryText}`}>
          Dashboard
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Overview Cards */}
          <section className={`${theme.cardBg} rounded-xl shadow p-6`}>
            <h2 className={`text-xl font-bold ${theme.primaryText}`}>
              Welcome, {currentUser?.username || "..."}
            </h2>
            <p className="text-gray-600 mt-2 mb-6">Members Overview</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.entries(statusCounts).map(([status, count]) => {
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
          <section className={`${theme.cardBg} rounded-xl shadow p-6`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme.primaryText}`}>
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
                  <Bar dataKey="count" fill={theme.chartColors[0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Pie Chart */}
          <section className={`${theme.cardBg} rounded-xl shadow p-6 col-span-1 lg:col-span-2`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme.primaryText}`}>
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
                        fill={theme.chartColors[index % theme.chartColors.length]}
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

        {/* Footer */}
        <footer className={`${theme.footerBg} text-white mt-12 p-6 rounded-xl shadow`}>
          <p className="text-center text-sm">
            © {new Date().getFullYear()} Your Organization. All rights reserved.
          </p>
        </footer>
      </div>
    </Layout>
  );
}

export default Dashboard;
