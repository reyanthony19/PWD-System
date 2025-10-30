import React, { useEffect, useState, useMemo } from "react";
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
  AreaChart,
  Area
} from "recharts";
import Layout from "./Layout";
import Footer from "./Footer";
import {
  Users,
  Gift,
  Calendar,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

// 🎨 Sky Blue Theme
const theme = {
  primary: "from-sky-600 to-sky-400",
  primaryText: "text-sky-600",
  secondaryText: "text-sky-400",
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

// Auto-refresh intervals
const REFRESH_INTERVALS = {
  NORMAL: 60000, // 1 minute
};

function Dashboard() {
  const [data, setData] = useState({
    members: [],
    currentUser: null,
    benefits: [],
    events: [],
    benefitRecords: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { members, currentUser, benefits, events, benefitRecords } = data;

  // Main data fetching function
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [membersRes, userRes, benefitsRes, eventsRes, benefitRecordsRes] = await Promise.allSettled([
        api.get("/users?role=member"),
        api.get("/user"),
        api.get("/benefits"),
        api.get("/events"),
        api.get("/benefit-records")
      ]);

      const updates = {};
      
      if (membersRes.status === 'fulfilled') updates.members = membersRes.value.data || [];
      if (userRes.status === 'fulfilled') updates.currentUser = userRes.value.data;
      if (benefitsRes.status === 'fulfilled') updates.benefits = benefitsRes.value.data || [];
      if (eventsRes.status === 'fulfilled') updates.events = eventsRes.value.data?.data || eventsRes.value.data || [];
      if (benefitRecordsRes.status === 'fulfilled') updates.benefitRecords = benefitRecordsRes.value.data || [];

      setData(prev => ({ ...prev, ...updates }));

      // Log any failed requests
      const failedRequests = [membersRes, userRes, benefitsRes, eventsRes, benefitRecordsRes]
        .filter(result => result.status === 'rejected');
      
      if (failedRequests.length > 0) {
        console.warn(`${failedRequests.length} requests failed, using available data`);
      }

    } catch (err) {
      console.error("Error loading dashboard:", err);
      setError("Some data may not be current. The system will retry automatically.");
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchDashboardData();
    }, REFRESH_INTERVALS.NORMAL);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Memoized calculations
  const getMembersWithDisabilities = useMemo(() => {
    return members.filter(member => member.member_profile?.disability_type);
  }, [members]);

  const getDisabilityStats = useMemo(() => {
    const membersWithDisabilities = getMembersWithDisabilities;
    if (!membersWithDisabilities.length) return [];

    const disabilityCounts = new Map();
    
    for (const member of membersWithDisabilities) {
      const profile = member.member_profile;
      let disabilityType = 'other';
      
      if (Array.isArray(profile.disability_type)) {
        disabilityType = profile.disability_type[0]?.toLowerCase().trim() || 'other';
      } else if (typeof profile.disability_type === 'string') {
        disabilityType = profile.disability_type.toLowerCase().trim();
      }

      // Normalize disability type
      if (!disabilityTypes[disabilityType]) {
        if (disabilityType.includes('physical')) disabilityType = 'physical';
        else if (disabilityType.includes('visual') || disabilityType.includes('see')) disabilityType = 'visual';
        else if (disabilityType.includes('hear')) disabilityType = 'hearing';
        else if (disabilityType.includes('intellectual') || disabilityType.includes('learning')) disabilityType = 'intellectual';
        else if (disabilityType.includes('mental')) disabilityType = 'mental';
        else if (disabilityType.includes('neuro')) disabilityType = 'neurological';
        else if (disabilityType.includes('multiple')) disabilityType = 'multiple';
        else disabilityType = 'other';
      }

      disabilityCounts.set(disabilityType, (disabilityCounts.get(disabilityType) || 0) + 1);
    }

    return Array.from(disabilityCounts.entries())
      .map(([type, count]) => ({
        type,
        name: disabilityTypes[type]?.name || type.charAt(0).toUpperCase() + type.slice(1),
        count,
        color: disabilityTypes[type]?.color || "#d69e2e"
      }))
      .sort((a, b) => b.count - a.count);
  }, [getMembersWithDisabilities]);

  const getBenefitAnalytics = useMemo(() => {
    if (!benefits.length) return [];
    
    const benefitTypesCount = new Map();
    for (const benefit of benefits) {
      const type = benefit.type || 'unknown';
      benefitTypesCount.set(type, (benefitTypesCount.get(type) || 0) + 1);
    }
    
    return Array.from(benefitTypesCount.entries()).map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count,
      color: theme.chartColors[benefitTypesCount.size % theme.chartColors.length]
    }));
  }, [benefits]);

  const getRegistrationTrend = useMemo(() => {
    if (!members.length) return [];
    
    const monthlyCounts = new Map();
    for (const member of members) {
      if (member.created_at) {
        const month = new Date(member.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short'
        });
        monthlyCounts.set(month, (monthlyCounts.get(month) || 0) + 1);
      }
    }
    
    return Array.from(monthlyCounts.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => new Date(a.month) - new Date(b.month))
      .slice(-6);
  }, [members]);

  const getUpcomingEvents = useMemo(() => {
    if (!Array.isArray(events) || !events.length) return [];
    
    const now = new Date();
    return events
      .filter(event => event.event_date && new Date(event.event_date) >= now)
      .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
      .slice(0, 3);
  }, [events]);

  const getResourceAllocation = useMemo(() => {
    if (!Array.isArray(benefits) || !benefits.length) {
      return { totalBudget: 0, activeBenefits: 0, utilizationRate: 0 };
    }

    let totalBudget = 0;
    let activeBenefits = 0;
    let totalParticipants = 0;

    for (const benefit of benefits) {
      const participants = benefit.locked_member_count || 0;
      if (benefit.status === 'active') {
        activeBenefits++;
        totalParticipants += participants;
        
        if (benefit.type === 'cash') {
          totalBudget += (benefit.budget_amount || 0) * participants;
        }
      }
    }

    const utilizationRate = totalParticipants > 0 ? Math.min(85, Math.round((totalParticipants / (members.length || 1)) * 100)) : 0;

    return {
      totalBudget,
      activeBenefits,
      totalParticipants,
      utilizationRate
    };
  }, [benefits, members.length]);

  if (loading && members.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-lg font-medium text-gray-600">Loading Dashboard...</p>
            <p className="text-sm text-gray-500 mt-2">Getting the latest data</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6 mx-4 mt-4">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-r from-sky-600 to-sky-400 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
              </div>
              <p className="text-gray-600">Real-time analytics and insights</p>
              
           
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 text-amber-700 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        <div className="p-4 max-w-7xl mx-auto">
          {/* Key Metrics Section */}
          <section className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
                <Users className="w-8 h-8 text-sky-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{members.length}</div>
                <div className="text-sm text-gray-600">Total Members</div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
                <Gift className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{benefits.length}</div>
                <div className="text-sm text-gray-600">Active Benefits</div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
                <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  ₱{getResourceAllocation.totalBudget.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Budget</div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
                <Calendar className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{getUpcomingEvents.length}</div>
                <div className="text-sm text-gray-600">Upcoming Events</div>
              </div>
            </div>
          </section>

          {/* Disability Statistics */}
          <section className="mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                Disability Statistics
                <span className="text-sm font-normal text-gray-600 ml-2">
                  ({getMembersWithDisabilities.length} members with disability data)
                </span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {getDisabilityStats.length > 0 ? (
                  getDisabilityStats.slice(0, 4).map((disability) => (
                    <div
                      key={disability.type}
                      className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:shadow-md transition"
                      style={{ borderLeft: `4px solid ${disability.color}` }}
                    >
                      <p className="text-2xl font-bold text-gray-800">{disability.count}</p>
                      <p className="text-sm font-medium text-gray-600">{disability.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round((disability.count / (getMembersWithDisabilities.length || 1)) * 100)}% of members
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-4 text-center p-8 bg-gray-100 rounded-xl">
                    <p className="text-gray-500">No disability data available</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Analytics Overview */}
          <section className="mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">
                Analytics Overview
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Benefit Type Distribution */}
                <div className="rounded-xl p-4 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Benefit Type Distribution
                  </h3>
                  <div className="w-full h-64">
                    {getBenefitAnalytics.length > 0 ? (
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={getBenefitAnalytics}
                            dataKey="count"
                            nameKey="type"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {getBenefitAnalytics.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
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
                <div className="rounded-xl p-4 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Registration Trend (Last 6 Months)
                  </h3>
                  <div className="w-full h-64">
                    {getRegistrationTrend.length > 0 ? (
                      <ResponsiveContainer>
                        <AreaChart data={getRegistrationTrend}>
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
            </div>
          </section>

          {/* Upcoming Events - Full Width */}
          <section className="mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Events</h3>
              <div className="space-y-4">
                {getUpcomingEvents.length > 0 ? (
                  getUpcomingEvents.map((event, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
                      <div className="flex-shrink-0 w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-sky-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{event.title}</h4>
                        <p className="text-sm text-gray-600">
                          {event.event_date && new Date(event.event_date).toLocaleDateString()}
                          {event.location && ` • ${event.location}`}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-8 text-gray-500">
                    No upcoming events scheduled
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Disability Charts Section */}
          <section className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Members by Disability Type - Bar Chart */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Members by Disability Type
                </h3>
                <div className="w-full h-80">
                  {getDisabilityStats.length > 0 ? (
                    <ResponsiveContainer>
                      <BarChart data={getDisabilityStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar
                          dataKey="count"
                          fill={theme.chartColors[0]}
                          radius={[4, 4, 0, 0]}
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
              </div>

              {/* Disability Distribution - Pie Chart */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Disability Distribution
                </h3>
                <div className="w-full h-80">
                  {getDisabilityStats.length > 0 ? (
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={getDisabilityStats}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {getDisabilityStats.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No disability data available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Additional Analytics Section */}
          <section className="mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Additional Insights</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="text-2xl font-bold text-sky-600">{getMembersWithDisabilities.length}</div>
                  <div className="text-sm text-gray-600">Members with Disability Data</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round((getMembersWithDisabilities.length / (members.length || 1)) * 100)}% of total
                  </div>
                </div>
                <div className="text-center p-4">
                  <div className="text-2xl font-bold text-green-600">{getResourceAllocation.activeBenefits}</div>
                  <div className="text-sm text-gray-600">Active Benefits</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round((getResourceAllocation.activeBenefits / (benefits.length || 1)) * 100)}% of total
                  </div>
                </div>
                <div className="text-center p-4">
                  <div className="text-2xl font-bold text-purple-600">{getResourceAllocation.utilizationRate}%</div>
                  <div className="text-sm text-gray-600">Resource Utilization</div>
                  <div className="text-xs text-gray-500 mt-1">Based on member participation</div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <Footer />
      </div>
    </Layout>
  );
}

export default Dashboard;