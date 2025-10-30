import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  UserX,
  Search,
  Users,
  UserCheck,
  Plus,
  ChevronDown,
  Award,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import api from "./api";
import Layout from "./Layout";

// Cache configuration for incremental updates
const CACHE_KEYS = {
  MEMBERS: 'memberlist_members',
  BENEFIT_RECORDS: 'benefit_records_all',
  LAST_SYNC_TIMESTAMP: 'memberlist_last_sync',
  MEMBERS_HASH: 'memberlist_members_hash',
  BENEFITS_HASH: 'memberlist_benefits_hash'
};

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Simple hash function to detect changes
const generateHash = (data) => {
  return JSON.stringify(data).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
};

// Incremental cache utility
const incrementalCache = {
  // Get cached data
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      const { data, timestamp } = JSON.parse(item);
      if (Date.now() - timestamp > CACHE_DURATION) {
        localStorage.removeItem(key);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  },

  // Set cached data with hash
  set: (key, data) => {
    try {
      const item = {
        data,
        timestamp: Date.now(),
        hash: generateHash(data)
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error('Error writing to cache:', error);
    }
  },

  // Merge new data with existing cache (incremental update)
  mergeMembers: (newMembers) => {
    try {
      const existing = incrementalCache.get(CACHE_KEYS.MEMBERS) || [];
      const existingMap = new Map(existing.map(member => [member.id, member]));

      let hasChanges = false;

      // Merge new members with existing ones
      newMembers.forEach(newMember => {
        const existingMember = existingMap.get(newMember.id);

        if (!existingMember) {
          // New member - add to cache
          existingMap.set(newMember.id, newMember);
          hasChanges = true;
        } else if (existingMember.updated_at !== newMember.updated_at) {
          // Existing member with updates - replace
          existingMap.set(newMember.id, newMember);
          hasChanges = true;
        }
        // If member exists and hasn't changed, keep the existing one
      });

      if (hasChanges) {
        const mergedMembers = Array.from(existingMap.values());
        incrementalCache.set(CACHE_KEYS.MEMBERS, mergedMembers);
        return mergedMembers;
      }

      return existing;
    } catch (error) {
      console.error('Error merging members:', error);
      return newMembers; // Fallback to new data
    }
  },

  // Merge benefit records
  mergeBenefitRecords: (newRecords) => {
    try {
      const existing = incrementalCache.get(CACHE_KEYS.BENEFIT_RECORDS) || [];
      const existingMap = new Map(existing.map(record => [record.id, record]));

      let hasChanges = false;

      newRecords.forEach(newRecord => {
        const existingRecord = existingMap.get(newRecord.id);

        if (!existingRecord) {
          // New record - add to cache
          existingMap.set(newRecord.id, newRecord);
          hasChanges = true;
        }
        // Benefit records are usually immutable, so we don't check for updates
      });

      if (hasChanges) {
        const mergedRecords = Array.from(existingMap.values());
        incrementalCache.set(CACHE_KEYS.BENEFIT_RECORDS, mergedRecords);
        return mergedRecords;
      }

      return existing;
    } catch (error) {
      console.error('Error merging benefit records:', error);
      return newRecords;
    }
  },

  // Check if data has changed on server
  hasDataChanged: (newData, cacheKey) => {
    const cached = incrementalCache.get(cacheKey);
    if (!cached) return true;

    const newHash = generateHash(newData);
    return cached.hash !== newHash;
  },

  // Clear specific cache
  clear: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },

  // Invalidate all cache
  invalidateAll: () => {
    Object.values(CACHE_KEYS).forEach(key => {
      incrementalCache.clear(key);
    });
  }
};

function MemberList() {
  const [members, setMembers] = useState([]);
  const [benefitRecords, setBenefitRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filters, setFilters] = useState({
    status: "approved",
    barangay: "All",
    benefits: "all",
    dateRange: "all",
    sort: "name-asc",
    customDateRange: { start: "", end: "" }
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const navigate = useNavigate();

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Algorithm: Count benefits from benefit_records table
  const calculateMemberBenefits = (membersData, recordsData) => {
    const benefitsCountMap = {};

    recordsData.forEach(record => {
      if (record.user_id) {
        benefitsCountMap[record.user_id] = (benefitsCountMap[record.user_id] || 0) + 1;
      }
    });

    return membersData.map(member => ({
      ...member,
      benefits_received: benefitsCountMap[member.id] || 0,
      benefit_records: recordsData.filter(record => record.user_id === member.id)
    }));
  };

  // Load data with incremental caching
  const loadData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setRefreshing(true);

      // Try to get cached data first
      let cachedMembers = incrementalCache.get(CACHE_KEYS.MEMBERS);
      let cachedBenefitRecords = incrementalCache.get(CACHE_KEYS.BENEFIT_RECORDS);

      // If we have cached data and not forcing refresh, use it while fetching updates
      if (cachedMembers && cachedBenefitRecords && !forceRefresh) {
        setMembers(cachedMembers);
        setBenefitRecords(cachedBenefitRecords);

        // Fetch updates in background
        fetchUpdates();
      } else {
        // No cache or force refresh - do full load
        await fetchFullData();
      }

    } catch (err) {
      console.error("Error loading data:", err);
      // Fallback to cached data if available
      const cachedMembers = incrementalCache.get(CACHE_KEYS.MEMBERS);
      const cachedBenefitRecords = incrementalCache.get(CACHE_KEYS.BENEFIT_RECORDS);

      if (cachedMembers) setMembers(cachedMembers);
      if (cachedBenefitRecords) setBenefitRecords(cachedBenefitRecords);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch full data (initial load or force refresh)
  const fetchFullData = async () => {
    const [membersResponse, recordsResponse] = await Promise.all([
      api.get("/users?role=member"),
      api.get("/benefit-records")
    ]);

    const membersData = membersResponse.data.data || membersResponse.data;
    const recordsData = recordsResponse.data || [];

    // Use incremental cache to store data
    const mergedMembers = incrementalCache.mergeMembers(membersData);
    const mergedRecords = incrementalCache.mergeBenefitRecords(recordsData);

    // Calculate benefits and update state
    const membersWithBenefits = calculateMemberBenefits(mergedMembers, mergedRecords);

    setMembers(membersWithBenefits);
    setBenefitRecords(mergedRecords);
    setLastUpdated(new Date());
  };

  // Fetch only updates (incremental)
  const fetchUpdates = async () => {
    try {
      const [membersResponse, recordsResponse] = await Promise.all([
        api.get("/users?role=member"),
        api.get("/benefit-records")
      ]);

      const membersData = membersResponse.data.data || membersResponse.data;
      const recordsData = recordsResponse.data || [];

      // Merge new data with existing cache
      const mergedMembers = incrementalCache.mergeMembers(membersData);
      const mergedRecords = incrementalCache.mergeBenefitRecords(recordsData);

      // Only update state if there are actual changes
      const currentMembersHash = generateHash(members);
      const newMembersHash = generateHash(mergedMembers);

      if (currentMembersHash !== newMembersHash) {
        const membersWithBenefits = calculateMemberBenefits(mergedMembers, mergedRecords);
        setMembers(membersWithBenefits);
        setBenefitRecords(mergedRecords);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Error fetching updates:", err);
      // Silently fail - we already have cached data
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();

    // Set up periodic updates (every 1 minute)
    const updateInterval = setInterval(() => {
      fetchUpdates();
    }, 60 * 1000);

    // Set up storage event listener for cross-tab sync
    const handleStorageChange = (e) => {
      if (e.key === CACHE_KEYS.MEMBERS || e.key === CACHE_KEYS.BENEFIT_RECORDS) {
        if (e.newValue) {
          const newData = JSON.parse(e.newValue);
          if (newData.data) {
            // Data was updated in another tab, refresh our state
            if (e.key === CACHE_KEYS.MEMBERS) {
              const membersWithBenefits = calculateMemberBenefits(newData.data, benefitRecords);
              setMembers(membersWithBenefits);
            } else if (e.key === CACHE_KEYS.BENEFIT_RECORDS) {
              const membersWithBenefits = calculateMemberBenefits(members, newData.data);
              setBenefitRecords(newData.data);
              setMembers(membersWithBenefits);
            }
            setLastUpdated(new Date());
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(updateInterval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    const oldMembers = [...members];
    try {
      const updatedMembers = members.map((m) =>
        m.id === id ? { ...m, status: newStatus, updated_at: new Date().toISOString() } : m
      );
      setMembers(updatedMembers);

      // Update cache with the changed member
      incrementalCache.mergeMembers(updatedMembers);

      await api.patch(`/user/${id}/status`, { status: newStatus });
    } catch (err) {
      console.error("Failed to update status", err);
      setMembers(oldMembers);
      incrementalCache.set(CACHE_KEYS.MEMBERS, oldMembers);
    }
  };

  // Manual refresh function
  const handleRefresh = () => {
    loadData(true);
  };

  // Navigate to member registration
  const handleAddMember = () => {
    navigate("/member/register");
  };

  // Navigate to member details
  const handleViewMember = (memberId) => {
    navigate(`/members/${memberId}`); // Changed from /user/{id} to /members/{id}
  };

  // Clear all cache (useful for debugging)
  const handleClearCache = () => {
    incrementalCache.invalidateAll();
    loadData(true);
  };

  // Calculate benefits statistics
  const benefitsStats = useMemo(() => {
    const totalBenefits = benefitRecords.length;
    const membersWithBenefits = members.filter(m => m.benefits_received > 0).length;

    const averageBenefits = totalBenefits > 0 && membersWithBenefits > 0
      ? (totalBenefits / membersWithBenefits).toFixed(1)
      : 0;

    const topBeneficiaries = members
      .filter(m => m.benefits_received > 0)
      .sort((a, b) => b.benefits_received - a.benefits_received)
      .slice(0, 5)
      .map(member => ({
        member,
        count: member.benefits_received
      }));

    return {
      totalBenefits,
      membersWithBenefits,
      averageBenefits,
      topBeneficiaries,
      hasBenefits: totalBenefits > 0
    };
  }, [members, benefitRecords]);

  // Filtering and sorting
  const filteredMembers = useMemo(() => {
    let filtered = members.filter((m) => {
      // Status filter
      if (filters.status !== "all" && m.status?.toLowerCase() !== filters.status.toLowerCase()) {
        return false;
      }

      // Barangay filter
      if (filters.barangay !== "All" && m.member_profile?.barangay !== filters.barangay) {
        return false;
      }

      // Search filter
      const term = searchTerm.toLowerCase();
      const fullName = `${m.member_profile?.first_name || ''} ${m.member_profile?.middle_name || ''} ${m.member_profile?.last_name || ''}`.toLowerCase();
      const barangay = m.member_profile?.barangay?.toLowerCase() || '';

      if (!(m.username?.toLowerCase().includes(term) ||
        m.email?.toLowerCase().includes(term) ||
        fullName.includes(term) ||
        barangay.includes(term))) {
        return false;
      }

      // Benefits filter
      if (filters.benefits !== "all") {
        const benefitsCount = m.benefits_received || 0;
        switch (filters.benefits) {
          case "none": if (benefitsCount > 0) return false; break;
          case "1-5": if (benefitsCount < 1 || benefitsCount > 5) return false; break;
          case "6-10": if (benefitsCount < 6 || benefitsCount > 10) return false; break;
          case "10+": if (benefitsCount <= 10) return false; break;
          default: break;
        }
      }

      return true;
    });

    // Sorting
    return filtered.sort((a, b) => {
      const profileA = a.member_profile || {};
      const profileB = b.member_profile || {};

      switch (filters.sort) {
        case "name-asc":
          return `${profileA.first_name} ${profileA.last_name}`.localeCompare(`${profileB.first_name} ${profileB.last_name}`);
        case "name-desc":
          return `${profileB.first_name} ${profileB.last_name}`.localeCompare(`${profileA.first_name} ${profileA.last_name}`);
        case "date-newest":
          return new Date(b.created_at) - new Date(a.created_at);
        case "date-oldest":
          return new Date(a.created_at) - new Date(b.created_at);
        case "barangay-asc":
          return (profileA.barangay || "").localeCompare(profileB.barangay || "");
        case "benefits-desc":
          return (b.benefits_received || 0) - (a.benefits_received || 0);
        case "benefits-asc":
          return (a.benefits_received || 0) - (b.benefits_received || 0);
        default:
          return 0;
      }
    });
  }, [members, filters, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredMembers.slice(indexOfFirstRow, indexOfLastRow);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // Memoized counts
  const statusCounts = useMemo(() => {
    return members.reduce((acc, member) => {
      const status = member.status || "pending";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }, [members]);

  const barangayCounts = useMemo(() => {
    return members.reduce((acc, member) => {
      const barangay = member.member_profile?.barangay || "Unspecified";
      acc[barangay] = (acc[barangay] || 0) + 1;
      return acc;
    }, {});
  }, [members]);

  const availableBarangays = useMemo(() => {
    return [...new Set(members.map(member => member.member_profile?.barangay).filter(Boolean))].sort();
  }, [members]);

  // Options
  const statusOptions = [
    { value: "approved", label: `Active (${statusCounts.approved || 0})` },
    { value: "pending", label: `Pending Review (${statusCounts.pending || 0})` },
    { value: "rejected", label: `Rejected (${statusCounts.rejected || 0})` },
    { value: "inactive", label: `Inactive (${statusCounts.inactive || 0})` },
    { value: "deceased", label: `Deceased (${statusCounts.deceased || 0})` },
  ];

  const benefitsOptions = [
    { value: "all", label: "All Benefits" },
    { value: "none", label: "No Benefits" },
    { value: "1-5", label: "1-5 Benefits" },
    { value: "6-10", label: "6-10 Benefits" },
    { value: "10+", label: "10+ Benefits" }
  ];

  const sortOptions = [
    { value: "name-asc", label: "Name (A-Z)" },
    { value: "name-desc", label: "Name (Z-A)" },
    { value: "date-newest", label: "Newest First" },
    { value: "date-oldest", label: "Oldest First" },
    { value: "barangay-asc", label: "Barangay (A-Z)" },
    { value: "benefits-desc", label: "Most Benefits" },
    { value: "benefits-asc", label: "Fewest Benefits" }
  ];

  const isAnyFilterActive = searchTerm || filters.barangay !== "All" || filters.status !== "approved" ||
    filters.benefits !== "all" || filters.dateRange !== "all";

  const clearAllFilters = () => {
    setSearchTerm("");
    setFilters({
      status: "approved",
      barangay: "All",
      benefits: "all",
      dateRange: "all",
      sort: "name-asc",
      customDateRange: { start: "", end: "" }
    });
  };

  if (loading && !refreshing) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-lg font-medium text-gray-600">Loading Members...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="bg-blue-600 p-3 rounded-xl">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold text-gray-900">Member Management</h1>
                    <button
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className={`flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                      {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>
                  <p className="text-gray-600 mt-2">Manage and review all registered members</p>
                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-600">
                    <span className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                      <Users className="w-4 h-4 text-gray-500" />
                      Total Members: {members.length}
                    </span>
                    <span className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
                      <UserCheck className="w-4 h-4 text-green-600" />
                      Active: {statusCounts.approved || 0}
                    </span>
                    <span className="flex items-center gap-2 bg-purple-100 px-3 py-1 rounded-full">
                      <Award className="w-4 h-4 text-purple-600" />
                      Total Benefits: {benefitsStats.totalBenefits}
                    </span>
                    {lastUpdated && (
                      <span className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full">
                        <RefreshCw className="w-4 h-4 text-blue-600" />
                        Updated: {lastUpdated.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 min-w-[300px]">
                <div className="bg-white border border-gray-200 p-4 rounded-xl text-center">
                  <Users className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-900">{members.length}</div>
                  <div className="text-gray-500 text-xs">Total Members</div>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl text-center">
                  <UserCheck className="w-5 h-5 text-green-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-900">{statusCounts.approved || 0}</div>
                  <div className="text-gray-500 text-xs">Active</div>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl text-center">
                  <Award className="w-5 h-5 text-purple-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-900">{benefitsStats.membersWithBenefits}</div>
                  <div className="text-gray-500 text-xs">With Benefits</div>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl text-center">
                  <RefreshCw className="w-5 h-5 text-gray-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-gray-900">Incremental</div>
                  <div className="text-gray-500 text-xs">Smart Cache</div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Beneficiaries */}
          {benefitsStats.hasBenefits && benefitsStats.topBeneficiaries.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" />
                Top Beneficiaries
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {benefitsStats.topBeneficiaries.map(({ member, count }, index) => {
                  const profile = member.member_profile || {};
                  const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();

                  return (
                    <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full font-semibold text-sm">
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{fullName || "Unnamed Member"}</div>
                        <div className="text-sm text-gray-500">{profile.barangay || "—"}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-purple-600">{count}</div>
                        <div className="text-xs text-gray-500">benefits</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <span className="font-medium">Total Benefits Distributed:</span> {benefitsStats.totalBenefits} •
                <span className="font-medium ml-2">Average per Member:</span> {benefitsStats.averageBenefits}
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Members</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, username, email, or barangay..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className={`flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 font-medium ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={handleAddMember}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 font-medium shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Member
                </button>
              </div>
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="relative">
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full pl-3 pr-10 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Barangay</label>
                <div className="relative">
                  <select
                    value={filters.barangay}
                    onChange={(e) => handleFilterChange('barangay', e.target.value)}
                    className="w-full pl-3 pr-10 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none"
                  >
                    <option value="All">All Barangays</option>
                    {availableBarangays.map(barangay => (
                      <option key={barangay} value={barangay}>
                        {barangay} ({barangayCounts[barangay] || 0})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Benefits</label>
                <select
                  value={filters.benefits}
                  onChange={(e) => handleFilterChange('benefits', e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  {benefitsOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filters Display */}
            {isAnyFilterActive && (
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-700">Active filters:</span>
                {searchTerm && (
                  <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full flex items-center gap-2">
                    Search: "{searchTerm}"
                    <button onClick={() => setSearchTerm("")} className="text-blue-600 hover:text-blue-800">×</button>
                  </span>
                )}
                {filters.barangay !== "All" && (
                  <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full flex items-center gap-2">
                    Barangay: {filters.barangay}
                    <button onClick={() => handleFilterChange('barangay', 'All')} className="text-green-600 hover:text-green-800">×</button>
                  </span>
                )}
                {filters.status !== "approved" && (
                  <span className="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full flex items-center gap-2">
                    Status: {filters.status}
                    <button onClick={() => handleFilterChange('status', 'approved')} className="text-purple-600 hover:text-purple-800">×</button>
                  </span>
                )}
                {filters.benefits !== "all" && (
                  <span className="bg-orange-100 text-orange-800 text-sm px-3 py-1 rounded-full flex items-center gap-2">
                    Benefits: {filters.benefits}
                    <button onClick={() => handleFilterChange('benefits', 'all')} className="text-orange-600 hover:text-orange-800">×</button>
                  </span>
                )}
                <button onClick={clearAllFilters} className="text-sm text-gray-600 hover:text-gray-800 font-medium ml-auto">Clear all</button>
              </div>
            )}
          </div>

          {/* Results Summary */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-gray-700">
              Showing {Math.min(filteredMembers.length, rowsPerPage)} of {filteredMembers.length} members
              {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
            </div>
            {filteredMembers.length > 0 && (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div><span>Active: {statusCounts.approved || 0}</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-yellow-500 rounded-full"></div><span>Pending: {statusCounts.pending || 0}</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full"></div><span>Rejected: {statusCounts.rejected || 0}</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-purple-500 rounded-full"></div><span>With Benefits: {benefitsStats.membersWithBenefits}</span></div>
              </div>
            )}
          </div>

          {/* Members Table */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 font-semibold text-left text-gray-900 text-sm uppercase tracking-wider">Member Information</th>
                    <th className="px-6 py-4 font-semibold text-left text-gray-900 text-sm uppercase tracking-wider">Username & Email</th>
                    <th className="px-6 py-4 font-semibold text-left text-gray-900 text-sm uppercase tracking-wider">Barangay</th>
                    <th className="px-6 py-4 font-semibold text-left text-gray-900 text-sm uppercase tracking-wider">Benefits</th>
                    <th className="px-6 py-4 font-semibold text-left text-gray-900 text-sm uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 font-semibold text-left text-gray-900 text-sm uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentRows.length > 0 ? (
                    currentRows.map((member) => {
                      const profile = member.member_profile || {};
                      const fullName = `${profile.first_name || ""} ${profile.middle_name || ""} ${profile.last_name || ""}`.trim();
                      const benefitsCount = member.benefits_received || 0;

                      return (
                        <tr
                          key={member.id}
                          onClick={() => handleViewMember(member.id)}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Users className="w-4 h-4 text-gray-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{fullName || "Unnamed Member"}</div>
                                <div className="text-xs text-gray-500 mt-1">ID: {member.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <div className="font-medium text-gray-900">@{member.username}</div>
                              <div className="text-sm text-gray-500">{member.email || "—"}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {profile.barangay || "—"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Award className={`w-4 h-4 ${benefitsCount === 0 ? 'text-gray-400' :
                                  benefitsCount <= 5 ? 'text-yellow-500' :
                                    benefitsCount <= 10 ? 'text-orange-500' : 'text-red-500'
                                }`} />
                              <span className={`font-medium ${benefitsCount === 0 ? 'text-gray-500' :
                                  benefitsCount <= 5 ? 'text-yellow-600' :
                                    benefitsCount <= 10 ? 'text-orange-600' : 'text-red-600'
                                }`}>
                                {benefitsCount}
                              </span>
                              {/* Safe percentage calculation */}
                              {benefitsCount > 0 && benefitsStats.totalBenefits > 0 && (
                                <span className="text-xs text-gray-400">
                                  ({((benefitsCount / benefitsStats.totalBenefits) * 100).toFixed(1)}%)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700">{profile.contact_number || "—"}</td>
                          <td className="px-6 py-4">
                            <select
                              value={member.status || "pending"}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleStatusChange(member.id, e.target.value)}
                              className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors"
                            >
                              <option value="approved">Active</option>
                              <option value="pending">Pending Review</option>
                              <option value="inactive">Inactive</option>
                              <option value="rejected">Rejected</option>
                              <option value="deceased">Deceased</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <UserX className="w-16 h-16 mb-4 opacity-40" />
                          <p className="text-lg font-medium text-gray-500 mb-2">No members found</p>
                          <p className="text-sm max-w-md">
                            {isAnyFilterActive ? "Try adjusting your search or filter criteria" : "No members have been registered yet"}
                          </p>
                          {isAnyFilterActive && (
                            <button onClick={clearAllFilters} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">Clear All Filters</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredMembers.length > rowsPerPage && (
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredMembers.length)} of {filteredMembers.length} results
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${currentPage === page ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                          {page}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}

export default MemberList;