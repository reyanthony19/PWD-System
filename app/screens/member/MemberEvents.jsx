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
import { EventIndicator } from "../../utils/eventIndicator";

const { width } = Dimensions.get("window");

// Cache keys
const CACHE_KEYS = {
  EVENTS: 'cached_events',
  USER_DATA: 'cached_user_data',
  USER_BARANGAY: 'cached_user_barangay',
  ATTENDANCE: 'cached_attendance',
  STATS: 'cached_stats',
  LAST_UPDATED: 'cache_last_updated',
  APP_STATE: 'cached_app_state_events'
};

// Cache expiration time (24 hours for offline)
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000;
// Background refresh interval (5 minutes)
const BACKGROUND_REFRESH_INTERVAL = 5 * 60 * 1000;

export default function MemberEvents() {
  const navigation = useNavigation();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserBarangay, setCurrentUserBarangay] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [isOnline, setIsOnline] = useState(true);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [stats, setStats] = useState({
    totalEvents: 0,
    attended: 0,
    upcoming: 0,
    completed: 0
  });

  const lastFetchRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // Subscribe to network state updates
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });

    return () => {
      isMountedRef.current = false;
      unsubscribeNetInfo();
    };
  }, []);

  // NEW: Enhanced datetime combination function
  const combineEventDateTime = (event) => {
    if (!event) return null;
    
    try {
      let dateTimeString = event.event_date;
      
      // If event_time exists, combine with event_date
      if (event.event_time) {
        // Handle different time formats
        const timePart = event.event_time.includes(':') 
          ? event.event_time.split(':').slice(0, 2).join(':') // Take only HH:mm
          : '00:00';
        
        dateTimeString = `${event.event_date}T${timePart}:00`;
      } else {
        // If no time, set to end of day for proper date comparison
        dateTimeString = `${event.event_date}T23:59:59`;
      }
      
      const combinedDate = new Date(dateTimeString);
      return isNaN(combinedDate.getTime()) ? null : combinedDate;
    } catch (error) {
      console.error('Error combining event datetime:', error);
      return null;
    }
  };

  // NEW: Enhanced event filtering with "All" support
  const filterEventsByBarangay = (events, barangay) => {
    if (!barangay || !events || !Array.isArray(events)) return [];

    return events.filter(event =>
      event &&
      event.target_barangay &&
      (
        event.target_barangay.toLowerCase() === barangay.toLowerCase() ||
        event.target_barangay.toLowerCase() === "all"
      )
    );
  };

  // NEW: Enhanced event status calculation with combined datetime
  const getEventStatus = (event, isPresent) => {
    if (!event) return { status: "Unknown", color: "#6b7280", icon: "help-circle" };
    
    const eventDateTime = combineEventDateTime(event);
    if (!eventDateTime) return { status: "Unknown", color: "#6b7280", icon: "help-circle" };

    const currentDateTime = new Date();

    if (eventDateTime > currentDateTime) {
      return { status: "Upcoming", color: "#3b82f6", icon: "calendar-clock" };
    } else if (isPresent === "Present") {
      return { status: "Attended", color: "#10b981", icon: "check-circle" };
    } else if (isPresent === "Absent") {
      return { status: "Missed", color: "#ef4444", icon: "close-circle" };
    } else {
      return { status: "Completed", color: "#6b7280", icon: "archive" };
    }
  };

  // NEW: Enhanced event sorting with combined datetime
  const sortEvents = (events) => {
    if (!events || !Array.isArray(events)) return [];

    const currentDateTime = new Date();

    return events.sort((a, b) => {
      if (!a || !b) return 0;

      const dateTimeA = combineEventDateTime(a);
      const dateTimeB = combineEventDateTime(b);

      // Handle invalid dates by putting them at the end
      if (!dateTimeA && !dateTimeB) return 0;
      if (!dateTimeA) return 1;
      if (!dateTimeB) return -1;

      const isAUpcoming = dateTimeA > currentDateTime;
      const isBUpcoming = dateTimeB > currentDateTime;

      // Upcoming events first
      if (isAUpcoming && !isBUpcoming) return -1;
      if (!isAUpcoming && isBUpcoming) return 1;

      // For upcoming events: sort by date ascending (soonest first)
      if (isAUpcoming && isBUpcoming) {
        return dateTimeA - dateTimeB;
      }

      // For past events: sort by date descending (most recent first)
      return dateTimeB - dateTimeA;
    });
  };

  // NEW: Enhanced upcoming event check with combined datetime
  const isEventUpcoming = (event) => {
    if (!event) return false;

    const eventDateTime = combineEventDateTime(event);
    if (!eventDateTime) return false;

    const currentDateTime = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(currentDateTime.getDate() + 7);

    return eventDateTime > currentDateTime && eventDateTime <= sevenDaysFromNow;
  };

  // NEW: Enhanced today event check with combined datetime
  const isEventToday = (event) => {
    if (!event) return false;

    const eventDateTime = combineEventDateTime(event);
    if (!eventDateTime) return false;

    const currentDateTime = new Date();

    return eventDateTime.toDateString() === currentDateTime.toDateString();
  };

  // NEW: Enhanced event indicator with combined datetime
  useEffect(() => {
    const updateIndicator = async () => {
      if (events && events.length > 0) {
        const upcomingEvents = events.filter(event => {
          if (!event) return false;
          const eventDateTime = combineEventDateTime(event);
          return eventDateTime && eventDateTime > new Date();
        });

        if (upcomingEvents.length > 0) {
          await EventIndicator.updateEventIndicator(true, upcomingEvents.length);
        } else {
          await EventIndicator.updateEventIndicator(false, 0);
        }
      }
    };

    updateIndicator();
  }, [events]);

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
        const isExpired = Date.now() - cacheData.timestamp > CACHE_EXPIRY_TIME;
        return {
          data: cacheData.data,
          isExpired,
          timestamp: cacheData.timestamp
        };
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

  const mergeEventsCache = async (newEvents) => {
    try {
      if (!Array.isArray(newEvents)) return newEvents || [];

      const cachedEvents = await getFromCache(CACHE_KEYS.EVENTS);
      const existingEvents = cachedEvents?.data || [];

      if (!Array.isArray(existingEvents) || existingEvents.length === 0) {
        return newEvents;
      }

      const existingEventsMap = new Map();
      existingEvents.forEach(event => {
        if (event && event.id) {
          existingEventsMap.set(event.id.toString(), event);
        }
      });

      const mergedEventsMap = new Map();

      existingEvents.forEach(event => {
        if (event && event.id) {
          mergedEventsMap.set(event.id.toString(), event);
        }
      });

      newEvents.forEach(event => {
        if (event && event.id) {
          mergedEventsMap.set(event.id.toString(), event);
        }
      });

      const mergedEvents = Array.from(mergedEventsMap.values());

      console.log(`Cache merge: ${existingEvents.length} existing + ${newEvents.length} new = ${mergedEvents.length} merged`);

      return mergedEvents;
    } catch (error) {
      console.log('Error merging cache:', error);
      return newEvents || [];
    }
  };

  const saveAppState = async (state) => {
    try {
      await saveToCache(CACHE_KEYS.APP_STATE, state);
      await saveToCache(CACHE_KEYS.LAST_UPDATED, { timestamp: Date.now() });
      setLastSync(new Date().toLocaleString());
    } catch (error) {
      console.log('Error saving app state:', error);
    }
  };

  const loadAppState = async () => {
    try {
      const appState = await getFromCache(CACHE_KEYS.APP_STATE);
      const syncInfo = await getFromCache(CACHE_KEYS.LAST_UPDATED);

      if (appState && appState.data) {
        const { events, stats, attendanceStatus, user } = appState.data;

        setEvents(events || []);
        setStats(stats || {
          totalEvents: 0,
          attended: 0,
          upcoming: 0,
          completed: 0
        });
        setAttendanceStatus(attendanceStatus || {});
        if (user) {
          setCurrentUserId(user.id);
          setCurrentUserBarangay(user.barangay);
        }

        if (syncInfo && syncInfo.data) {
          setLastSync(new Date(syncInfo.data.timestamp).toLocaleString());
        }

        return true;
      }
      return false;
    } catch (error) {
      console.log('Error loading app state:', error);
      return false;
    }
  };

  const loadCachedData = async () => {
    try {
      const hasAppState = await loadAppState();
      if (hasAppState) {
        setUsingCachedData(true);
        return true;
      }
      return false;
    } catch (error) {
      console.log('Error loading cached data:', error);
      return false;
    }
  };

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.replace("Login");
        return null;
      }

      const cachedUser = await getFromCache(CACHE_KEYS.USER_DATA);
      if (cachedUser && cachedUser.data) {
        setCurrentUserId(cachedUser.data.id);
        setCurrentUserBarangay(cachedUser.data.member_profile?.barangay);
        return cachedUser.data;
      }

      if (isOnline) {
        const userRes = await api.get("/user", {
          headers: { Authorization: `Bearer ${token}` },
        });

        await saveToCache(CACHE_KEYS.USER_DATA, userRes.data);
        setCurrentUserId(userRes.data.id);
        setCurrentUserBarangay(userRes.data.member_profile?.barangay);

        return userRes.data;
      }

      return null;
    } catch (error) {
      console.error("User fetch error:", error);
      if (error.response?.status === 401) {
        await AsyncStorage.removeItem("token");
        navigation.replace("Login");
      }
      return null;
    }
  };

  // UPDATED: Enhanced event fetching with combined datetime processing
  const fetchEvents = async (forceRefresh = false, silentRefresh = false) => {
    const now = Date.now();
    if (!forceRefresh && now - lastFetchRef.current < 2000) {
      console.log('Skipping fetch - too recent');
      return;
    }
    lastFetchRef.current = now;

    try {
      if (forceRefresh && !silentRefresh) {
        setRefreshing(true);
      } else if (!silentRefresh) {
        setLoading(true);
      }

      setError("");

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.replace("Login");
        return;
      }

      if (!forceRefresh && !silentRefresh) {
        const hasCachedData = await loadCachedData();
        if (hasCachedData) {
          if (!silentRefresh) {
            setLoading(false);
            setRefreshing(false);
          }
          if (isOnline) {
            const cachedAppState = await getFromCache(CACHE_KEYS.APP_STATE);
            const isCacheStale = cachedAppState &&
              (Date.now() - cachedAppState.timestamp > BACKGROUND_REFRESH_INTERVAL);

            if (isCacheStale) {
              console.log('Cache is stale, performing background refresh');
              fetchEvents(false, true);
            }
          }
          return;
        }
      }

      if (!isOnline && !forceRefresh && !silentRefresh) {
        const hasCachedData = await loadCachedData();
        if (!hasCachedData) {
          setError("No internet connection and no cached data available.");
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }

      const userData = await fetchUserData();
      if (!userData) {
        if (!silentRefresh) {
          setError("Failed to load user information.");
          setLoading(false);
          setRefreshing(false);
        }
        return;
      }

      const userBarangay = userData.member_profile?.barangay;
      if (!userBarangay) {
        if (!silentRefresh) {
          setError("Barangay information not found in your profile.");
          setLoading(false);
          setRefreshing(false);
        }
        return;
      }

      let eventsData = [];
      if (isOnline) {
        try {
          const res = await api.get("/events", {
            headers: { Authorization: `Bearer ${token}` },
          });
          eventsData = res.data.data || res.data || [];

          const mergedEvents = await mergeEventsCache(eventsData);
          await saveToCache(CACHE_KEYS.EVENTS, mergedEvents);
          eventsData = mergedEvents;

          console.log(`Fetched ${eventsData.length} events (merged with cache)`);
        } catch (err) {
          console.error("Events fetch error:", err);
          const cachedEvents = await getFromCache(CACHE_KEYS.EVENTS);
          if (cachedEvents && cachedEvents.data) {
            eventsData = cachedEvents.data;
            console.log('Using cached events due to API error');
          } else {
            throw new Error("Failed to fetch events");
          }
        }
      } else {
        const cachedEvents = await getFromCache(CACHE_KEYS.EVENTS);
        if (cachedEvents && cachedEvents.data) {
          eventsData = cachedEvents.data;
        } else {
          throw new Error("OFFLINE_NO_CACHE");
        }
      }

      if (!Array.isArray(eventsData)) {
        eventsData = [];
      }

      // ENHANCED: Filter events with "All" support
      const filteredEvents = filterEventsByBarangay(eventsData, userBarangay);

      // ENHANCED: Sort events with combined datetime
      const sortedEvents = sortEvents(filteredEvents);

      // ENHANCED: Process attendance and stats with combined datetime
      const attendanceStatuses = {};
      let attendedCount = 0;
      let upcomingCount = 0;
      let completedCount = 0;
      const currentDateTime = new Date();

      if (sortedEvents && Array.isArray(sortedEvents)) {
        for (const event of sortedEvents) {
          if (!event || !event.id) continue;

          if (event.attendance && Array.isArray(event.attendance)) {
            const userAttendance = event.attendance.find(
              att => att && att.user_id === userData.id
            );
            attendanceStatuses[event.id] = userAttendance?.attended ? "Present" : "Absent";

            if (userAttendance?.attended) {
              attendedCount++;
            }
          } else {
            attendanceStatuses[event.id] = "Unknown";
          }

          // ENHANCED: Use combined datetime for status calculation
          const eventDateTime = combineEventDateTime(event);
          if (eventDateTime && eventDateTime > currentDateTime) {
            upcomingCount++;
          } else {
            completedCount++;
          }
        }
      }

      if (isMountedRef.current) {
        setEvents(sortedEvents || []);
        setAttendanceStatus(attendanceStatuses);

        const newStats = {
          totalEvents: sortedEvents ? sortedEvents.length : 0,
          attended: attendedCount,
          upcoming: upcomingCount,
          completed: completedCount
        };

        setStats(newStats);
        setUsingCachedData(!isOnline && !forceRefresh);

        await saveAppState({
          events: sortedEvents || [],
          stats: newStats,
          attendanceStatus: attendanceStatuses,
          user: {
            id: userData.id,
            barangay: userBarangay
          }
        });

        if (silentRefresh) {
          console.log('Background refresh completed');
        }
      }

    } catch (err) {
      console.error("Events fetch error:", err);

      if (isMountedRef.current && !silentRefresh) {
        if (err.message === 'OFFLINE_NO_CACHE') {
          setError("You're offline and no cached data is available.");
        } else if (err.response?.status === 401) {
          await AsyncStorage.removeItem("token");
          navigation.replace("Login");
          return;
        } else {
          setError("Failed to load events. " + (err.message || ""));

          const hasCachedData = await loadCachedData();
          if (!hasCachedData && !isOnline) {
            setError("No internet connection and no cached data available.");
          }
        }
      }
    } finally {
      if (isMountedRef.current && !silentRefresh) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (!isMountedRef.current) return;

      const initializeData = async () => {
        console.log('Screen focused - initializing data');

        const cachedLoaded = await loadCachedData();

        if (cachedLoaded) {
          setLoading(false);
          if (isOnline) {
            const cachedAppState = await getFromCache(CACHE_KEYS.APP_STATE);
            const shouldRefresh = !cachedAppState ||
              (Date.now() - cachedAppState.timestamp > BACKGROUND_REFRESH_INTERVAL);

            if (shouldRefresh) {
              console.log('Auto-refreshing on screen focus');
              fetchEvents(false, true);
            }
          }
        } else {
          console.log('No cache found - performing initial load');
          fetchEvents(false, false);
        }
      };

      initializeData();

      return () => {
        console.log('Screen unfocused');
      };
    }, [isOnline])
  );

  // PULL-TO-REFRESH FUNCTIONALITY
  const handleManualRefresh = () => {
    if (isOnline) {
      console.log('Manual refresh triggered');
      fetchEvents(true, false);
    } else {
      setRefreshing(false);
      Alert.alert(
        "Offline",
        "Cannot refresh while offline. Connect to internet and try again.",
        [{ text: "OK" }]
      );
    }
  };

  const forceRefresh = async () => {
    await clearCache();
    fetchEvents(true, false);
  };

  const getEventTypeIcon = (eventType) => {
    if (!eventType) return "calendar";

    switch (eventType.toLowerCase()) {
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

  // NEW: Enhanced datetime formatting for display
  const formatEventDateTime = (event) => {
    const eventDateTime = combineEventDateTime(event);
    if (!eventDateTime) return { date: 'Date not set', time: 'Time not set' };

    return {
      date: eventDateTime.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      time: eventDateTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const renderStatsCard = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}>
          <Ionicons name="calendar" size={24} color="#2563eb" />
        </View>
        <Text style={styles.statNumber}>{stats.totalEvents}</Text>
        <Text style={styles.statLabel}>Total Events</Text>
        {currentUserBarangay && (
          <Text style={styles.statSubtitle}>
            {currentUserBarangay} and All Barangay
          </Text>
        )}
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
    if (!item) return null;

    const attendance = attendanceStatus[item.id];
    const isPresent = attendance === "Present";
    const eventStatus = getEventStatus(item, attendance);
    const eventTypeIcon = getEventTypeIcon(item.type);
    const isUpcoming = isEventUpcoming(item);
    const isToday = isEventToday(item);
    const { date, time } = formatEventDateTime(item);

    return (
      <TouchableOpacity
        style={[
          styles.eventCard,
          index === 0 && styles.firstCard,
          isToday && styles.todayCard,
          isUpcoming && styles.upcomingCard
        ]}
        onPress={() =>
          navigation.navigate("MemberAttendance", {
            eventId: item.id,
            eventTitle: item.title
          })
        }
      >
        {(isToday || isUpcoming) && (
          <View style={[
            styles.eventBanner,
            isToday ? styles.todayBanner : styles.upcomingBanner
          ]}>
            <Ionicons
              name={isToday ? "flash" : "calendar"}
              size={14}
              color="#fff"
            />
            <Text style={styles.bannerText}>
              {isToday ? "Happening Today" : "Upcoming Soon"}
            </Text>
          </View>
        )}

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
              {item.title || "Untitled Event"}
            </Text>
            <View style={styles.eventMeta}>
              <View style={styles.location}>
                <Ionicons name="location" size={14} color="#6b7280" />
                <Text style={styles.locationText}>
                  {item.location || "Location not specified"}
                </Text>
              </View>
              {item.target_barangay && (
                <View style={[
                  styles.barangayBadge,
                  item.target_barangay.toLowerCase() === "all" && styles.allBarangayBadge
                ]}>
                  <Ionicons 
                    name={item.target_barangay.toLowerCase() === "all" ? "earth" : "map"} 
                    size={12} 
                    color={item.target_barangay.toLowerCase() === "all" ? "#10b981" : "#3b82f6"} 
                  />
                  <Text style={[
                    styles.barangayText,
                    item.target_barangay.toLowerCase() === "all" && styles.allBarangayText
                  ]}>
                    {item.target_barangay}
                  </Text>
                </View>
              )}
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
                {date}
              </Text>
            </View>

            <View style={styles.dateTimeItem}>
              <Ionicons name="time" size={16} color="#6b7280" />
              <Text style={styles.dateTimeText}>
                {time}
              </Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <Text style={styles.viewDetails}>
              View Details →
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
        <SafeAreaView style={styles.loader}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading Events...</Text>
          {!isOnline && (
            <Text style={styles.offlineHint}>You're offline - using cached data</Text>
          )}
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error && (!events || events.length === 0)) {
    return (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
        <SafeAreaView style={styles.center}>
          <Ionicons name="alert-circle" size={64} color="#fff" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={forceRefresh}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
          {!isOnline && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.secondaryButtonText}>Go Back</Text>
            </TouchableOpacity>
          )}
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
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Events</Text>
              <Text style={styles.headerSubtitle}>
                Your event schedule and attendance
                {currentUserBarangay && ` • ${currentUserBarangay} + All Events`}
                {!isOnline && " • Offline"}
                {usingCachedData && ""}
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

          {!isOnline && (
            <View style={styles.offlineBanner}>
              <Ionicons name="cloud-offline" size={16} color="#fff" />
              <Text style={styles.offlineText}>
                You're offline. Showing cached data.
              </Text>
            </View>
          )}

          {lastSync && (
            <View style={styles.syncInfo}>
              <Text style={styles.syncInfoText}>
                Last synced: {lastSync}
              </Text>
            </View>
          )}

          {renderStatsCard()}

          <View style={styles.eventsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Events for {currentUserBarangay || 'Your Barangay'} ({events ? events.length : 0})
              </Text>
              <Text style={styles.sectionSubtitle}>
                {stats.upcoming} upcoming events • Prioritized by date and time
                {usingCachedData && " • Cached"}
              </Text>
            </View>

            {!events || events.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={64} color="#9ca3af" />
                <Text style={styles.emptyTitle}>
                  {isOnline ? 'No Events Available' : 'No Cached Data'}
                </Text>
                <Text style={styles.emptyText}>
                  {isOnline
                    ? `No events currently scheduled for ${currentUserBarangay || 'your barangay'} or All events`
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
                keyExtractor={(item) => item && item.id ? item.id.toString() : Math.random().toString()}
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
  offlineHint: {
    marginTop: 8,
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    textAlign: 'center'
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
    borderRadius: 12,
    marginBottom: 8
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  secondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  secondaryButtonText: {
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

  // Sync Info
  syncInfo: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: -8
  },
  syncInfoText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center'
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
  statSubtitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 2
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

  // Event Cards with Banners
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    position: 'relative',
    overflow: 'hidden'
  },
  firstCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b'
  },
  todayCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981'
  },
  upcomingCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6'
  },
  // Event Banner
  eventBanner: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 12,
    zIndex: 1
  },
  todayBanner: {
    backgroundColor: '#10b981'
  },
  upcomingBanner: {
    backgroundColor: '#3b82f6'
  },
  bannerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    marginTop: 4
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
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12
  },
  locationText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4
  },
  barangayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  allBarangayBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)'
  },
  barangayText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
    marginLeft: 4
  },
  allBarangayText: {
    color: '#10b981'
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  viewDetails: {
    fontSize: 14,
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
    marginBottom: 8,
    textAlign: 'center'
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16
  },

  bottomSpacing: {
    height: 20
  }
});