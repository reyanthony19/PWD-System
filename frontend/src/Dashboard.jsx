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
  LineChart,
  Line,
  AreaChart,
  Area
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
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [benefits, setBenefits] = useState([]);
  const [events, setEvents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [benefitRecords, setBenefitRecords] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchMembers(),
          fetchCurrentUser(),
          fetchBenefits(),
          fetchEvents(),
          fetchAttendance(),
          fetchBenefitRecords()
        ]);
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
    const res = await api.get("/users?role=member");
    setMembers(res.data);
  };

  const fetchCurrentUser = async () => {
    const res = await api.get("/user");
    setCurrentUser(res.data);
  };

  const fetchBenefits = async () => {
    try {
      const res = await api.get("/benefits");
      setBenefits(res.data || []);
    } catch (err) {
      console.error("Error fetching benefits:", err);
      setBenefits([]);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await api.get("/events");
      // Handle both array and object with data property
      const eventsData = res.data && res.data.data ? res.data.data : 
                        Array.isArray(res.data) ? res.data : 
                        [];
      setEvents(eventsData);
    } catch (err) {
      console.error("Error fetching events:", err);
      setEvents([]);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await api.get("/benefit-records");
      setBenefitRecords(res.data || []);
    } catch (err) {
      console.error("Error fetching benefit records:", err);
      setBenefitRecords([]);
    }
  };

  const fetchBenefitRecords = async () => {
    try {
      const res = await api.get("/benefit-records");
      setAttendance(res.data || []);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setAttendance([]);
    }
  };

  // ✅ Get members with disability data from their member_profile
  const getMembersWithDisabilities = () => {
    return members.filter(member =>
      member.member_profile &&
      member.member_profile.disability_type
    );
  };

  // ✅ Group by disability_type from user.member_profile
  const getDisabilityStats = () => {
    const disabilityCounts = {};
    const membersWithDisabilities = getMembersWithDisabilities();

    membersWithDisabilities.forEach(member => {
      const profile = member.member_profile;

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
    const membersWithDisabilities = getMembersWithDisabilities();

    statuses.forEach(status => {
      disabilityByStatus[status] = {};

      disabilityStats.forEach(disability => {
        // Count members with this disability type and status
        const count = membersWithDisabilities.filter(member => {
          const profile = member.member_profile;
          if (!profile || !profile.disability_type) return false;

          let profileDisabilityType = 'other';
          if (Array.isArray(profile.disability_type)) {
            profileDisabilityType = profile.disability_type[0] || 'other';
          } else {
            profileDisabilityType = profile.disability_type;
          }

          profileDisabilityType = profileDisabilityType.toLowerCase().trim();
          return member.status === status && profileDisabilityType === disability.type;
        }).length;

        disabilityByStatus[status][disability.type] = count;
      });
    });

    return disabilityByStatus;
  };

  // 🔍 ANALYTICS: Get benefit distribution by type
  const getBenefitAnalytics = () => {
    const benefitTypes = {};
    (benefits || []).forEach(benefit => {
      const type = benefit.type || 'unknown';
      benefitTypes[type] = (benefitTypes[type] || 0) + 1;
    });

    return Object.entries(benefitTypes).map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count,
      color: type === 'cash' ? '#10b981' : type === 'relief' ? '#f59e0b' : '#6b7280'
    }));
  };

  // 🔍 ANALYTICS: Get monthly member registration trend
  const getRegistrationTrend = () => {
    const monthlyCounts = {};
    
    (members || []).forEach(member => {
      if (member.created_at) {
        const month = new Date(member.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
      }
    });

    return Object.entries(monthlyCounts)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => new Date(a.month) - new Date(b.month))
      .slice(-6); // Last 6 months
  };

  // 🔍 ANALYTICS: Get event participation rate - FIXED
  const getEventParticipation = () => {
    if (!Array.isArray(events)) {
      return [];
    }
    
    return events.map(event => {
      const eventAttendance = (attendance || []).filter(record => 
        record.event_id === event.id
      ).length;
      
      return {
        name: event.title?.substring(0, 20) + (event.title?.length > 20 ? '...' : '') || 'Untitled Event',
        participants: eventAttendance,
        capacity: event.target_participants || 100,
        rate: Math.round((eventAttendance / (event.target_participants || 100)) * 100)
      };
    }).slice(0, 5); // Top 5 events
  };

  // 🚚 LOGISTICS: Get benefit distribution status - FIXED
  const getBenefitDistribution = () => {
    if (!Array.isArray(benefits)) {
      return [];
    }
    
    const distribution = benefits.map(benefit => {
      const claimed = (benefitRecords || []).filter(record => 
        record.benefit_id === benefit.id
      ).length;
      
      const remaining = (benefit.locked_member_count || 0) - claimed;
      
      return {
        name: benefit.name || 'Unnamed Benefit',
        type: benefit.type || 'unknown',
        total: benefit.locked_member_count || 0,
        claimed,
        remaining: Math.max(0, remaining),
        completion: Math.round((claimed / (benefit.locked_member_count || 1)) * 100)
      };
    });

    return distribution.sort((a, b) => b.completion - a.completion).slice(0, 6);
  };

  // 🚚 LOGISTICS: Get upcoming events - FIXED
  const getUpcomingEvents = () => {
    if (!Array.isArray(events)) {
      return [];
    }
    
    const now = new Date();
    return events
      .filter(event => event.event_date && new Date(event.event_date) >= now)
      .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
      .slice(0, 4);
  };

  // 🚚 LOGISTICS: Get resource allocation summary - FIXED with proper budget calculation for both cash and relief
  const getResourceAllocation = () => {
    if (!Array.isArray(benefits)) {
      return {
        totalBudget: 0,
        allocatedBudget: 0,
        activeBenefits: 0,
        totalParticipants: 0,
        utilizationRate: 0,
        cashBudget: 0,
        reliefBudget: 0
      };
    }
    
    let totalBudget = 0;
    let allocatedBudget = 0;
    let cashBudget = 0;
    let reliefBudget = 0;

    benefits.forEach(benefit => {
      const participants = benefit.locked_member_count || 0;
      const claimed = (benefitRecords || []).filter(record => 
        record.benefit_id === benefit.id
      ).length;

      if (benefit.type === 'cash') {
        // For cash benefits: budget_amount × participants
        const benefitTotal = (benefit.budget_amount || 0) * participants;
        const benefitAllocated = (benefit.budget_amount || 0) * claimed;
        
        totalBudget += benefitTotal;
        allocatedBudget += benefitAllocated;
        cashBudget += benefitTotal;
      } else if (benefit.type === 'relief') {
        // For relief benefits: budget_quantity × participants
        const benefitTotal = (benefit.budget_quantity || 0) * participants;
        const benefitAllocated = (benefit.budget_quantity || 0) * claimed;
        
        totalBudget += benefitTotal;
        allocatedBudget += benefitAllocated;
        reliefBudget += benefitTotal;
      }
    });

    const activeBenefits = benefits.filter(b => b.status === 'active').length;
    const totalParticipants = benefits.reduce((sum, benefit) => 
      sum + (benefit.locked_member_count || 0), 0
    );

    return {
      totalBudget,
      allocatedBudget,
      activeBenefits,
      totalParticipants,
      utilizationRate: Math.round((allocatedBudget / (totalBudget || 1)) * 100),
      cashBudget,
      reliefBudget
    };
  };

  // 🚚 LOGISTICS: Get budget breakdown by benefit type - FIXED for both cash and relief
  const getBudgetBreakdown = () => {
    if (!Array.isArray(benefits)) {
      return [];
    }

    const breakdown = benefits.map(benefit => {
      const participants = benefit.locked_member_count || 0;
      const claimed = (benefitRecords || []).filter(record => 
        record.benefit_id === benefit.id
      ).length;

      let totalBudget = 0;
      let allocatedBudget = 0;
      let unit = '';
      let perParticipant = 0;

      if (benefit.type === 'cash') {
        perParticipant = benefit.budget_amount || 0;
        totalBudget = perParticipant * participants;
        allocatedBudget = perParticipant * claimed;
        unit = '₱';
      } else if (benefit.type === 'relief') {
        perParticipant = benefit.budget_quantity || 0;
        totalBudget = perParticipant * participants;
        allocatedBudget = perParticipant * claimed;
        unit = benefit.unit || 'pcs';
      }

      return {
        name: benefit.name || 'Unnamed Benefit',
        type: benefit.type || 'unknown',
        totalBudget,
        allocatedBudget,
        participants,
        claimed,
        unit,
        perParticipant,
        completion: Math.round((claimed / (participants || 1)) * 100)
      };
    });

    return breakdown.sort((a, b) => b.totalBudget - a.totalBudget).slice(0, 5);
  };

  // 🚚 LOGISTICS: Get benefit type summary
  const getBenefitTypeSummary = () => {
    if (!Array.isArray(benefits)) {
      return [];
    }

    const summary = {
      cash: { count: 0, totalBudget: 0, participants: 0 },
      relief: { count: 0, totalBudget: 0, participants: 0 }
    };

    benefits.forEach(benefit => {
      const participants = benefit.locked_member_count || 0;
      
      if (benefit.type === 'cash') {
        summary.cash.count += 1;
        summary.cash.totalBudget += (benefit.budget_amount || 0) * participants;
        summary.cash.participants += participants;
      } else if (benefit.type === 'relief') {
        summary.relief.count += 1;
        summary.relief.totalBudget += (benefit.budget_quantity || 0) * participants;
        summary.relief.participants += participants;
      }
    });

    return [
      {
        type: 'Cash Benefits',
        count: summary.cash.count,
        totalBudget: summary.cash.totalBudget,
        participants: summary.cash.participants,
        color: '#10b981'
      },
      {
        type: 'Relief Benefits',
        count: summary.relief.count,
        totalBudget: summary.relief.totalBudget,
        participants: summary.relief.participants,
        color: '#f59e0b'
      }
    ];
  };

  const disabilityStats = getDisabilityStats();
  const statusCounts = getStatusCounts();
  const disabilityByStatus = getDisabilityByStatus();
  const membersWithDisabilities = getMembersWithDisabilities();
  const benefitAnalytics = getBenefitAnalytics();
  const registrationTrend = getRegistrationTrend();
  const eventParticipation = getEventParticipation();
  const benefitDistribution = getBenefitDistribution();
  const upcomingEvents = getUpcomingEvents();
  const resourceAllocation = getResourceAllocation();
  const budgetBreakdown = getBudgetBreakdown();
  const benefitTypeSummary = getBenefitTypeSummary();

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
            Comprehensive overview of member statistics, analytics, and logistics.
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
                (from {membersWithDisabilities.length} member profiles)
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
                      {membersWithDisabilities.length > 0 ? ((disability.count / membersWithDisabilities.length) * 100).toFixed(1) : 0}% of Members
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

          {/* 📊 ANALYTICS SECTION */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
              📊 Analytics Overview
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Benefit Type Distribution */}
              <div className={`${theme.cardBg} rounded-xl shadow p-6`}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Benefit Type Distribution
                </h3>
                <div className="w-full h-80">
                  {benefitAnalytics.length > 0 ? (
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={benefitAnalytics}
                          dataKey="count"
                          nameKey="type"
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {benefitAnalytics.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [value, name]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No benefit data available
                    </div>
                  )}
                </div>
              </div>

              {/* Registration Trend */}
              <div className={`${theme.cardBg} rounded-xl shadow p-6`}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Member Registration Trend (Last 6 Months)
                </h3>
                <div className="w-full h-80">
                  {registrationTrend.length > 0 ? (
                    <ResponsiveContainer>
                      <AreaChart data={registrationTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="count" 
                          stroke={theme.chartColors[0]} 
                          fill={theme.chartColors[0]} 
                          fillOpacity={0.3}
                          name="New Members"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No registration data available
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Event Participation */}
            <div className={`${theme.cardBg} rounded-xl shadow p-6 mb-8`}>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Event Participation Rates
              </h3>
              <div className="w-full h-80">
                {eventParticipation.length > 0 ? (
                  <ResponsiveContainer>
                    <BarChart data={eventParticipation}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => 
                          name === 'rate' ? [`${value}%`, 'Participation Rate'] : [value, name]
                        }
                      />
                      <Legend />
                      <Bar 
                        dataKey="rate" 
                        fill="#0ea5e9" 
                        name="Participation Rate (%)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No event participation data available
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 🚚 LOGISTICS SECTION */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
              🚚 Logistics & Distribution
            </h2>

            {/* Benefit Type Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {benefitTypeSummary.map((summary, index) => (
                <div key={index} className="bg-white rounded-xl shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">{summary.type}</h3>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: summary.color }}></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold" style={{ color: summary.color }}>
                        {summary.count}
                      </p>
                      <p className="text-sm text-gray-600">Benefits</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold" style={{ color: summary.color }}>
                        {summary.type.includes('Cash') ? '₱' : ''}{summary.totalBudget.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Total Budget</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold" style={{ color: summary.color }}>
                        {summary.participants}
                      </p>
                      <p className="text-sm text-gray-600">Participants</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Resource Allocation Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-6 rounded-xl shadow text-center">
                <p className="text-2xl font-bold text-sky-600">
                  ₱{resourceAllocation.totalBudget.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Total Budget</p>
                <p className="text-xs text-gray-500">(Amount/Quantity × Participants)</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow text-center">
                <p className="text-2xl font-bold text-green-600">
                  ₱{resourceAllocation.allocatedBudget.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Allocated Budget</p>
                <p className="text-xs text-gray-500">(Amount/Quantity × Claimed)</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {resourceAllocation.activeBenefits}
                </p>
                <p className="text-sm text-gray-600">Active Benefits</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {resourceAllocation.utilizationRate}%
                </p>
                <p className="text-sm text-gray-600">Budget Utilization</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Budget Breakdown */}
              <div className={`${theme.cardBg} rounded-xl shadow p-6`}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Top 5 Budget Allocations
                </h3>
                <div className="space-y-4">
                  {budgetBreakdown.length > 0 ? (
                    budgetBreakdown.map((benefit, index) => (
                      <div key={index} className="border-l-4 border-green-500 pl-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-800">{benefit.name}</span>
                          <span className="text-sm font-semibold text-green-600">
                            {benefit.unit}{benefit.totalBudget.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Type: {benefit.type}</span>
                          <span>{benefit.unit}{benefit.perParticipant}/person</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600 mb-2">
                          <span>Participants: {benefit.participants}</span>
                          <span>Claimed: {benefit.claimed}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${benefit.completion}%` }}
                          ></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-8 text-gray-500">
                      No budget data available
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming Events */}
              <div className={`${theme.cardBg} rounded-xl shadow p-6`}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Upcoming Events
                </h3>
                <div className="space-y-4">
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <h4 className="font-semibold text-gray-800">{event.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          📅 {new Date(event.event_date).toLocaleDateString()}
                          {event.event_time && ` ⏰ ${event.event_time}`}
                        </p>
                        <p className="text-sm text-gray-600">📍 {event.location}</p>
                        {event.target_barangay && (
                          <p className="text-xs text-sky-600 mt-1">
                            Target: {event.target_barangay}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-8 text-gray-500">
                      No upcoming events scheduled
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Benefit Distribution Progress */}
            <div className={`${theme.cardBg} rounded-xl shadow p-6`}>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Benefit Distribution Progress
              </h3>
              <div className="space-y-4">
                {benefitDistribution.length > 0 ? (
                  benefitDistribution.map((benefit, index) => (
                    <div key={index} className="border-l-4 border-sky-500 pl-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-800">{benefit.name}</span>
                        <span className="text-sm font-semibold text-sky-600">
                          {benefit.completion}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-sky-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${benefit.completion}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 mt-1">
                        <span>{benefit.claimed} claimed</span>
                        <span>{benefit.remaining} remaining</span>
                        <span>{benefit.total} total</span>
                        <span className="capitalize">{benefit.type}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-8 text-gray-500">
                    No benefit distribution data available
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Original Charts Section */}
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
              Overall Statistics Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center p-4 bg-sky-50 rounded-lg">
                <p className="text-2xl font-bold text-sky-600">{members.length}</p>
                <p className="text-sm text-gray-600">Total Members</p>
              </div>
              <div className="text-center p-4 bg-sky-50 rounded-lg">
                <p className="text-2xl font-bold text-sky-600">
                  {membersWithDisabilities.length}
                </p>
                <p className="text-sm text-gray-600">With Disability Data</p>
              </div>
              <div className="text-center p-4 bg-sky-50 rounded-lg">
                <p className="text-2xl font-bold text-sky-600">
                  {benefits.length}
                </p>
                <p className="text-sm text-gray-600">Total Benefits</p>
              </div>
              <div className="text-center p-4 bg-sky-50 rounded-lg">
                <p className="text-2xl font-bold text-sky-600">
                  {events.length}
                </p>
                <p className="text-sm text-gray-600">Total Events</p>
              </div>
              <div className="text-center p-4 bg-sky-50 rounded-lg">
                <p className="text-2xl font-bold text-sky-600">
                  {attendance.length}
                </p>
                <p className="text-sm text-gray-600">Benefit Claims</p>
              </div>
              <div className="text-center p-4 bg-sky-50 rounded-lg">
                <p className="text-2xl font-bold text-sky-600">
                  {disabilityStats.length > 0 ? disabilityStats[0].name : 'N/A'}
                </p>
                <p className="text-sm text-gray-600">Most Common Disability</p>
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