import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Users,
  CalendarCheck2,
  ArrowLeft,
  MapPin,
  Search,
  Filter,
  Download,
  UserCheck,
  UserX,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Phone,
  Heart
} from "lucide-react";
import api from "./api";
import Layout from "./Layout";

// Barangay options for consistent filtering
const barangayOptions = [
  "All", "Awang", "Bagocboc", "Barra", "Bonbon", "Cauyonan", "Igpit",
  "Limonda", "Luyong Bonbon", "Malanang", "Nangcaon", "Patag",
  "Poblacion", "Taboc", "Tingalan"
];

function Attendances() {
  const [members, setMembers] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [event, setEvent] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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
    // Set both dates to midnight for accurate comparison
    today.setHours(0, 0, 0, 0);
    eventDateObj.setHours(0, 0, 0, 0);
    return eventDateObj < today;
  };

  // Check if event is today
  const isEventToday = (eventDate) => {
    if (!eventDate) return false;
    const today = new Date();
    const eventDateObj = new Date(eventDate);
    // Set both dates to midnight for accurate comparison
    today.setHours(0, 0, 0, 0);
    eventDateObj.setHours(0, 0, 0, 0);
    return eventDateObj.getTime() === today.getTime();
  };

  // Check if event is upcoming
  const isEventUpcoming = (eventDate) => {
    if (!eventDate) return false;
    const today = new Date();
    const eventDateObj = new Date(eventDate);
    // Set both dates to midnight for accurate comparison
    today.setHours(0, 0, 0, 0);
    eventDateObj.setHours(0, 0, 0, 0);
    return eventDateObj > today;
  };

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const response = await api.get("/users?role=member");
        const membersData = response.data.data || response.data;
        setMembers(membersData);
      } catch (err) {
        console.error("Failed to fetch members:", err);
        setError("Failed to load members.");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchMembers();
    }
  }, [eventId]);

  useEffect(() => {
    const fetchEventAndAttendances = async () => {
      try {
        // Fetch event details
        const eventRes = await api.get(`/events/${eventId}`);
        setEvent(eventRes.data);

        // Fetch attendances for this event
        const attRes = await api.get(`/events/${eventId}/attendances`);
        const attendanceData = attRes.data.data || attRes.data;
        setAttendances(attendanceData);
      } catch (err) {
        console.error("Failed to fetch event or attendances:", err);
        setError("Failed to load event or attendance records.");
      }
    };

    if (eventId) {
      fetchEventAndAttendances();
      const interval = setInterval(fetchEventAndAttendances, 5000);
      return () => clearInterval(interval);
    }
  }, [eventId]);

  // Filter members based on event's target barangay
  const filteredMembersByEventBarangay = members.filter(member => {
    if (!event?.target_barangay || event.target_barangay === "All") {
      return true; // Show all members if event is for all barangays
    }

    // Check if member's barangay matches event's target barangay
    return member.member_profile?.barangay === event.target_barangay;
  });

  // Combine members with attendance status
  const membersWithAttendance = filteredMembersByEventBarangay.map(member => {
    const isPresent = attendances.some(attendance =>
      attendance.user?.id === member.id ||
      attendance.user_id === member.id
    );

    const attendanceRecord = attendances.find(attendance =>
      attendance.user?.id === member.id ||
      attendance.user_id === member.id
    );

    // Determine status based on event date
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
      statusVariant
    };
  });

  // Apply search filter
  const filteredMembers = membersWithAttendance.filter(member => {
    if (!search) return true;

    const fullName = `${member.member_profile?.first_name || ''} ${member.member_profile?.middle_name || ''} ${member.member_profile?.last_name || ''}`.toLowerCase();
    const barangay = member.member_profile?.barangay?.toLowerCase() || '';
    const username = member.username?.toLowerCase() || '';
    const guardianName = member.member_profile?.guardian_full_name?.toLowerCase() || '';

    return fullName.includes(search.toLowerCase()) ||
      barangay.includes(search.toLowerCase()) ||
      username.includes(search.toLowerCase()) ||
      guardianName.includes(search.toLowerCase());
  });

  // Apply barangay filter
  const finalFilteredMembers = barangayFilter === "All"
    ? filteredMembers
    : filteredMembers.filter(member => member.member_profile?.barangay === barangayFilter);

  // Statistics
  const totalMembers = filteredMembersByEventBarangay.length;
  const presentCount = membersWithAttendance.filter(m => m.isPresent).length;
  const expectedOrAbsentCount = totalMembers - presentCount;
  const attendanceRate = totalMembers > 0 ? (presentCount / totalMembers * 100).toFixed(1) : 0;

  // Determine the label for the third statistic card
  const getThirdStatLabel = () => {
    if (isEventPastDue(event?.event_date)) return "Absent";
    if (isEventToday(event?.event_date)) return "Expected Today";
    return "Expected";
  };

  // Determine the color for the third statistic card
  const getThirdStatColor = () => {
    if (isEventPastDue(event?.event_date)) return "red";
    if (isEventToday(event?.event_date)) return "orange";
    return "yellow";
  };

  // Barangay counts for filter (only from event's target barangay)
  const barangayCounts = filteredMembersByEventBarangay.reduce((acc, member) => {
    const barangay = member.member_profile?.barangay || "Unspecified";
    acc[barangay] = (acc[barangay] || 0) + 1;
    return acc;
  }, {});

  // Get available barangays from the filtered members
  const availableBarangays = [...new Set(
    filteredMembersByEventBarangay
      .map(member => member.member_profile?.barangay)
      .filter(Boolean)
  )].sort();

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

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Full Name", "Birthdate", "Age", "Sex", "Guardian Name", "Guardian Contact", "Disability Type", "Status"];
    const csvData = finalFilteredMembers.map(member => {
      const fullName = `${member.member_profile?.first_name || ""} ${member.member_profile?.middle_name || ""} ${member.member_profile?.last_name || ""}`.trim();
      const birthdate = member.member_profile?.birthdate || "—";
      const age = calculateAge(birthdate);
      const sex = member.member_profile?.sex || "—";
      const guardianName = member.member_profile?.guardian_full_name || "—";
      const guardianContact = member.member_profile?.guardian_contact_number || "—";
      const disabilityType = member.member_profile?.disability_type || "—";
      const status = member.status;

      return [
        `"${fullName}"`,
        birthdate !== "—" ? formatBirthdate(birthdate) : "—",
        age !== "—" ? age : "—",
        sex,
        `"${guardianName}"`,
        guardianContact,
        disabilityType,
        status
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-${event?.title || eventId}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
          <div className="w-20 h-20 border-8 border-purple-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-xl font-semibold text-blue-600 animate-pulse">
            Loading Attendance...
          </p>
          <p className="text-gray-600 text-sm">Please wait a moment 🎟️</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen text-red-600 font-bold text-lg">
          {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-10 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-2xl">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Attendance Records
                  </h1>
                  <h2 className="text-lg font-medium text-gray-600 mt-2">
                    <span className="flex items-center gap-2 mb-1">
                      <CalendarCheck2 className="w-5 h-5 text-blue-500" />
                      Event: {event?.title || `#${eventId}`}
                    </span>
                    {event && (
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-2">
                        <span>
                          {new Date(event.event_date).toLocaleDateString()} at{" "}
                          {event.event_time
                            ? new Date(`1970-01-01T${event.event_time}`).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })
                            : "—"}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                          {event.location}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-4 h-4 text-gray-400 mr-1" />
                          Barangay: {event.target_barangay || "All Barangays"}
                        </span>
                        <span
                          className={`font-semibold ${isEventPastDue(event.event_date)
                              ? "text-red-600"
                              : isEventToday(event.event_date)
                                ? "text-orange-600"
                                : "text-green-600"
                            }`}
                        >
                          {isEventPastDue(event.event_date)
                            ? "Past Due"
                            : isEventToday(event.event_date)
                              ? "Today"
                              : "Upcoming"}
                        </span>
                      </div>
                    )}
                  </h2>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 min-w-[400px]">
                <div className="bg-blue-50 p-4 rounded-xl text-center">
                  <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">{totalMembers}</div>
                  <div className="text-xs text-blue-800">Total Members</div>
                </div>
                <div className="bg-green-50 p-4 rounded-xl text-center">
                  <UserCheck className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">{presentCount}</div>
                  <div className="text-xs text-green-800">Present</div>
                </div>
                <div className={`p-4 rounded-xl text-center ${getThirdStatColor() === "red" ? "bg-red-50" :
                    getThirdStatColor() === "orange" ? "bg-orange-50" : "bg-yellow-50"
                  }`}>
                  <UserX className={`w-6 h-6 mx-auto mb-2 ${getThirdStatColor() === "red" ? "text-red-600" :
                      getThirdStatColor() === "orange" ? "text-orange-600" : "text-yellow-600"
                    }`} />
                  <div className={`text-2xl font-bold ${getThirdStatColor() === "red" ? "text-red-600" :
                      getThirdStatColor() === "orange" ? "text-orange-600" : "text-yellow-600"
                    }`}>
                    {expectedOrAbsentCount}
                  </div>
                  <div className={`text-xs ${getThirdStatColor() === "red" ? "text-red-800" :
                      getThirdStatColor() === "orange" ? "text-orange-800" : "text-yellow-800"
                    }`}>
                    {getThirdStatLabel()}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl text-center">
                  <BarChart3 className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">{attendanceRate}%</div>
                  <div className="text-xs text-purple-800">Attendance Rate</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-end gap-6">
              {/* Search */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Search Members
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, username, or guardian name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>



              {/* Export Button */}
              <button
                onClick={exportToCSV}
                disabled={finalFilteredMembers.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl transition-colors duration-200 font-medium"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            {/* Active Filters */}
            <div className="flex flex-wrap gap-2 mt-4">
              {(search || barangayFilter !== "All") && (
                <span className="text-sm text-gray-600 font-medium">Active filters:</span>
              )}

              {search && (
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full flex items-center gap-2">
                  Search: "{search}"
                  <button onClick={() => setSearch("")} className="text-blue-600 hover:text-blue-800 font-bold">
                    ×
                  </button>
                </span>
              )}

              {barangayFilter !== "All" && (
                <span className="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full flex items-center gap-2">
                  Barangay: {barangayFilter}
                  <button onClick={() => setBarangayFilter("All")} className="text-purple-600 hover:text-purple-800 font-bold">
                    ×
                  </button>
                </span>
              )}

              {(search || barangayFilter !== "All") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setBarangayFilter("All");
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium underline"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Results Summary */}
          <div className="mb-4 text-sm text-gray-600 flex items-center gap-4">
            <span>
              Showing {finalFilteredMembers.length} of {totalMembers} members
              {event?.target_barangay && event.target_barangay !== "All" && (
                ` from ${event.target_barangay}`
              )}
            </span>
            {barangayFilter !== "All" && (
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                Filtered by: {barangayFilter}
              </span>
            )}
          </div>

          {/* Members Attendance Table */}
          <section className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white uppercase">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Full Name</th>
                    <th className="px-6 py-4 font-semibold">Birthdate & Age</th>
                    <th className="px-6 py-4 font-semibold">Sex</th>
                    <th className="px-6 py-4 font-semibold">Guardian Name</th>
                    <th className="px-6 py-4 font-semibold">Guardian Contact</th>
                    <th className="px-6 py-4 font-semibold">Disability Type</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {finalFilteredMembers.length > 0 ? (
                    finalFilteredMembers.map((member) => (
                      <tr
                        key={member.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {`${member.member_profile?.first_name || ''} ${member.member_profile?.middle_name || ''} ${member.member_profile?.last_name || ''}`.trim() || member.username}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              {formatBirthdate(member.member_profile?.birthdate)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Age: {calculateAge(member.member_profile?.birthdate)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {member.member_profile?.sex || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          <div className="flex items-center gap-1">
                            <Heart className="w-3 h-3 text-gray-400" />
                            {member.member_profile?.guardian_full_name || "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {member.member_profile?.guardian_contact_number ? (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-gray-400" />
                              {member.member_profile.guardian_contact_number}
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {member.member_profile?.disability_type ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              {member.member_profile.disability_type}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {member.statusVariant === "present" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3" />
                              {member.status}
                            </span>
                          ) : member.statusVariant === "expected" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Clock className="w-3 h-3" />
                              {member.status}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3" />
                              {member.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Users className="w-16 h-16 mb-4 text-gray-300" />
                          <p className="text-lg font-medium mb-2">No members found</p>
                          <p className="text-sm">
                            {search || barangayFilter !== "All"
                              ? "Try adjusting your search or filter criteria"
                              : event?.target_barangay && event.target_barangay !== "All"
                                ? `No members found in ${event.target_barangay}`
                                : "No members found"
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
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Events
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Attendances;