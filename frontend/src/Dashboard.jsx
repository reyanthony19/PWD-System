import React, { useEffect, useState, useMemo, useCallback } from "react";
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

// Benefit type colors and labels
const benefitTypes = {
  cash: { name: "Cash Benefits", color: "#10b981", icon: "💰" },
  relief: { name: "Relief Benefits", color: "#f59e0b", icon: "📦" },
  other: { name: "Other Benefits", color: "#6b7280", icon: "🛠️" }
};

// Cache configuration
const CACHE_KEYS = {
  MEMBERS: 'dashboard_members',
  CURRENT_USER: 'dashboard_current_user',
  BENEFITS: 'dashboard_benefits',
  EVENTS: 'dashboard_events',
  ATTENDANCE: 'dashboard_attendance',
  BENEFIT_RECORDS: 'dashboard_benefit_records',
  TIMESTAMP: 'dashboard_cache_timestamp'
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Cache utility functions
const cache = {
  // Get data from cache
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const { data, timestamp } = JSON.parse(item);

      // Check if cache is still valid
      if (Date.now() - timestamp > CACHE_DURATION) {
        cache.clear(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  },

  // Set data in cache
  set: (key, data) => {
    try {
      const item = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error('Error writing to cache:', error);
    }
  },

  // Clear specific cache
  clear: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },

  // Clear all dashboard cache
  clearAll: () => {
    Object.values(CACHE_KEYS).forEach(key => {
      cache.clear(key);
    });
  },

  // Check if cache is valid
  isValid: (key) => {
    const data = cache.get(key);
    return data !== null;
  }
};

// Performance optimization: Debounce function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Performance optimization: Batch state updates
const useBatchState = (initialState) => {
  const [state, setState] = useState(initialState);

  const batchUpdate = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  return [state, batchUpdate];
};

function Dashboard() {
  // Use batch state for related data
  const [data, setData] = useBatchState({
    members: [],
    currentUser: null,
    benefits: [],
    events: [],
    attendance: [],
    benefitRecords: []
  });

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  // Destructure for easier access
  const { members, currentUser, benefits, events, attendance, benefitRecords } = data;

  // Load initial data from cache - optimized single effect
  useEffect(() => {
    const loadCachedData = () => {
      const cachedData = {
        members: cache.get(CACHE_KEYS.MEMBERS) || [],
        currentUser: cache.get(CACHE_KEYS.CURRENT_USER) || null,
        benefits: cache.get(CACHE_KEYS.BENEFITS) || [],
        events: cache.get(CACHE_KEYS.EVENTS) || [],
        attendance: cache.get(CACHE_KEYS.ATTENDANCE) || [],
        benefitRecords: cache.get(CACHE_KEYS.BENEFIT_RECORDS) || []
      };

      setData(cachedData);
    };

    loadCachedData();
  }, [setData]);

  // Optimized data fetching with error handling and batching
  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Check if we need to fetch fresh data
      const shouldFetchFresh = forceRefresh ||
        !cache.isValid(CACHE_KEYS.MEMBERS) ||
        !cache.isValid(CACHE_KEYS.CURRENT_USER);

      if (!shouldFetchFresh) {
        setLoading(false);
        return;
      }

      // Batch all API calls
      const [
        membersRes,
        userRes,
        benefitsRes,
        eventsRes,
        attendanceRes,
        benefitRecordsRes
      ] = await Promise.allSettled([
        fetchMembersData(forceRefresh),
        fetchCurrentUserData(forceRefresh),
        fetchBenefitsData(forceRefresh),
        fetchEventsData(forceRefresh),
        fetchAttendanceData(forceRefresh),
        fetchBenefitRecordsData(forceRefresh)
      ]);

      // Batch update all state
      const updates = {};

      if (membersRes.status === 'fulfilled') updates.members = membersRes.value;
      if (userRes.status === 'fulfilled') updates.currentUser = userRes.value;
      if (benefitsRes.status === 'fulfilled') updates.benefits = benefitsRes.value;
      if (eventsRes.status === 'fulfilled') updates.events = eventsRes.value;
      if (attendanceRes.status === 'fulfilled') updates.attendance = attendanceRes.value;
      if (benefitRecordsRes.status === 'fulfilled') updates.benefitRecords = benefitRecordsRes.value;

      setData(updates);
      setLastUpdated(new Date());

      // Handle errors gracefully
      const errors = [membersRes, userRes, benefitsRes, eventsRes, attendanceRes, benefitRecordsRes]
        .filter(result => result.status === 'rejected')
        .map(result => result.reason.message);

      if (errors.length > 0) {
        console.warn('Some data failed to load:', errors);
        setError(`Some data may be outdated. ${errors.length} requests failed.`);
      }

    } catch (err) {
      console.error("Error loading dashboard:", err);
      setError("Failed to load dashboard data. Please try refreshing.");
    } finally {
      setLoading(false);
    }
  }, [setData]);

  // Debounced refresh to prevent multiple rapid calls
  const debouncedRefresh = useMemo(
    () => debounce((forceRefresh = false) => fetchData(forceRefresh), 300),
    [fetchData]
  );

  useEffect(() => {
    debouncedRefresh(false);
    const interval = setInterval(() => debouncedRefresh(false), 60000); // Increased to 60s
    return () => clearInterval(interval);
  }, [debouncedRefresh]);

  // Optimized API calls with early returns
  const fetchMembersData = async (forceRefresh = false) => {
    const cached = !forceRefresh && cache.get(CACHE_KEYS.MEMBERS);
    if (cached) return cached;

    const res = await api.get("/users?role=member");
    cache.set(CACHE_KEYS.MEMBERS, res.data);
    return res.data;
  };

  const fetchCurrentUserData = async (forceRefresh = false) => {
    const cached = !forceRefresh && cache.get(CACHE_KEYS.CURRENT_USER);
    if (cached) return cached;

    const res = await api.get("/user");
    cache.set(CACHE_KEYS.CURRENT_USER, res.data);
    return res.data;
  };

  const fetchBenefitsData = async (forceRefresh = false) => {
    const cached = !forceRefresh && cache.get(CACHE_KEYS.BENEFITS);
    if (cached) return cached;

    try {
      const res = await api.get("/benefits");
      const data = res.data || [];

      // 🐛 DEBUG: Log the raw API response to see budget fields
      console.log('📊 Raw benefits API response:', data);
      data.forEach(benefit => {
        console.log(`Benefit ${benefit.id}:`, {
          name: benefit.name,
          type: benefit.type,
          budget_amount: benefit.budget_amount,
          budget_quantity: benefit.budget_quantity,
          item_quantity: benefit.item_quantity,
          locked_member_count: benefit.locked_member_count,
          total_budget: benefit.total_budget // Check if this exists
        });
      });

      cache.set(CACHE_KEYS.BENEFITS, data);
      return data;
    } catch (err) {
      console.error("Error fetching benefits:", err);
      return [];
    }
  };

  const fetchEventsData = async (forceRefresh = false) => {
    const cached = !forceRefresh && cache.get(CACHE_KEYS.EVENTS);
    if (cached) return cached;

    try {
      const res = await api.get("/events");
      const eventsData = res.data && res.data.data ? res.data.data :
        Array.isArray(res.data) ? res.data : [];
      cache.set(CACHE_KEYS.EVENTS, eventsData);
      return eventsData;
    } catch (err) {
      console.error("Error fetching events:", err);
      return [];
    }
  };

  const fetchAttendanceData = async (forceRefresh = false) => {
    const cached = !forceRefresh && cache.get(CACHE_KEYS.ATTENDANCE);
    if (cached) return cached;

    try {
      const res = await api.get("/benefit-records");
      const data = res.data || [];
      cache.set(CACHE_KEYS.ATTENDANCE, data);
      return data;
    } catch (err) {
      console.error("Error fetching benefit records:", err);
      return [];
    }
  };

  const fetchBenefitRecordsData = async (forceRefresh = false) => {
    const cached = !forceRefresh && cache.get(CACHE_KEYS.BENEFIT_RECORDS);
    if (cached) return cached;

    try {
      const res = await api.get("/benefit-records");
      const data = res.data || [];
      cache.set(CACHE_KEYS.BENEFIT_RECORDS, data);
      return data;
    } catch (err) {
      console.error("Error fetching attendance:", err);
      return [];
    }
  };

  // Refresh data manually with debouncing
  const handleRefresh = () => {
    cache.clearAll();
    debouncedRefresh(true);
  };

  // ✅ Get members with disability data - Optimized with early return
  const getMembersWithDisabilities = useMemo(() => {
    if (!members.length) return [];

    return members.filter(member =>
      member.member_profile &&
      member.member_profile.disability_type
    );
  }, [members]);

  // ✅ Optimized disability stats calculation
  const getDisabilityStats = useMemo(() => {
    const membersWithDisabilities = getMembersWithDisabilities;
    if (!membersWithDisabilities.length) return [];

    const disabilityCounts = new Map();

    for (const member of membersWithDisabilities) {
      const profile = member.member_profile;
      if (!profile.disability_type) continue;

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

  // ✅ Optimized status counts
  const getStatusCounts = useMemo(() => {
    if (!members.length) {
      return {
        Approved: 0, Rejected: 0, Deceased: 0, Inactive: 0, Pending: 0
      };
    }

    const statusCounts = {
      Approved: 0, Rejected: 0, Deceased: 0, Inactive: 0, Pending: 0
    };

    for (const member of members) {
      if (statusCounts.hasOwnProperty(member.status)) {
        statusCounts[member.status]++;
      }
    }

    return statusCounts;
  }, [members]);

  // ✅ Optimized cross-analysis: Disability types by status
  const getDisabilityByStatus = useMemo(() => {
    const disabilityStats = getDisabilityStats;
    const membersWithDisabilities = getMembersWithDisabilities;

    if (!disabilityStats.length || !membersWithDisabilities.length) {
      return {};
    }

    const disabilityByStatus = {};
    const statuses = ['approved', 'pending', 'rejected', 'inactive', 'deceased'];

    // Pre-map disability types for faster lookup
    const disabilityMap = new Map(disabilityStats.map(d => [d.type, d]));

    for (const status of statuses) {
      disabilityByStatus[status] = {};

      for (const disability of disabilityStats) {
        let count = 0;

        for (const member of membersWithDisabilities) {
          if (member.status !== status) continue;

          const profile = member.member_profile;
          if (!profile.disability_type) continue;

          let profileDisabilityType = 'other';
          if (Array.isArray(profile.disability_type)) {
            profileDisabilityType = profile.disability_type[0]?.toLowerCase().trim() || 'other';
          } else {
            profileDisabilityType = profile.disability_type.toLowerCase().trim();
          }

          if (profileDisabilityType === disability.type) {
            count++;
          }
        }

        disabilityByStatus[status][disability.type] = count;
      }
    }

    return disabilityByStatus;
  }, [getDisabilityStats, getMembersWithDisabilities]);

  // 🔍 OPTIMIZED ANALYTICS: Get benefit distribution by type
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
      color: benefitTypes[type]?.color || '#6b7280'
    }));
  }, [benefits]);

  // 🔍 OPTIMIZED ANALYTICS: Get monthly member registration trend
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

  // 🔍 OPTIMIZED ANALYTICS: Get event participation rate
  const getEventParticipation = useMemo(() => {
    if (!Array.isArray(events) || !events.length || !Array.isArray(attendance)) {
      return [];
    }

    const result = [];

    for (let i = 0; i < Math.min(events.length, 5); i++) {
      const event = events[i];
      const eventAttendance = attendance.filter(record =>
        record.event_id === event.id
      ).length;

      result.push({
        name: event.title?.substring(0, 20) + (event.title?.length > 20 ? '...' : '') || 'Untitled Event',
        participants: eventAttendance,
        capacity: event.target_participants || 100,
        rate: Math.round((eventAttendance / (event.target_participants || 100)) * 100)
      });
    }

    return result;
  }, [events, attendance]);

  // 🚚 OPTIMIZED LOGISTICS: Get benefit distribution status
  const getBenefitDistribution = useMemo(() => {
    if (!Array.isArray(benefits) || !benefits.length) {
      return [];
    }

    const distribution = [];
    const benefitRecordsMap = new Map();

    // Pre-process benefit records for faster lookup
    if (Array.isArray(benefitRecords)) {
      for (const record of benefitRecords) {
        const benefitId = record.benefit_id;
        benefitRecordsMap.set(benefitId, (benefitRecordsMap.get(benefitId) || 0) + 1);
      }
    }

    for (let i = 0; i < Math.min(benefits.length, 6); i++) {
      const benefit = benefits[i];
      const claimed = benefitRecordsMap.get(benefit.id) || 0;
      const remaining = Math.max(0, (benefit.locked_member_count || 0) - claimed);

      distribution.push({
        name: benefit.name || 'Unnamed Benefit',
        type: benefit.type || 'unknown',
        total: benefit.locked_member_count || 0,
        claimed,
        remaining,
        completion: Math.round((claimed / (benefit.locked_member_count || 1)) * 100),
        itemName: benefit.item_name
      });
    }

    return distribution.sort((a, b) => b.completion - a.completion);
  }, [benefits, benefitRecords]);

  // 🚚 OPTIMIZED LOGISTICS: Get upcoming events
  const getUpcomingEvents = useMemo(() => {
    if (!Array.isArray(events) || !events.length) {
      return [];
    }

    const now = new Date();
    const upcoming = [];

    for (const event of events) {
      if (event.event_date && new Date(event.event_date) >= now) {
        upcoming.push(event);
      }
    }

    return upcoming
      .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
      .slice(0, 4);
  }, [events]);

  // 🚚 OPTIMIZED LOGISTICS: Get resource allocation summary - FIXED VERSION
  const getResourceAllocation = useMemo(() => {
    if (!Array.isArray(benefits) || !benefits.length) {
      return {
        totalBudget: 0,
        allocatedBudget: 0,
        activeBenefits: 0,
        totalParticipants: 0,
        utilizationRate: 0,
        cashBudget: 0,
        reliefBudget: 0,
        otherBudget: 0
      };
    }

    let totalBudget = 0;
    let allocatedBudget = 0;
    let cashBudget = 0;
    let reliefBudget = 0;
    let otherBudget = 0;
    let activeBenefits = 0;
    let totalParticipants = 0;

    const benefitRecordsMap = new Map();

    // Pre-process benefit records
    if (Array.isArray(benefitRecords)) {
      for (const record of benefitRecords) {
        const benefitId = record.benefit_id;
        benefitRecordsMap.set(benefitId, (benefitRecordsMap.get(benefitId) || 0) + 1);
      }
    }

    // 🐛 DEBUG: Log calculations to identify the issue
    console.log('=== RESOURCE ALLOCATION DEBUG ===');

    for (const benefit of benefits) {
      const participants = benefit.locked_member_count || 0;
      const claimed = benefitRecordsMap.get(benefit.id) || 0;

      totalParticipants += participants;
      if (benefit.status === 'active') activeBenefits++;

      if (benefit.type === 'cash') {
        const benefitTotal = (benefit.budget_amount || 0) * participants;
        const benefitAllocated = (benefit.budget_amount || 0) * claimed;

        console.log(`Cash Benefit: ${benefit.name}`, {
          budget_amount: benefit.budget_amount,
          participants: participants,
          calculated_total: benefitTotal,
          claimed: claimed,
          allocated: benefitAllocated
        });

        totalBudget += benefitTotal;
        allocatedBudget += benefitAllocated;
        cashBudget += benefitTotal;
      } else if (benefit.type === 'relief') {
        const benefitTotal = (benefit.budget_quantity || 0) * participants;
        const benefitAllocated = (benefit.budget_quantity || 0) * claimed;

        console.log(`Relief Benefit: ${benefit.name}`, {
          budget_quantity: benefit.budget_quantity,
          participants: participants,
          calculated_total: benefitTotal,
          claimed: claimed,
          allocated: benefitAllocated
        });

        // FIX: Only add to reliefBudget, NOT totalBudget
        reliefBudget += benefitTotal;
        // totalBudget += benefitTotal; // REMOVED - relief benefits don't count toward total budget
      } else if (benefit.type === 'other') {
        const benefitTotal = (benefit.item_quantity || 0) * participants;
        const benefitAllocated = (benefit.item_quantity || 0) * claimed;

        console.log(`Other Benefit: ${benefit.name}`, {
          item_quantity: benefit.item_quantity,
          participants: participants,
          calculated_total: benefitTotal,
          claimed: claimed,
          allocated: benefitAllocated
        });

        // FIX: Only add to otherBudget, NOT totalBudget
        otherBudget += benefitTotal;
        // totalBudget += benefitTotal; // REMOVED - other benefits don't count toward total budget
      }
    }

    console.log('FINAL TOTALS:', {
      totalBudget,
      cashBudget,
      reliefBudget,
      otherBudget,
      activeBenefits,
      totalParticipants
    });

    return {
      totalBudget,
      allocatedBudget,
      activeBenefits,
      totalParticipants,
      utilizationRate: Math.round((allocatedBudget / (totalBudget || 1)) * 100),
      cashBudget,
      reliefBudget,
      otherBudget
    };
  }, [benefits, benefitRecords]);

  // 🚚 OPTIMIZED LOGISTICS: Get budget breakdown by benefit type
  const getBudgetBreakdown = useMemo(() => {
    if (!Array.isArray(benefits) || !benefits.length) {
      return [];
    }

    const benefitRecordsMap = new Map();

    // Pre-process benefit records
    if (Array.isArray(benefitRecords)) {
      for (const record of benefitRecords) {
        const benefitId = record.benefit_id;
        benefitRecordsMap.set(benefitId, (benefitRecordsMap.get(benefitId) || 0) + 1);
      }
    }

    const breakdown = [];

    for (let i = 0; i < Math.min(benefits.length, 5); i++) {
      const benefit = benefits[i];
      const participants = benefit.locked_member_count || 0;
      const claimed = benefitRecordsMap.get(benefit.id) || 0;

      let totalBudget = 0;
      let allocatedBudget = 0;
      let unit = '';
      let perParticipant = 0;
      let displayName = benefit.name || 'Unnamed Benefit';

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
      } else if (benefit.type === 'other') {
        perParticipant = benefit.item_quantity || 0;
        totalBudget = perParticipant * participants;
        allocatedBudget = perParticipant * claimed;
        unit = 'items';
        if (benefit.item_name) {
          displayName = `${benefit.name} (${benefit.item_name})`;
        }
      }

      breakdown.push({
        name: displayName,
        type: benefit.type || 'unknown',
        totalBudget,
        allocatedBudget,
        participants,
        claimed,
        unit,
        perParticipant,
        completion: Math.round((claimed / (participants || 1)) * 100),
        itemName: benefit.item_name
      });
    }

    return breakdown.sort((a, b) => b.totalBudget - a.totalBudget);
  }, [benefits, benefitRecords]);

  // 🚚 OPTIMIZED LOGISTICS: Get benefit type summary
  const getBenefitTypeSummary = useMemo(() => {
    if (!Array.isArray(benefits) || !benefits.length) {
      return [];
    }

    const summary = {
      cash: { count: 0, totalBudget: 0, participants: 0 },
      relief: { count: 0, totalBudget: 0, participants: 0 },
      other: { count: 0, totalBudget: 0, participants: 0 }
    };

    // 🐛 DEBUG: Compare with resource allocation
    console.log('=== BENEFIT TYPE SUMMARY DEBUG ===');

    for (const benefit of benefits) {
      const participants = benefit.locked_member_count || 0;

      if (benefit.type === 'cash') {
        const benefitTotal = (benefit.budget_amount || 0) * participants;
        summary.cash.count += 1;
        summary.cash.totalBudget += benefitTotal;
        summary.cash.participants += participants;

        console.log(`Cash Summary: ${benefit.name}`, {
          budget_amount: benefit.budget_amount,
          participants: participants,
          calculated_total: benefitTotal
        });
      } else if (benefit.type === 'relief') {
        const benefitTotal = (benefit.budget_quantity || 0) * participants;
        summary.relief.count += 1;
        summary.relief.totalBudget += benefitTotal;
        summary.relief.participants += participants;
      } else if (benefit.type === 'other') {
        const benefitTotal = (benefit.item_quantity || 0) * participants;
        summary.other.count += 1;
        summary.other.totalBudget += benefitTotal;
        summary.other.participants += participants;
      }
    }

    console.log('SUMMARY TOTALS:', {
      cashTotal: summary.cash.totalBudget,
      reliefTotal: summary.relief.totalBudget,
      otherTotal: summary.other.totalBudget
    });

    return [
      {
        type: 'Cash Benefits',
        count: summary.cash.count,
        totalBudget: summary.cash.totalBudget,
        participants: summary.cash.participants,
        color: benefitTypes.cash.color,
        icon: benefitTypes.cash.icon
      },
      {
        type: 'Relief Benefits',
        count: summary.relief.count,
        totalBudget: summary.relief.totalBudget,
        participants: summary.relief.participants,
        color: benefitTypes.relief.color,
        icon: benefitTypes.relief.icon
      },
      {
        type: 'Other Benefits',
        count: summary.other.count,
        totalBudget: summary.other.totalBudget,
        participants: summary.other.participants,
        color: benefitTypes.other.color,
        icon: benefitTypes.other.icon
      }
    ];
  }, [benefits]);

  // Data for stacked bar chart (disability by status) - Memoized
  const stackedChartData = useMemo(() => {
    return Object.entries(getDisabilityByStatus).map(([status, disabilities]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      ...disabilities
    }));
  }, [getDisabilityByStatus]);

  // Show loading state
  if (loading && members.length === 0) {
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
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <div className="text-left">
              <h1 className="text-4xl md:text-6xl font-extrabold mb-4 drop-shadow-md">
                Welcome, {currentUser?.username || "..."}
              </h1>
              <p className="max-w-2xl text-lg md:text-xl opacity-90">
                Comprehensive overview of member statistics, analytics, and logistics.
              </p>
            </div>
            <div className="text-right">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="bg-white text-sky-600 px-4 py-2 rounded-lg font-semibold hover:bg-sky-50 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '🔄 Refreshing...' : '🔄 Refresh Data'}
              </button>
              {lastUpdated && (
                <p className="text-sm text-sky-200 mt-2">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
              {error && (
                <p className="text-sm text-yellow-200 mt-2">
                  ⚠️ {error}
                </p>
              )}
            </div>
          </div>
        </section>

        <div className="p-6 max-w-7xl mx-auto -mt-12 relative z-10">
          {/* Overview Cards - Status */}
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
            {Object.entries(getStatusCounts).map(([status, count]) => {
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
                (from {getMembersWithDisabilities.length} member profiles)
              </span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {getDisabilityStats.length > 0 ? (
                getDisabilityStats.map((disability, index) => (
                  <div
                    key={disability.type}
                    className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition"
                    style={{ borderLeft: `4px solid ${disability.color}` }}
                  >
                    <p className="text-3xl font-bold text-gray-800">{disability.count}</p>
                    <p className="text-sm font-medium text-gray-600">{disability.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {getMembersWithDisabilities.length > 0 ? ((disability.count / getMembersWithDisabilities.length) * 100).toFixed(1) : 0}% of Members
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
                  {getBenefitAnalytics.length > 0 ? (
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={getBenefitAnalytics}
                          dataKey="count"
                          nameKey="type"
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {getBenefitAnalytics.map((entry, index) => (
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

            {/* Event Participation */}
            <div className={`${theme.cardBg} rounded-xl shadow p-6 mb-8`}>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Event Participation Rates
              </h3>
              <div className="w-full h-80">
                {getEventParticipation.length > 0 ? (
                  <ResponsiveContainer>
                    <BarChart data={getEventParticipation}>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {getBenefitTypeSummary.map((summary, index) => (
                <div key={index} className="bg-white rounded-xl shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {summary.icon} {summary.type}
                    </h3>
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
                  {getResourceAllocation.totalBudget.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Total Budget</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow text-center">
                <p className="text-2xl font-bold text-green-600">
                  {getResourceAllocation.allocatedBudget.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Allocated Budget</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {getResourceAllocation.activeBenefits}
                </p>
                <p className="text-sm text-gray-600">Active Benefits</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {getResourceAllocation.utilizationRate}%
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
                  {getBudgetBreakdown.length > 0 ? (
                    getBudgetBreakdown.map((benefit, index) => (
                      <div key={index} className="border-l-4 border-green-500 pl-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-800">{benefit.name}</span>
                          <span className="text-sm font-semibold text-green-600">
                            {benefit.unit} {benefit.totalBudget.toLocaleString()}
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
                        {benefit.itemName && (
                          <div className="text-xs text-gray-500 mb-2">
                            Item: {benefit.itemName}
                          </div>
                        )}
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
                  {getUpcomingEvents.length > 0 ? (
                    getUpcomingEvents.map((event, index) => (
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
                {getBenefitDistribution.length > 0 ? (
                  getBenefitDistribution.map((benefit, index) => (
                    <div key={index} className="border-l-4 border-sky-500 pl-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-800">
                          {benefit.name}
                          {benefit.itemName && (
                            <span className="text-xs text-gray-500 ml-2">({benefit.itemName})</span>
                          )}
                        </span>
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
                {getDisabilityStats.length > 0 ? (
                  <ResponsiveContainer>
                    <BarChart data={getDisabilityStats}>
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
                {getDisabilityStats.length > 0 ? (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={getDisabilityStats}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {getDisabilityStats.map((entry, index) => (
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
          {getDisabilityStats.length > 0 && (
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
                      {getDisabilityStats.map((disability, index) => (
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
                  {getMembersWithDisabilities.length}
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
                  {getDisabilityStats.length > 0 ? getDisabilityStats[0].name : 'N/A'}
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