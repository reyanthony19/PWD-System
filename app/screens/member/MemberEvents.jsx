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
  Dimensions,
  Alert
} from "react-native";
import { Card, Avatar, Badge } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import api from "@/services/api";
import { LinearGradient } from "expo-linear-gradient";
import NetInfo from '@react-native-community/netinfo';

const { width } = Dimensions.get("window");

// Cache keys
const CACHE_KEYS = {
  EVENTS: 'cached_events',
  USER_DATA: 'cached_user_data',
  ATTENDANCE: 'cached_attendance',
  STATS: 'cached_stats',
  LAST_UPDATED: 'cache_last_updated'
};

// Cache expiration time (5 minutes)
const CACHE_EXPIRY_TIME = 5 * 60 * 1000;

export default function MemberEvents() {
  const navigation = useNavigation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [isOnline, setIsOnline] = useState(true);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [stats, setStats] = useState({
    totalEvents: 0,
    attended: 0,
    upcoming: 0,
    completed: 0
  });

  const fetchedRef = useRef(false);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });

    return () => unsubscribeNetInfo();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchEvents();
    }, [])
  );

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetchEvents();

    const intervalId = setInterval(() => {
      if (isOnline) {
        fetchEvents();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [isOnline]);

  // Cache management functions
  const saveToCache = async (key, data) => {
    try {
      const cacheData = {
        data: data,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.log('Error saving to cache:', error);
    }
  };

  const getFromCache = async (key) => {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const cacheData = JSON.parse(cached);
        // Check if cache is still valid
        if (Date.now() - cacheData.timestamp < CACHE_EXPIRY_TIME) {
          return cacheData.data;
        } else {
          // Clear expired cache
          await AsyncStorage.removeItem(key);
        }
      }
      return null;
    } catch (error) {
      console.log('Error reading from cache:', error);
      return null;
    }
  };

  const clearCache = async () => {
    try {
      await AsyncStorage.multiRemove(Object.values(CACHE_KEYS));
    } catch (error) {
      console.log('Error clearing cache:', error);
    }
  };

  const loadCachedData = async () => {
    try {
      const [cachedEvents, cachedStats, cachedAttendance, cachedUser] = await Promise.all([
        getFromCache(CACHE_KEYS.EVENTS),
        getFromCache(CACHE_KEYS.STATS),
        getFromCache(CACHE_KEYS.ATTENDANCE),
        getFromCache(CACHE_KEYS.USER_DATA)
      ]);

      if (cachedEvents && cachedStats && cachedAttendance) {
        setEvents(cachedEvents);
        setStats(cachedStats);
        setAttendanceStatus(cachedAttendance);
        setUsingCachedData(true);
        
        if (cachedUser) {
          setCurrentUserId(cachedUser.id);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.log('Error loading cached data:', error);
      return false;
    }
  };

  // Optimized event fetching with caching
  const fetchEvents = async (forceRefresh = false) => {
    try {
      setRefreshing(true);
      setError("");
      
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.replace("Login");
        return;
      }

      // Try to load from cache first if not forcing refresh and offline
      if (!forceRefresh && !isOnline) {
        const hasCachedData = await loadCachedData();
        if (hasCachedData) {
          setLoading(false);
          setRefreshing(false);
          return;
        } else {
          setError("No internet connection and no cached data available.");
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }

      // If online or force refresh, fetch fresh data
      if (isOnline) {
        // Get user info first
        let userId;
        try {
          const userRes = await api.get("/user", {
            headers: { Authorization: `Bearer ${token}` },
          });
          userId = userRes.data.id;
          setCurrentUserId(userId);
          await saveToCache(CACHE_KEYS.USER_DATA, userRes.data);
        } catch (userError) {
          console.error("User fetch error:", userError);
          if (userError.response?.status === 401) {
            await AsyncStorage.removeItem("token");
            navigation.replace("Login");
            return;
          }
        }

        // Fetch events
        const res = await api.get("/events", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const eventsData = res.data.data || res.data || [];
        setEvents(eventsData);
        await saveToCache(CACHE_KEYS.EVENTS, eventsData);

        // Batch process attendance and stats
        const attendanceStatuses = {};
        let attendedCount = 0;
        let upcomingCount = 0;
        let completedCount = 0;
        const currentDate = new Date();

        // Process events without individual API calls
        for (const event of eventsData) {
          // Check if event has attendance data embedded
          if (event.attendance && Array.isArray(event.attendance)) {
            const userAttendance = event.attendance.find(
              att => att.user_id === userId
            );
            attendanceStatuses[event.id] = userAttendance?.attended ? "Present" : "Absent";
            
            if (userAttendance?.attended) {
              attendedCount++;
            }
          } else {
            // If no embedded attendance data, mark as unknown
            attendanceStatuses[event.id] = "Unknown";
          }

          // Calculate event status
          const eventDate = new Date(event.event_date);
          if (eventDate > currentDate) {
            upcomingCount++;
          } else {
            completedCount++;
          }
        }

        setAttendanceStatus(attendanceStatuses);
        await saveToCache(CACHE_KEYS.ATTENDANCE, attendanceStatuses);
        
        // Update stats
        const newStats = {
          totalEvents: eventsData.length,
          attended: attendedCount,
          upcoming: upcomingCount,
          completed: completedCount
        };
        
        setStats(newStats);
        await saveToCache(CACHE_KEYS.STATS, newStats);
        setUsingCachedData(false);

      } else {
        // Offline but force refresh requested
        Alert.alert(
          "Offline",
          "Cannot refresh while offline. Using cached data.",
          [{ text: "OK" }]
        );
        await loadCachedData();
      }

    } catch (err) {
      console.error("Events fetch error:", err.response?.data || err.message);
      
      // If online fetch fails, try to load cached data
      if (isOnline) {
        const hasCachedData = await loadCachedData();
        if (!hasCachedData) {
          setError("Failed to load events. Please check your connection.");
        }
      } else {
        setError("No internet connection. Please connect to refresh data.");
      }

      if (err.response?.status === 401) {
        await AsyncStorage.removeItem("token");
        navigation.replace("Login");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchEvents(true); // Force refresh
  };

  // Improved status calculation
  const getEventStatus = (eventDate, isPresent) => {
    const currentDate = new Date();
    const eventDateObj = new Date(eventDate);
    
    if (eventDateObj > currentDate) {
      return { status: "Upcoming", color: "#3b82f6", icon: "calendar-clock" };
    } else if (isPresent === "Present") {
      return { status: "Attended", color: "#10b981", icon: "check-circle" };
    } else if (isPresent === "Absent") {
      return { status: "Missed", color: "#ef4444", icon: "close-circle" };
    } else {
      return { status: "Unknown", color: "#6b7280", icon: "help-circle" };
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
    const attendance = attendanceStatus[item.id];
    const isPresent = attendance === "Present";
    const eventStatus = getEventStatus(item.event_date, attendance);
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
                <Text style={styles.locationText}>
                  {item.location || "Location not specified"}
                </Text>
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
                { 
                  color: attendance === "Present" ? '#10b981' : 
                         attendance === "Absent" ? '#ef4444' : '#6b7280'
                }
              ]}>
                {attendance === "Present" ? 'Present' : 
                 attendance === "Absent" ? 'Absent' : 'Not Recorded'}
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

  if (error && !usingCachedData) {
    return (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
        <SafeAreaView style={styles.center}>
          <Ionicons name="alert-circle" size={64} color="#fff" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleManualRefresh}
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
              onRefresh={handleManualRefresh}
              colors={["#fff"]}
              tintColor="#fff"
              enabled={isOnline}
            />
          }
        >
          {/* Header with connection status */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Events</Text>
              <Text style={styles.headerSubtitle}>
                Your event schedule and attendance
                {!isOnline && " • Offline"}
                {usingCachedData && " • Using Cached Data"}
              </Text>
            </View>
            <View style={styles.headerRight}>
              {!isOnline && (
                <Ionicons name="cloud-offline" size={20} color="#f59e0b" style={styles.offlineIcon} />
              )}
              <Avatar.Icon 
                size={50} 
                icon="calendar-month" 
                style={styles.headerIcon} 
              />
            </View>
          </View>

          {/* Connection Status Banner */}
          {!isOnline && (
            <View style={styles.offlineBanner}>
              <Ionicons name="cloud-offline" size={16} color="#fff" />
              <Text style={styles.offlineText}>
                You're offline. Showing cached data.
              </Text>
            </View>
          )}

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
                {usingCachedData && " • Cached"}
              </Text>
            </View>

            {events.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={64} color="#9ca3af" />
                <Text style={styles.emptyTitle}>
                  {isOnline ? 'No Events Available' : 'No Cached Data'}
                </Text>
                <Text style={styles.emptyText}>
                  {isOnline 
                    ? 'Check back later for upcoming events and activities'
                    : 'Connect to internet to load events'
                  }
                </Text>
                {!isOnline && (
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={handleManualRefresh}
                  >
                    <Text style={styles.retryText}>Try Again</Text>
                  </TouchableOpacity>
                )}
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff'
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4
  },
  headerIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },

  // Offline Banner
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  offlineText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
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

  bottomSpacing: {
    height: 20
  }
});