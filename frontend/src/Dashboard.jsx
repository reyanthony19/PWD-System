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
  chartColors: ["#0ea5e9", "#38bdf8", "#7dd3fc", "#0284c7", "#0369a1", "#0c4a6e", "#38a169", "#d69e2e", "#e53e3e", "#805ad5"],
};

// Common disability types with colors
const disabilityTypes = {
  physical: { name: "Physical Disability", color: "#0ea5e9" },
  visual: { name: "Visual Impairment", color: "#38bdf8" },
  hearing: { name: "Hearing Impairment", color: "#7dd3fc" },
  intellectual: { name: "Intellectual Disability", color: "#0284c7" },
  mental: { name: "Mental Health", color: "#0369a1" },
  neurological: { name: "Neurological", color: "#0c4a6e" },
  multiple: { name: "Multiple Disabilities", color: "#38a169" },
  other: { name: "Other", color: "#d69e2e" }
};

function Dashboard() {
  const [members, setMembers] = useState([]);
  const [memberProfiles, setMemberProfiles] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchMembers(), fetchMemberProfiles(), fetchCurrentUser()]);
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

  const fetchMemberProfiles = async () => {
    try {
      const res = await api.get("/member-profiles");
      setMemberProfiles(res.data);
    } catch (err) {
      console.error("Error fetching member profiles:", err);
      setMemberProfiles([]);
    }
  };

  const fetchCurrentUser = async () => {
    const res = await api.get("/user");
    setCurrentUser(res.data);
  };

  // ✅ Group by disability_type from member_profiles
  const getDisabilityStats = () => {
    const disabilityCounts = {};
    
    memberProfiles.forEach(profile => {
      // Handle different possible formats of disability_type
      let disabilityType = 'other';
      
      if (profile.disability_type) {
        if (Array.isArray(profile.disability_type)) {
          // If it's an array/tuple, use the first one or join them
          disabilityType = profile.disability_type[0] || 'other';
        } else if (typeof profile.disability_type === 'string') {
          disabilityType = profile.disability_type;
        }
      }
      
      // Normalize the disability type
      disabilityType = disabilityType.toLowerCase().trim();
      
      // Map to known types or keep as is
      if (!disabilityTypes[disabilityType]) {
        // If it's not in our known types, check if it contains keywords
        if (disabilityType.includes('physical')) disabilityType = 'physical';
        else if (disabilityType.includes('visual') || disabilityType.includes('see')) disabilityType = 'visual';
        else if (disabilityType.includes('hear')) disabilityType = 'hearing';
        else if (disabilityType.includes('intellectual') || disabilityType.includes('learning')) disabilityType = 'intellectual';
        else if (disabilityType.includes('mental')) disabilityType = 'mental';
        else if (disabilityType.includes('neuro')) disabilityType = 'neurological';
        else if (disabilityType.includes('multiple')) disabilityType = 'multiple';
        else disabilityType = 'other';
      }
      
      disabilityCounts[disabilityType] = (disabilityCounts[disabilityType] || 0) + 1;
    });

    return Object.entries(disabilityCounts).map(([type, count]) => ({
      type,
      name: disabilityTypes[type]?.name || type.charAt(0).toUpperCase() + type.slice(1),
      count,
      color: disabilityTypes[type]?.color || "#d69e2e"
    })).sort((a, b) => b.count - a.count); // Sort by count descending
  };

  // ✅ Get member status counts
  const getStatusCounts = () => {
    const statusCounts = {
      Approved: members.filter((m) => m.status === "approved").length,
      Rejected: members.filter((m) => m.status === "rejected").length,
      Deceased: members.filter((m) => m.status === "deceased").length,
      Inactive: members.filter((m) => m.status === "inactive").length,
      Pending: members.filter((m) => m.status === "pending").length,
    };
    return statusCounts;
  };

  // ✅ Cross-analysis: Disability types by status
  const getDisabilityByStatus = () => {
    const disabilityByStatus = {};
    const statuses = ['approved', 'pending', 'rejected', 'inactive', 'deceased'];
    const disabilityStats = getDisabilityStats();

    statuses.forEach(status => {
      disabilityByStatus[status] = {};
      
      disabilityStats.forEach(disability => {
        // Count members with this disability type and status
        const count = memberProfiles.filter(profile => {
          const member = members.find(m => m.id === profile.user_id);
          if (!member) return false;
          
          let profileDisabilityType = 'other';
          if (profile.disability_type) {
            if (Array.isArray(profile.disability_type)) {
              profileDisabilityType = profile.disability_type[0] || 'other';
            } else {
              profileDisabilityType = profile.disability_type;
            }
          }
          
          profileDisabilityType = profileDisabilityType.toLowerCase().trim();
          return member.status === status && profileDisabilityType === disability.type;
        }).length;
        
        disabilityByStatus[status][disability.type] = count;
      });
    });

    return disabilityByStatus;
  };

  const disabilityStats = getDisabilityStats();
  const statusCounts = getStatusCounts();
  const disabilityByStatus = getDisabilityByStatus();

  // Data for status charts
  const statusChartData = Object.keys(statusCounts).map((status) => ({
    status,
    count: statusCounts[status],
  }));

  // Data for stacked bar chart (disability by status)
  const stackedChartData = Object.entries(disabilityByStatus).map(([status, disabilities]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    ...disabilities
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
            Here's an overview of member statistics and disability distribution.
          </p>
        </section>

        <div className="p-6 max-w-7xl mx-auto -mt-12 relative z-10">
          {/* Overview Cards - Status */}
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

          {/* Disability Statistics Cards */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Disability Type Statistics 
              <span className="text-sm font-normal text-gray-600 ml-2">
                (from {memberProfiles.length} member profiles)
              </span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {disabilityStats.length > 0 ? (
                disabilityStats.map((disability, index) => (
                  <div
                    key={disability.type}
                    className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition"
                    style={{ borderLeft: `4px solid ${disability.color}` }}
                  >
                    <p className="text-3xl font-bold text-gray-800">{disability.count}</p>
                    <p className="text-sm font-medium text-gray-600">{disability.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {memberProfiles.length > 0 ? ((disability.count / memberProfiles.length) * 100).toFixed(1) : 0}% of profiles
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-4 text-center p-8 bg-gray-100 rounded-xl">
                  <p className="text-gray-500">No disability data available from member profiles</p>
                </div>
              )}
            </div>
          </section>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Bar Chart - Members by Disability Type */}
            <section className={`${theme.cardBg} rounded-xl shadow p-6`}>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Members by Disability Type
              </h3>
              <div className="w-full h-80">
                {disabilityStats.length > 0 ? (
                  <ResponsiveContainer>
                    <BarChart data={disabilityStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80} 
                        interval={0}
                      />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="count"
                        fill={theme.chartColors[0]}
                        radius={[8, 8, 0, 0]}
                        name="Number of Members"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No disability data available
                  </div>
                )}
              </div>
            </section>

            {/* Pie Chart - Disability Type Distribution */}
            <section className={`${theme.cardBg} rounded-xl shadow p-6`}>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Disability Type Distribution
              </h3>
              <div className="w-full h-80">
                {disabilityStats.length > 0 ? (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={disabilityStats}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {disabilityStats.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No disability data available
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Disability by Status Charts */}
          {disabilityStats.length > 0 && (
            <div className="grid grid-cols-1 gap-8">
              {/* Stacked Bar Chart - Disability by Status */}
              <section className={`${theme.cardBg} rounded-xl shadow p-6`}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Disability Types by Member Status
                </h3>
                <div className="w-full h-80">
                  <ResponsiveContainer>
                    <BarChart data={stackedChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      {disabilityStats.map((disability, index) => (
                        <Bar
                          key={disability.type}
                          dataKey={disability.type}
                          stackId="a"
                          fill={disability.color}
                          name={disability.name}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>
          )}

          {/* Summary Statistics */}
          <section className={`${theme.cardBg} rounded-xl shadow p-6 mt-8`}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Disability Statistics Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-sky-50 rounded-lg">
                <p className="text-2xl font-bold text-sky-600">{members.length}</p>
                <p className="text-sm text-gray-600">Total Members</p>
              </div>
              <div className="text-center p-4 bg-sky-50 rounded-lg">
                <p className="text-2xl font-bold text-sky-600">
                  {memberProfiles.length}
                </p>
                <p className="text-sm text-gray-600">Profiles with Data</p>
              </div>
              <div className="text-center p-4 bg-sky-50 rounded-lg">
                <p className="text-2xl font-bold text-sky-600">
                  {disabilityStats.length}
                </p>
                <p className="text-sm text-gray-600">Disability Types</p>
              </div>
              <div className="text-center p-4 bg-sky-50 rounded-lg">
                <p className="text-2xl font-bold text-sky-600">
                  {disabilityStats.length > 0 ? disabilityStats[0].name : 'N/A'}
                </p>
                <p className="text-sm text-gray-600">Most Common</p>
              </div>
            </div>
          </section>
        </div>

        {/* ✅ Reusable Footer */}
        <Footer />
      </div>
    </Layout>
  );
}

export default Dashboard;