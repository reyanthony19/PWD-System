import React, { useEffect, useState, useRef } from "react";
import { 
  View, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  Text, 
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions
} from "react-native";
import { Card, Avatar, Badge } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import api from "@/services/api";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function MemberEvents() {
  const navigation = useNavigation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [stats, setStats] = useState({
    totalEvents: 0,
    attended: 0,
    upcoming: 0,
    completed: 0
  });

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetchEvents();

    const intervalId = setInterval(() => {
      fetchEvents();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [navigation]);

  const fetchEvents = async () => {
    try {
      setRefreshing(true);
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        navigation.replace("Login");
        return;
      }

      const res = await api.get("/events", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const eventsData = res.data.data || res.data || [];
      setEvents(eventsData);

      // Get current user info
      const userRes = await api.get("/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUserId(userRes.data.id);

      // Check attendance status for each event
      const attendanceStatuses = {};
      let attendedCount = 0;
      let upcomingCount = 0;
      let completedCount = 0;
      const currentDate = new Date();

      for (const event of eventsData) {
        try {
          const attendanceRes = await api.get(`/events/${event.id}/${userRes.data.id}`);
          attendanceStatuses[event.id] = attendanceRes.data.attended ? "Present" : "Absent";
          
          if (attendanceRes.data.attended) {
            attendedCount++;
          }

          const eventDate = new Date(event.event_date);
          if (eventDate > currentDate) {
            upcomingCount++;
          } else {
            completedCount++;
          }
        } catch (err) {
          console.error(`Error fetching attendance for event ${event.id}:`, err);
          attendanceStatuses[event.id] = "Unknown";
        }
      }

      setAttendanceStatus(attendanceStatuses);
      
      // Update stats
      setStats({
        totalEvents: eventsData.length,
        attended: attendedCount,
        upcoming: upcomingCount,
        completed: completedCount
      });

    } catch (err) {
      console.error("Events fetch error:", err.response?.data || err.message);
      setError("Failed to load events.");

      if (err.response?.status === 401) {
        await AsyncStorage.removeItem("token");
        navigation.replace("Login");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getEventStatus = (eventDate, isPresent) => {
    const currentDate = new Date();
    const eventDateObj = new Date(eventDate);
    
    if (eventDateObj > currentDate) {
      return { status: "Upcoming", color: "#3b82f6", icon: "calendar-clock" };
    } else if (isPresent) {
      return { status: "Attended", color: "#10b981", icon: "check-circle" };
    } else {
      return { status: "Missed", color: "#ef4444", icon: "close-circle" };
    }
  };

  const getEventTypeIcon = (eventType) => {
    switch (eventType?.toLowerCase()) {
      case "meeting":
        return "account-group";
      case "training":
        return "school";
      case "celebration":
        return "party-popper";
      case "seminar":
        return "presentation";
      default:
        return "calendar";
    }
  };

  const renderStatsCard = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}>
          <Ionicons name="calendar" size={24} color="#2563eb" />
        </View>
        <Text style={styles.statNumber}>{stats.totalEvents}</Text>
        <Text style={styles.statLabel}>Total Events</Text>
      </View>
      
      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
          <Ionicons name="checkmark-done" size={24} color="#22c55e" />
        </View>
        <Text style={styles.statNumber}>{stats.attended}</Text>
        <Text style={styles.statLabel}>Attended</Text>
      </View>
      
      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
          <Ionicons name="time" size={24} color="#3b82f6" />
        </View>
        <Text style={styles.statNumber}>{stats.upcoming}</Text>
        <Text style={styles.statLabel}>Upcoming</Text>
      </View>
      
      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: 'rgba(107, 114, 128, 0.1)' }]}>
          <Ionicons name="archive" size={24} color="#6b7280" />
        </View>
        <Text style={styles.statNumber}>{stats.completed}</Text>
        <Text style={styles.statLabel}>Completed</Text>
      </View>
    </View>
  );

  const renderEventItem = ({ item, index }) => {
    const isPresent = attendanceStatus[item.id] === "Present";
    const eventStatus = getEventStatus(item.event_date, isPresent);
    const eventTypeIcon = getEventTypeIcon(item.type);
    
    return (
      <TouchableOpacity
        style={[
          styles.eventCard,
          index === 0 && styles.firstCard
        ]}
        onPress={() =>
          navigation.navigate("MemberAttendance", { 
            eventId: item.id, 
            eventTitle: item.title 
          })
        }
      >
        <View style={styles.eventHeader}>
          <View style={styles.eventIconContainer}>
            <View style={[styles.eventIcon, { backgroundColor: '#2563eb' }]}>
              <MaterialCommunityIcons 
                name={eventTypeIcon} 
                size={24} 
                color="#fff" 
              />
            </View>
          </View>
          
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.eventMeta}>
              <View style={styles.location}>
                <Ionicons name="location" size={14} color="#6b7280" />
                <Text style={styles.locationText}>{item.location}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.statusContainer}>
            <Badge 
              style={[styles.statusBadge, { backgroundColor: eventStatus.color }]}
              size={24}
            >
              <MaterialCommunityIcons 
                name={eventStatus.icon} 
                size={14} 
                color="#fff" 
              />
            </Badge>
          </View>
        </View>

        <View style={styles.eventDetails}>
          <View style={styles.dateTimeRow}>
            <View style={styles.dateTimeItem}>
              <Ionicons name="calendar" size={16} color="#6b7280" />
              <Text style={styles.dateTimeText}>
                {new Date(item.event_date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
            </View>
            
            <View style={styles.dateTimeItem}>
              <Ionicons name="time" size={16} color="#6b7280" />
              <Text style={styles.dateTimeText}>
                {new Date(item.event_date).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          </View>
          
          <View style={styles.attendanceRow}>
            <View style={styles.attendanceStatus}>
              <Text style={styles.attendanceLabel}>Your Attendance:</Text>
              <Text style={[
                styles.attendanceValue,
                { color: isPresent ? '#10b981' : '#ef4444' }
              ]}>
                {isPresent ? 'Present' : 'Absent'}
              </Text>
            </View>
            
            <View style={styles.actionButton}>
              <Text style={styles.viewDetails}>
                View Details →
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
        <SafeAreaView style={styles.loader}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading Events...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
        <SafeAreaView style={styles.center}>
          <Ionicons name="alert-circle" size={64} color="#fff" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchEvents}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={fetchEvents}
              colors={["#fff"]}
              tintColor="#fff"
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Events</Text>
              <Text style={styles.headerSubtitle}>
                Your event schedule and attendance
              </Text>
            </View>
            <Avatar.Icon 
              size={50} 
              icon="calendar-month" 
              style={styles.headerIcon} 
            />
          </View>

          {/* Statistics */}
          {renderStatsCard()}

          {/* Events List */}
          <View style={styles.eventsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                All Events ({events.length})
              </Text>
              <Text style={styles.sectionSubtitle}>
                {stats.upcoming} upcoming events
              </Text>
            </View>

            {events.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={64} color="#9ca3af" />
                <Text style={styles.emptyTitle}>No Events Available</Text>
                <Text style={styles.emptyText}>
                  Check back later for upcoming events and activities
                </Text>
              </View>
            ) : (
              <FlatList
                data={events}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderEventItem}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  safeArea: {
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff'
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4
  },
  headerIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },

  // Statistics
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    flexWrap: 'wrap'
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    backdropFilter: 'blur(10px)'
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center'
  },

  // Events Section
  eventsSection: {
    marginBottom: 20
  },
  sectionHeader: {
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)'
  },

  // Event Cards
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8
  },
  firstCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b'
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  eventIconContainer: {
    marginRight: 12
  },
  eventIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center'
  },
  eventInfo: {
    flex: 1,
    marginRight: 8
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 20
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  locationText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4
  },
  statusContainer: {
    alignSelf: 'flex-start'
  },
  statusBadge: {
    borderRadius: 12
  },

  // Event Details
  eventDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  dateTimeText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6
  },
  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  attendanceStatus: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  attendanceLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 6
  },
  attendanceValue: {
    fontSize: 14,
    fontWeight: '600'
  },
  actionButton: {
    
  },
  viewDetails: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500'
  },

  // Empty State
  emptyState: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center'
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20
  },

  // Error State
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },

  bottomSpacing: {
    height: 20
  }
});