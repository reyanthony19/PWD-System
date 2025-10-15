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
    if (currentUser) {
      fetchData();
    }
  }, [eventId, currentUser]);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      
      // Event details
      const eventRes = await api.get(`/events/${eventId}`);
      setEvent(eventRes.data);

      // Get current user's attendance for this event
      await fetchUserAttendance(eventRes.data);

    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load event data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const userRes = await api.get("/user");
      setCurrentUser(userRes.data);
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const fetchUserAttendance = async (eventData) => {
    try {
      // Try the specific user attendance route first
      if (currentUser?.id) {
        try {
          const attendanceRes = await api.get(`/attendances/${eventId}/user/${currentUser.id}`);
          if (attendanceRes.data) {
            setUserAttendance(attendanceRes.data);
            setUserAttendanceStatus("present");
            return;
          }
        } catch (error) {
          console.log("Specific user attendance route not available, trying alternatives...");
        }

        // Alternative: Get all attendances and filter for current user
        try {
          const allAttendancesRes = await api.get(`/attendances/${eventId}`);
          const allAttendances = allAttendancesRes.data.data || allAttendancesRes.data || [];
          const userAtt = allAttendances.find(att => att.user_id === currentUser.id);
          
          if (userAtt) {
            setUserAttendance(userAtt);
            setUserAttendanceStatus("present");
            return;
          }
        } catch (error) {
          console.log("Alternative attendance route failed");
        }

        // Alternative: Get user's all attendances and filter for this event
        try {
          const userAttendancesRes = await api.get(`/users/${currentUser.id}/attendances`);
          const userAttendances = userAttendancesRes.data.data || userAttendancesRes.data || [];
          const userAtt = userAttendances.find(att => att.event_id === parseInt(eventId));
          
          if (userAtt) {
            setUserAttendance(userAtt);
            setUserAttendanceStatus("present");
            return;
          }
        } catch (error) {
          console.log("User attendances route failed");
        }
      }

      // If no attendance found, check event date to determine status
      checkAttendanceStatusByDate(eventData);
      
    } catch (error) {
      console.error("Error fetching user attendance:", error);
      checkAttendanceStatusByDate(eventData);
    }
  };

  const checkAttendanceStatusByDate = (eventData) => {
    const currentDate = new Date();
    const eventDate = new Date(eventData.event_date);
    
    // Check if event date is today
    const isToday = currentDate.toDateString() === eventDate.toDateString();
    
    if (!isToday) {
      setUserAttendanceStatus("not_today");
      return;
    }

    // If event is today and no attendance record found, mark as absent
    setUserAttendanceStatus("absent");
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
    
    if (eventStatus === "upcoming") {
      return {
        status: "Upcoming Event",
        color: "#f59e0b",
        icon: "time-outline",
        message: "This event is scheduled for the future"
      };
    }
    
    if (eventStatus === "past") {
      if (userAttendanceStatus === "present") {
        return {
          status: "Attended",
          color: "#10b981",
          icon: "checkmark-circle",
          message: "You attended this event"
        };
      } else {
        return {
          status: "Not Attended",
          color: "#6b7280",
          icon: "close-circle",
          message: "You did not attend this event"
        };
      }
    }
    
    // Event is today
    switch (userAttendanceStatus) {
      case "present":
        return {
          status: "Present",
          color: "#10b981",
          icon: "checkmark-circle",
          message: "You have attended this event today"
        };
      case "absent":
        return {
          status: "Absent",
          color: "#ef4444",
          icon: "close-circle",
          message: "You have not attended this event today"
        };
      default:
        return {
          status: "Unknown",
          color: "#6b7280",
          icon: "help-circle",
          message: "Attendance status not available"
        };
    }
  };

  const renderAttendanceRecord = () => {
    const attendanceBadge = getUserAttendanceBadge();

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

        {userAttendanceStatus === "absent" && getEventStatus() === "today" && (
          <View style={styles.absentNotice}>
            <Ionicons name="information-circle" size={20} color="#f59e0b" />
            <Text style={styles.absentText}>
              If you attended this event but are marked as absent, please contact event staff.
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