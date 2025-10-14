import { useState, useEffect} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Users,
  CalendarCheck2,
  ArrowLeft,
  MapPin,
  Search,
  Filter,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Phone,
  Heart,
  ChevronDown,
  BarChart4,
  Target,
  CalendarClock,
  Printer,
  Ban,
  User,
  Scan
} from "lucide-react";
import api from "./api";
import Layout from "./Layout";

// Cache implementation
const eventCache = new Map();
const membersCache = new Map();
const attendancesCache = new Map();

function Attendances() {
  const [members, setMembers] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [event, setEvent] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [barangayFilter, setBarangayFilter] = useState("All");

  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const eventId = queryParams.get("event_id");

  // Check if event is past due
  const isEventPastDue = (eventDate) => {
    if (!eventDate) return false;
    const today = new Date();
    const eventDateObj = new Date(eventDate);
    today.setHours(0, 0, 0, 0);
    eventDateObj.setHours(0, 0, 0, 0);
    return eventDateObj < today;
  };

  // Check if event is today
  const isEventToday = (eventDate) => {
    if (!eventDate) return false;
    const today = new Date();
    const eventDateObj = new Date(eventDate);
    today.setHours(0, 0, 0, 0);
    eventDateObj.setHours(0, 0, 0, 0);
    return eventDateObj.getTime() === today.getTime();
  };

  // Check if event is upcoming
  const isEventUpcoming = (eventDate) => {
    if (!eventDate) return false;
    const today = new Date();
    const eventDateObj = new Date(eventDate);
    today.setHours(0, 0, 0, 0);
    eventDateObj.setHours(0, 0, 0, 0);
    return eventDateObj > today;
  };

  // Check if printing should be disabled
  const isPrintingDisabled = () => {
    return isEventToday(event?.event_date) || isEventUpcoming(event?.event_date);
  };

  // Format staff name
  const formatStaffName = (scannedBy) => {
    if (!scannedBy) return "—";
    
    if (scannedBy.staff_profile) {
      const profile = scannedBy.staff_profile;
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || scannedBy.username || "—";
    }
    
    return scannedBy.username || "—";
  };

  // Format scanned at timestamp
  const formatScannedAt = (scannedAt) => {
    if (!scannedAt) return "—";
    
    const date = new Date(scannedAt);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format time only for scanned at
  const formatScannedTime = (scannedAt) => {
    if (!scannedAt) return "—";
    
    const date = new Date(scannedAt);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setDataLoaded(false);

        // Check cache for event
        const eventCacheKey = `event-${eventId}`;
        if (eventCache.has(eventCacheKey)) {
          console.log('📦 Using cached event data');
          setEvent(eventCache.get(eventCacheKey));
        } else {
          // Fetch event details
          const eventRes = await api.get(`/events/${eventId}`);
          eventCache.set(eventCacheKey, eventRes.data);
          setEvent(eventRes.data);
        }

        // Check cache for members and attendances
        const membersCacheKey = 'members-all';
        const attendancesCacheKey = `attendances-${eventId}`;

        let membersData, attendanceData;

        // Fetch members from cache or API
        if (membersCache.has(membersCacheKey)) {
          console.log('📦 Using cached members data');
          membersData = membersCache.get(membersCacheKey);
        } else {
          const membersRes = await api.get("/users?role=member");
          membersData = membersRes.data.data || membersRes.data;
          membersCache.set(membersCacheKey, membersData);
        }

        // Fetch attendances from cache or API
        if (attendancesCache.has(attendancesCacheKey)) {
          console.log('📦 Using cached attendances data');
          attendanceData = attendancesCache.get(attendancesCacheKey);
        } else {
          const attendancesRes = await api.get(`/events/${eventId}/attendances`);
          attendanceData = attendancesRes.data.data || attendancesRes.data;
          attendancesCache.set(attendancesCacheKey, attendanceData);
        }

        setMembers(membersData);
        setAttendances(attendanceData);
        setDataLoaded(true);

      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load event or attendance records.");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchAllData();
      // Set up refresh interval only after initial load
      const interval = setInterval(async () => {
        try {
          const attendancesCacheKey = `attendances-${eventId}`;
          const attRes = await api.get(`/events/${eventId}/attendances`);
          const attendanceData = attRes.data.data || attRes.data;
          
          // Update cache and state
          attendancesCache.set(attendancesCacheKey, attendanceData);
          setAttendances(attendanceData);
        } catch (err) {
          console.error("Failed to refresh attendances:", err);
        }
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [eventId]);

  // Filter members based on event's target barangay - ONLY when data is loaded
  const filteredMembersByEventBarangay = dataLoaded ? members.filter(member => {
    if (!event?.target_barangay || event.target_barangay === "All") {
      return true;
    }
    return member.member_profile?.barangay === event.target_barangay;
  }) : [];

  // Combine members with attendance status - ONLY when data is loaded
  const membersWithAttendance = dataLoaded ? filteredMembersByEventBarangay.map(member => {
    const isPresent = attendances.some(attendance =>
      attendance.user?.id === member.id ||
      attendance.user_id === member.id
    );

    const attendanceRecord = attendances.find(attendance =>
      attendance.user?.id === member.id ||
      attendance.user_id === member.id
    );

    let status = "Not Attended";
    let statusVariant = "default";

    if (isPresent) {
      status = "Present";
      statusVariant = "present";
    } else if (isEventToday(event?.event_date)) {
      status = "Expected Today";
      statusVariant = "expected";
    } else if (isEventUpcoming(event?.event_date)) {
      status = "Expected";
      statusVariant = "expected";
    } else if (isEventPastDue(event?.event_date)) {
      status = "Absent";
      statusVariant = "absent";
    }

    return {
      ...member,
      isPresent,
      attendanceRecord,
      status,
      statusVariant,
      scannedBy: attendanceRecord?.scanned_by_user || attendanceRecord?.scanned_by,
      scannedAt: attendanceRecord?.scanned_at || attendanceRecord?.created_at
    };
  }) : [];

  // Apply search filter
  const filteredMembers = dataLoaded ? membersWithAttendance.filter(member => {
    if (!search) return true;

    const fullName = `${member.member_profile?.first_name || ''} ${member.member_profile?.middle_name || ''} ${member.member_profile?.last_name || ''}`.toLowerCase();
    const barangay = member.member_profile?.barangay?.toLowerCase() || '';
    const username = member.username?.toLowerCase() || '';
    const guardianName = member.member_profile?.guardian_full_name?.toLowerCase() || '';
    const scannedByName = formatStaffName(member.scannedBy).toLowerCase();

    return fullName.includes(search.toLowerCase()) ||
      barangay.includes(search.toLowerCase()) ||
      username.includes(search.toLowerCase()) ||
      guardianName.includes(search.toLowerCase()) ||
      scannedByName.includes(search.toLowerCase());
  }) : [];

  // Apply barangay filter
  const finalFilteredMembers = dataLoaded ? (barangayFilter === "All"
    ? filteredMembers
    : filteredMembers.filter(member => member.member_profile?.barangay === barangayFilter)
  ) : [];

  // Statistics - ONLY when data is loaded
  const totalMembers = dataLoaded ? filteredMembersByEventBarangay.length : 0;
  const presentCount = dataLoaded ? membersWithAttendance.filter(m => m.isPresent).length : 0;
  const expectedOrAbsentCount = dataLoaded ? totalMembers - presentCount : 0;
  const attendanceRate = dataLoaded && totalMembers > 0 ? (presentCount / totalMembers * 100).toFixed(1) : 0;

  // Determine the label for the third statistic card
  const getThirdStatLabel = () => {
    if (isEventPastDue(event?.event_date)) return "Absent";
    if (isEventToday(event?.event_date)) return "Expected Today";
    return "Expected";
  };

  // Barangay counts for filter (only from event's target barangay)
  const barangayCounts = dataLoaded ? filteredMembersByEventBarangay.reduce((acc, member) => {
    const barangay = member.member_profile?.barangay || "Unspecified";
    acc[barangay] = (acc[barangay] || 0) + 1;
    return acc;
  }, {}) : {};

  // Get available barangays from the filtered members
  const availableBarangays = dataLoaded ? [...new Set(
    filteredMembersByEventBarangay
      .map(member => member.member_profile?.barangay)
      .filter(Boolean)
  )].sort() : [];

  // Format birthdate
  const formatBirthdate = (birthdate) => {
    if (!birthdate) return "—";
    return new Date(birthdate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate age from birthdate
  const calculateAge = (birthdate) => {
    if (!birthdate) return "—";
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Generate PDF Report
  const generatePDF = () => {
    // Store current data for printing
    const printData = {
      event,
      members: finalFilteredMembers,
      filters: {
        search,
        barangayFilter
      },
      statistics: {
        totalMembers,
        presentCount,
        expectedOrAbsentCount,
        attendanceRate,
        thirdStatLabel: getThirdStatLabel()
      }
    };

    // Navigate to print page
    navigate(`/events/${eventId}/attendance/print`, { 
      state: printData 
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 border-8 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-xl font-semibold text-blue-600 animate-pulse">
              Loading Attendance...
            </p>
            <p className="text-gray-600 text-sm mt-2">Please wait a moment 🎟️</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => navigate("/events")}
              className="mt-4 inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Events
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 py-8 px-4">
        {/* Background Decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow delay-1000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
              <div className="flex items-start gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl shadow-lg">
                  <CalendarCheck2 className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Attendance Records
                  </h1>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        {event?.title || `Event #${eventId}`}
                      </h2>
                    </div>
                    
                    {event && (
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          {new Date(event.event_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                        <span className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
                          <Clock className="w-4 h-4 text-green-500" />
                          {event.event_time
                            ? new Date(`1970-01-01T${event.event_time}`).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })
                            : "—"}
                        </span>
                        <span className="flex items-center gap-2 bg-purple-50 px-3 py-1 rounded-full">
                          <MapPin className="w-4 h-4 text-purple-500" />
                          {event.location}
                        </span>
                        <span className="flex items-center gap-2 bg-orange-50 px-3 py-1 rounded-full">
                          <Target className="w-4 h-4 text-orange-500" />
                          Barangay: {event.target_barangay || "All Barangays"}
                        </span>
                        <span className={`flex items-center gap-2 px-3 py-1 rounded-full font-semibold ${
                          isEventPastDue(event.event_date)
                            ? "bg-red-100 text-red-700"
                            : isEventToday(event.event_date)
                            ? "bg-orange-100 text-orange-700"
                            : "bg-green-100 text-green-700"
                        }`}>
                          <CalendarClock className="w-4 h-4" />
                          {isEventPastDue(event.event_date)
                            ? "Past Due"
                            : isEventToday(event.event_date)
                            ? "Today"
                            : "Upcoming"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 min-w-[400px]">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-5 rounded-2xl shadow-lg text-center">
                  <Users className="w-7 h-7 mx-auto mb-3 opacity-90" />
                  <div className="text-2xl font-bold">{totalMembers}</div>
                  <div className="text-blue-100 text-xs font-medium">Total Members</div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-5 rounded-2xl shadow-lg text-center">
                  <UserCheck className="w-7 h-7 mx-auto mb-3 opacity-90" />
                  <div className="text-2xl font-bold">{presentCount}</div>
                  <div className="text-green-100 text-xs font-medium">Present</div>
                </div>
                <div className={`p-5 rounded-2xl shadow-lg text-center text-white ${
                  isEventPastDue(event?.event_date)
                    ? "bg-gradient-to-br from-red-500 to-red-600"
                    : isEventToday(event?.event_date)
                    ? "bg-gradient-to-br from-orange-500 to-orange-600"
                    : "bg-gradient-to-br from-yellow-500 to-yellow-600"
                }`}>
                  <UserX className="w-7 h-7 mx-auto mb-3 opacity-90" />
                  <div className="text-2xl font-bold">{expectedOrAbsentCount}</div>
                  <div className="text-opacity-90 text-xs font-medium">
                    {getThirdStatLabel()}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-5 rounded-2xl shadow-lg text-center">
                  <BarChart4 className="w-7 h-7 mx-auto mb-3 opacity-90" />
                  <div className="text-2xl font-bold">{attendanceRate}%</div>
                  <div className="text-purple-100 text-xs font-medium">Attendance Rate</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-end gap-6">
              {/* Search */}
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Search Members
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, username, guardian name, or scanned by..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl 
                             bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 
                             focus:border-blue-500 transition-all duration-200 placeholder-gray-400
                             shadow-sm hover:shadow-md focus:shadow-lg"
                  />
                </div>
              </div>

              {/* Barangay Filter */}
              <div className="w-full lg:w-64">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Filter by Barangay
                </label>
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={barangayFilter}
                    onChange={(e) => setBarangayFilter(e.target.value)}
                    className="w-full pl-12 pr-10 py-4 border border-gray-200 rounded-2xl 
                             bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 
                             focus:border-blue-500 transition-all duration-200 appearance-none
                             shadow-sm hover:shadow-md focus:shadow-lg"
                  >
                    <option value="All">All Barangays</option>
                    {availableBarangays.map(barangay => (
                      <option key={barangay} value={barangay}>
                        {barangay} ({barangayCounts[barangay] || 0})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Print Button */}
              <button
                onClick={generatePDF}
                disabled={finalFilteredMembers.length === 0 || isPrintingDisabled()}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 
                         hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 
                         text-white rounded-2xl transition-all duration-200 font-semibold shadow-lg
                         hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none relative group"
              >
                {isPrintingDisabled() ? (
                  <>
                    <Ban className="w-5 h-5" />
                    Printing Disabled
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {isEventToday(event?.event_date) 
                          ? "Printing available after event ends" 
                          : "Printing available after event date"}
                    </div>
                  </>
                ) : (
                  <>
                    <Printer className="w-5 h-5" />
                    Print Report
                  </>
                )}
              </button>
            </div>

            {/* Print Disabled Warning */}
            {isPrintingDisabled() && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-start gap-3">
                <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Ban className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-yellow-800 font-medium text-sm">
                    Printing temporarily disabled
                  </p>
                  <p className="text-yellow-700 text-sm mt-1">
                    {isEventToday(event?.event_date) 
                      ? "Printing will be available after the event ends today. This ensures accurate attendance records." 
                      : "Printing will be available after the event date. This ensures accurate attendance records."}
                  </p>
                </div>
              </div>
            )}

            {/* Active Filters */}
            {(search || barangayFilter !== "All") && (
              <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-gray-100">
                <span className="text-sm font-semibold text-gray-600">Active filters:</span>
                
                {search && (
                  <span className="bg-blue-100 text-blue-800 text-sm px-4 py-2 rounded-full flex items-center gap-2 font-medium">
                    Search: "{search}"
                    <button 
                      onClick={() => setSearch("")} 
                      className="text-blue-600 hover:text-blue-800 font-bold text-lg leading-none"
                    >
                      ×
                    </button>
                  </span>
                )}

                {barangayFilter !== "All" && (
                  <span className="bg-purple-100 text-purple-800 text-sm px-4 py-2 rounded-full flex items-center gap-2 font-medium">
                    Barangay: {barangayFilter}
                    <button 
                      onClick={() => setBarangayFilter("All")} 
                      className="text-purple-600 hover:text-purple-800 font-bold text-lg leading-none"
                    >
                      ×
                    </button>
                  </span>
                )}

                <button
                  onClick={() => {
                    setSearch("");
                    setBarangayFilter("All");
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800 font-semibold underline ml-auto"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Results Summary */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-lg font-semibold text-gray-700">
                {finalFilteredMembers.length} of {totalMembers} members
              </span>
              {event?.target_barangay && event.target_barangay !== "All" && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  From {event.target_barangay}
                </span>
              )}
              {barangayFilter !== "All" && (
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  Filtered by: {barangayFilter}
                </span>
              )}
            </div>
            
            {finalFilteredMembers.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Present: {presentCount}</span>
                <div className="w-2 h-2 bg-red-500 rounded-full ml-2"></div>
                <span>{getThirdStatLabel()}: {expectedOrAbsentCount}</span>
              </div>
            )}
          </div>

          {/* Members Attendance Table */}
          <section className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <th className="px-8 py-5 font-semibold text-left text-sm uppercase tracking-wider">
                      Member Information
                    </th>
                    <th className="px-8 py-5 font-semibold text-left text-sm uppercase tracking-wider">
                      Birthdate & Age
                    </th>
                    <th className="px-8 py-5 font-semibold text-left text-sm uppercase tracking-wider">
                      Sex
                    </th>
                    <th className="px-8 py-5 font-semibold text-left text-sm uppercase tracking-wider">
                      Guardian
                    </th>
                    <th className="px-8 py-5 font-semibold text-left text-sm uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-8 py-5 font-semibold text-left text-sm uppercase tracking-wider">
                      Disability
                    </th>
                    <th className="px-8 py-5 font-semibold text-left text-sm uppercase tracking-wider">
                      Scanned By
                    </th>
                    <th className="px-8 py-5 font-semibold text-left text-sm uppercase tracking-wider">
                      Scanned At
                    </th>
                    <th className="px-8 py-5 font-semibold text-left text-sm uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {finalFilteredMembers.length > 0 ? (
                    finalFilteredMembers.map((member) => (
                      <tr
                        key={member.id}
                        className="hover:bg-gray-50/80 transition-all duration-150 group"
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {`${member.member_profile?.first_name || ''} ${member.member_profile?.middle_name || ''} ${member.member_profile?.last_name || ''}`.trim() || member.username}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                @{member.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-gray-700">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {formatBirthdate(member.member_profile?.birthdate)}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              Age: {calculateAge(member.member_profile?.birthdate)}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {member.member_profile?.sex || "—"}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Heart className="w-4 h-4 text-gray-400" />
                            {member.member_profile?.guardian_full_name || "—"}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          {member.member_profile?.guardian_contact_number ? (
                            <div className="flex items-center gap-2 text-gray-700">
                              <Phone className="w-4 h-4 text-gray-400" />
                              {member.member_profile.guardian_contact_number}
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-8 py-5">
                          {member.member_profile?.disability_type ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                              {member.member_profile.disability_type}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-8 py-5">
                          {member.isPresent ? (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-green-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 text-sm">
                                  {formatStaffName(member.scannedBy)}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-8 py-5">
                          {member.isPresent ? (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Scan className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 text-sm">
                                  {formatScannedAt(member.scannedAt)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatScannedTime(member.scannedAt)}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-8 py-5">
                          {member.statusVariant === "present" ? (
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
                              <CheckCircle className="w-4 h-4" />
                              {member.status}
                            </span>
                          ) : member.statusVariant === "expected" ? (
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                              <Clock className="w-4 h-4" />
                              {member.status}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-red-100 text-red-800 border border-red-200">
                              <XCircle className="w-4 h-4" />
                              {member.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-8 py-16 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <Users className="w-20 h-20 mb-4 opacity-40" />
                          <p className="text-xl font-semibold text-gray-500 mb-2">No members found</p>
                          <p className="text-sm max-w-md">
                            {search || barangayFilter !== "All"
                              ? "Try adjusting your search or filter criteria"
                              : event?.target_barangay && event.target_barangay !== "All"
                                ? `No members found in ${event.target_barangay}`
                                : "No members available for this event"
                            }
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Back Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate("/events")}
              className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 
                       hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-2xl 
                       shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95
                       hover:shadow-2xl"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Events Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Add custom animations */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
        .animate-pulse-slow { animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}</style>
    </Layout>
  );
}

export default Attendances;