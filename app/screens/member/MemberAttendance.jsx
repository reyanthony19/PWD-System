import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import api from "@/services/api";
import { LinearGradient } from "expo-linear-gradient";

export default function MemberAttendance() {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId, eventTitle } = route.params || {};

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [userAttendance, setUserAttendance] = useState(null);
  const [userAttendanceStatus, setUserAttendanceStatus] = useState("unknown");

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser && eventId) {
      fetchData();
    }
  }, [eventId, currentUser]);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      setError("");
      
      // Fetch event details and user attendance in parallel
      await Promise.all([
        fetchEventDetails(),
        fetchUserAttendance()
      ]);

    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load event data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchEventDetails = async () => {
    try {
      const eventRes = await api.get(`/events/${eventId}`);
      setEvent(eventRes.data);
    } catch (err) {
      console.error("Event fetch error:", err);
      throw new Error("Failed to load event details");
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const userRes = await api.get("/user");
      setCurrentUser(userRes.data);
    } catch (error) {
      console.error("Error fetching current user:", error);
      setError("Failed to load user information");
    }
  };

  const fetchUserAttendance = async () => {
    try {
      if (!currentUser?.id || !eventId) {
        console.log("Missing user ID or event ID");
        determineStatusByEventDate();
        return;
      }

      console.log(`Checking attendance for user ${currentUser.id} in event ${eventId}`);
      
      // Use your specific endpoint to check user attendance
      const attendanceRes = await api.get(`/attendances/${eventId}/user/${currentUser.id}`);
      const attendanceData = attendanceRes.data;
      
      console.log("Attendance API response:", attendanceData);

      if (attendanceData.attended && attendanceData.attendance) {
        // User attended the event
        setUserAttendance(attendanceData.attendance);
        setUserAttendanceStatus("present");
        console.log("User attendance marked as PRESENT");
      } else {
        // User did not attend - check event date to determine status
        determineStatusByEventDate();
      }

    } catch (error) {
      console.error("Error fetching user attendance:", error);
      
      // If the endpoint returns 404 or error, check event date
      determineStatusByEventDate();
    }
  };

  const determineStatusByEventDate = () => {
    if (!event) {
      setUserAttendanceStatus("unknown");
      return;
    }

    const currentDate = new Date();
    const eventDate = new Date(event.event_date);
    const isPastEvent = currentDate > eventDate;

    console.log(`Event date: ${eventDate}, Current date: ${currentDate}, Is past: ${isPastEvent}`);

    if (isPastEvent) {
      // Event is over and no attendance record found = absent
      setUserAttendanceStatus("absent");
      console.log("Event is past - marking as ABSENT");
    } else {
      // Event is ongoing or future = unknown (attendance might not be recorded yet)
      setUserAttendanceStatus("unknown");
      console.log("Event is not past - marking as UNKNOWN");
    }
  };

  const getEventStatus = () => {
    if (!event) return "unknown";
    
    const currentDate = new Date();
    const eventDate = new Date(event.event_date);
    
    if (currentDate.toDateString() === eventDate.toDateString()) {
      return "today";
    } else if (currentDate > eventDate) {
      return "past";
    } else {
      return "upcoming";
    }
  };

  const getUserAttendanceBadge = () => {
    const eventStatus = getEventStatus();
    
    // For upcoming events, always show upcoming status
    if (eventStatus === "upcoming") {
      return {
        status: "Upcoming Event",
        color: "#f59e0b",
        icon: "time-outline",
        message: "This event is scheduled for the future"
      };
    }
    
    // For today's or past events, show actual attendance status
    switch (userAttendanceStatus) {
      case "present":
        return {
          status: "Attended",
          color: "#10b981",
          icon: "checkmark-circle",
          message: eventStatus === "today" 
            ? "You have attended this event today" 
            : "You attended this event"
        };
      case "absent":
        return {
          status: "Not Attended",
          color: "#ef4444",
          icon: "close-circle",
          message: eventStatus === "today"
            ? ""
            : ""
        };
      case "unknown":
      default:
        if (eventStatus === "today") {
          return {
            status: "Attendance Pending",
            color: "#f59e0b",
            icon: "time-outline",
            message: "Attendance recording in progress or not yet scanned"
          };
        } else {
          return {
            status: "Status Unknown",
            color: "#6b7280",
            icon: "help-circle",
            message: "Attendance status not available"
          };
        }
    }
  };

  const renderAttendanceRecord = () => {
    const attendanceBadge = getUserAttendanceBadge();
    const eventStatus = getEventStatus();

    return (
      <View style={styles.attendanceCard}>
        <Text style={styles.attendanceTitle}>Your Attendance Record</Text>
        
        <View style={styles.attendanceStatus}>
          <View style={[styles.statusBadge, { backgroundColor: `${attendanceBadge.color}20` }]}>
            <Ionicons name={attendanceBadge.icon} size={24} color={attendanceBadge.color} />
            <Text style={[styles.statusText, { color: attendanceBadge.color }]}>
              {attendanceBadge.status}
            </Text>
          </View>
          
          <Text style={styles.statusMessage}>{attendanceBadge.message}</Text>
        </View>

        {userAttendance && (
          <View style={styles.attendanceDetails}>
            <Text style={styles.detailsTitle}>Attendance Details</Text>
            
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="time" size={16} color="#6b7280" />
                <Text style={styles.detailLabel}>Checked in:</Text>
                <Text style={styles.detailValue}>
                  {userAttendance.scanned_at 
                    ? new Date(userAttendance.scanned_at).toLocaleString()
                    : "Not recorded"
                  }
                </Text>
              </View>
            </View>

            {userAttendance.scanned_by && (
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="person" size={16} color="#6b7280" />
                  <Text style={styles.detailLabel}>Verified by:</Text>
                  <Text style={styles.detailValue}>
                    {userAttendance.scanned_by?.staff_profile 
                      ? `${userAttendance.scanned_by.staff_profile.first_name} ${userAttendance.scanned_by.staff_profile.last_name}`
                      : userAttendance.scanned_by?.username || "Staff"
                    }
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Show appropriate notices based on status */}
        {eventStatus === "today" && userAttendanceStatus === "unknown" && (
          <View style={styles.infoNotice}>
            <Ionicons name="information-circle" size={20} color="#3b82f6" />
            <Text style={styles.infoText}>
              If you attended this event but don't see your attendance record, 
              please check with the event staff for scanning.
            </Text>
          </View>
        )}

        {eventStatus === "past" && userAttendanceStatus === "absent" && (
          <View style={styles.absentNotice}>
            <Ionicons name="information-circle" size={20} color="#f59e0b" />
            <Text style={styles.absentText}>
              You Did Not attend this event.
            </Text>
          </View>
        )}

        {eventStatus === "today" && userAttendanceStatus === "absent" && (
          <View style={styles.absentNotice}>
            <Ionicons name="information-circle" size={20} color="#f59e0b" />
            <Text style={styles.absentText}>
              Please check with event staff to get your attendance recorded.
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderEventDetails = () => {
    if (!event) return null;

    const eventDate = new Date(event.event_date);
    const eventStatus = getEventStatus();

    return (
      <View style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <View style={styles.eventIcon}>
            <Ionicons name="calendar" size={28} color="#2563eb" />
          </View>
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.eventStatus}>
              {eventStatus === "today" ? "Happening Today" : 
               eventStatus === "past" ? "Completed Event" : "Upcoming Event"}
            </Text>
          </View>
        </View>

        <View style={styles.eventDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="calendar-clock" size={20} color="#6b7280" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>
                  {eventDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="time" size={20} color="#6b7280" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>
                  {eventDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="location" size={20} color="#6b7280" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{event.location || "Not specified"}</Text>
              </View>
            </View>
          </View>

          {event.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionLabel}>Description</Text>
              <Text style={styles.descriptionText}>{event.description}</Text>
            </View>
          )}

          {event.target_barangay && (
            <View style={styles.barangayContainer}>
              <Ionicons name="map" size={16} color="#3b82f6" />
              <Text style={styles.barangayText}>Target Barangay: {event.target_barangay}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading Event Details...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#fff" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={fetchData}
            colors={["#fff"]}
            tintColor="#fff"
          />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Event Attendance</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Event Details Card */}
        {renderEventDetails()}

        {/* Attendance Record Card */}
        {renderAttendanceRecord()}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  scrollView: {
    flex: 1,
    padding: 16
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { 
    marginTop: 12, 
    color: "#fff",
    fontSize: 16,
    fontWeight: '600'
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  errorText: { 
    color: "#fff",
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  retryText: {
    color: '#fff',
    fontWeight: '600'
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 10
  },
  backButton: {
    padding: 8
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
  },
  headerRight: {
    width: 40
  },

  // Event Card
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  eventIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  eventInfo: {
    flex: 1
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4
  },
  eventStatus: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic'
  },
  eventDetails: {
    gap: 16
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1
  },
  detailTextContainer: {
    marginLeft: 12,
    flex: 1
  },
  detailLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500'
  },
  descriptionContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6'
  },
  descriptionLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4
  },
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20
  },
  barangayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6'
  },
  barangayText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
    marginLeft: 8
  },

  // Attendance Card
  attendanceCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12
  },
  attendanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16
  },
  attendanceStatus: {
    alignItems: 'center',
    marginBottom: 20
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 12
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8
  },
  statusMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20
  },
  attendanceDetails: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6'
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12
  },
  detailRow: {
    marginBottom: 12
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    marginRight: 4
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500'
  },
  infoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 12
  },
  infoText: {
    fontSize: 12,
    color: '#1e40af',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16
  },
  absentNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 12
  },
  absentText: {
    fontSize: 12,
    color: '#92400e',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16
  },

  bottomSpacing: {
    height: 20
  }
});