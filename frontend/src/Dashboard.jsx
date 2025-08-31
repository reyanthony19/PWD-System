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
import Footer from "./Footer";

// 🎨 Sky Blue Theme (same as Header)
const theme = {
  primary: "from-sky-600 to-sky-400",
  primaryText: "text-sky-600",
  secondaryText: "text-sky-400",
  cardBg: "bg-white",
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

  // ✅ Group by status
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
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
          <div className="w-20 h-20 border-8 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-xl font-semibold text-sky-600 animate-pulse">
            Loading Dashboard...
          </p>
          <p className="text-gray-600 text-sm">Please wait a moment 🧑‍🦽</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        {/* Hero Section */}
        <section
          className={`relative bg-gradient-to-r ${theme.primary} text-white py-16 px-6 text-center shadow`}
        >
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 drop-shadow-md">
            Welcome, {currentUser?.username || "..."}
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl opacity-90">
            Here’s an overview of member statistics and status distribution.
          </p>
        </section>

        <div className="p-6 max-w-7xl mx-auto -mt-12 relative z-10">
          {/* Overview Cards */}
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
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
                  className={`p-6 rounded-xl text-center shadow-md hover:shadow-lg transition ${colorClasses[status]}`}
                >
                  <p className="text-3xl font-bold">{count}</p>
                  <p className="text-sm font-medium">{status}</p>
                </div>
              );
            })}
          </section>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Bar Chart */}
            <section className={`${theme.cardBg} rounded-xl shadow p-6`}>
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
                    <Bar
                      dataKey="count"
                      fill={theme.chartColors[0]} // Primary chart color
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Pie Chart */}
            <section className={`${theme.cardBg} rounded-xl shadow p-6`}>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Status Distribution
              </h3>
              <div className="w-full h-80">
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
                          fill={
                            theme.chartColors[index % theme.chartColors.length]
                          }
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

        {/* ✅ Reusable Footer */}
        <Footer />
      </div>
    </Layout>
  );
}

export default Dashboard;
