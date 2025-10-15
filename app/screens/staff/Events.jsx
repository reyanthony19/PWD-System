import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Text,
  RefreshControl,
  SectionList
} from "react-native";
import { Card, Avatar, Badge } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import NetInfo from '@react-native-community/netinfo';
import api from "@/services/api";
import { LinearGradient } from "expo-linear-gradient";

// Cache configuration
const CACHE_KEYS = {
  EVENTS_DATA: 'events_data_cache',
  EVENTS_LAST_FETCH: 'events_last_fetch',
  USER_TOKEN: 'token',
  USER_PROFILE: 'user_profile',
  STAFF_PROFILE: 'staff_profile'
};

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes cache

export default function Events() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [events, setEvents] = useState([]);
  const [sectionedEvents, setSectionedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [staffAssignedBarangay, setStaffAssignedBarangay] = useState(null);
  const [user, setUser] = useState(null);

  const fetchedRef = useRef(false);

  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });

    if (isFocused && !fetchedRef.current) {
      loadUserProfile();
      fetchedRef.current = true;
    }

    return () => {
      unsubscribeNetInfo();
    };
  }, [isFocused]);

  // Load user profile to get staff assigned_barangay
  const loadUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem(CACHE_KEYS.USER_TOKEN);
      if (!token) {
        navigation.replace("Login");
        return;
      }

      // Try to get cached user profile first
      const cachedUser = await getCache(CACHE_KEYS.USER_PROFILE);
      if (cachedUser) {
        setUser(cachedUser);
        extractStaffAssignedBarangay(cachedUser);
      }

      // Fetch fresh profile data
      await fetchUserProfile(token);

    } catch (error) {
      console.error('Error loading user profile:', error);
      // Continue with events fetch even if profile fails
      fetchEvents();
    }
  };

  const fetchUserProfile = async (token) => {
    try {
      const userRes = await api.get("/user", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(userRes.data);
      extractStaffAssignedBarangay(userRes.data);

      // Cache user profile
      await setCache(CACHE_KEYS.USER_PROFILE, userRes.data);

    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      // Fetch events regardless of profile success
      fetchEvents();
    }
  };

  const extractStaffAssignedBarangay = (userData) => {
    const assignedBarangay = userData?.staff_profile?.assigned_barangay;
    if (assignedBarangay) {
      setStaffAssignedBarangay(assignedBarangay);
      console.log('🏘️ Staff assigned_barangay:', assignedBarangay);
    } else {
      console.log('ℹ️ No assigned_barangay for staff');
    }
  };

  // Organize events into sections - only separate if staff has assigned_barangay
  const organizeEventsIntoSections = (eventsList) => {
    if (!eventsList || eventsList.length === 0) return [];

    // If staff has no assigned_barangay, show all events in one section
    if (!staffAssignedBarangay) {
      const sortedEvents = eventsList.sort((a, b) =>
        new Date(a.event_date) - new Date(b.event_date)
      );

      return [{
        title: "All Events",
        subtitle: "All available events",
        data: sortedEvents,
        type: 'all',
        count: sortedEvents.length
      }];
    }

    const relevantEvents = eventsList.filter(event =>
      event.target_barangay === staffAssignedBarangay || event.target_barangay === "All"
    );

    const otherEvents = eventsList.filter(event =>
      event.target_barangay !== staffAssignedBarangay && event.target_barangay !== "All"
    );

    const sections = [];

    // Add Relevant Events section
    if (relevantEvents.length > 0) {
      // Sort relevant events: exact matches first, then "All", then by date
      const sortedRelevantEvents = relevantEvents.sort((a, b) => {
        const aIsExactMatch = a.target_barangay === staffAssignedBarangay;
        const bIsExactMatch = b.target_barangay === staffAssignedBarangay;

        if (aIsExactMatch && !bIsExactMatch) return -1;
        if (!aIsExactMatch && bIsExactMatch) return 1;

        return new Date(a.event_date) - new Date(b.event_date);
      });

      sections.push({
        title: "Your Events",
        subtitle: `Events in ${staffAssignedBarangay} or all areas`,
        data: sortedRelevantEvents,
        type: 'relevant',
        count: sortedRelevantEvents.length
      });
    }

    // Add Other Events section only if there are other events
    if (otherEvents.length > 0) {
      // Sort other events by date
      const sortedOtherEvents = otherEvents.sort((a, b) =>
        new Date(a.event_date) - new Date(b.event_date)
      );

      sections.push({
        title: "Other Barangay Events",
        subtitle: "Events in other areas",
        data: sortedOtherEvents,
        type: 'other',
        count: sortedOtherEvents.length
      });
    }

    // If no sections were created (no events), return empty array
    return sections;
  };

  // Cache utilities
  const setCache = async (key, data) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  };

  const getCache = async (key) => {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const isExpired = Date.now() - cacheData.timestamp > CACHE_DURATION;

      return isExpired ? null : cacheData.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  };

  // Function to fetch events with caching
  const fetchEvents = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      setError("");

      const token = await AsyncStorage.getItem(CACHE_KEYS.USER_TOKEN);

      if (!token) {
        setLoading(false);
        navigation.replace("Login");
        return;
      }

      // Try to get cached data first (unless it's a manual refresh)
      if (!isRefresh) {
        const cachedEvents = await getCache(CACHE_KEYS.EVENTS_DATA);
        if (cachedEvents) {
          console.log('📚 Using cached events data');
          setEvents(cachedEvents);
          const sections = organizeEventsIntoSections(cachedEvents);
          setSectionedEvents(sections);
          setLoading(false);

          // Still fetch fresh data in background if online
          if (isOnline) {
            fetchFreshEvents(token);
          }
          return;
        }
      }

      // If no cache or manual refresh, fetch from API
      await fetchFreshEvents(token, isRefresh);

    } catch (err) {
      console.error("Events fetch error:", err);
      handleFetchError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch fresh events from API
  const fetchFreshEvents = async (token, isRefresh = false) => {
    try {
      const res = await api.get("/events", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const eventsData = res.data.data || res.data || [];

      // Update state
      setEvents(eventsData);
      const sections = organizeEventsIntoSections(eventsData);
      setSectionedEvents(sections);

      // Cache the data
      await setCache(CACHE_KEYS.EVENTS_DATA, eventsData);

      console.log(`✅ ${isRefresh ? 'Refreshed' : 'Loaded'} ${eventsData.length} events`);

    } catch (err) {
      // If online fetch fails, try to use cached data as fallback
      if (!isRefresh) {
        const cachedEvents = await getCache(CACHE_KEYS.EVENTS_DATA);
        if (cachedEvents) {
          console.log('🔄 Using cached data as fallback');
          setEvents(cachedEvents);
          const sections = organizeEventsIntoSections(cachedEvents);
          setSectionedEvents(sections);
          setError("Using cached data - Network issue");
          return;
        }
      }
      throw err; // Re-throw if no cached data available
    }
  };

  const handleFetchError = async (err) => {
    if (err.response?.status === 401) {
      await AsyncStorage.removeItem(CACHE_KEYS.USER_TOKEN);
      navigation.replace("Login");
    } else if (err.message?.includes('Network Error')) {
      // Try to use cached data when offline
      const cachedEvents = await getCache(CACHE_KEYS.EVENTS_DATA);
      if (cachedEvents) {
        setEvents(cachedEvents);
        const sections = organizeEventsIntoSections(cachedEvents);
        setSectionedEvents(sections);
        setError("You're offline - showing cached events");
      } else {
        setError("Network unavailable and no cached data");
      }
    } else {
      setError("Failed to load events. Pull down to refresh.");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setError("");
    await fetchEvents(true);
  };

  const renderEvent = ({ item, section }) => {
    const isRelevantSection = section.type === 'relevant';
    const isAllSection = section.type === 'all';
    const isExactMatch = item.target_barangay === staffAssignedBarangay;

    return (
      <Card
        style={[
          styles.card,
          isRelevantSection && styles.relevantCard,
          isRelevantSection && isExactMatch && styles.exactMatchCard,
          isAllSection && styles.allCard
        ]}
        onPress={() =>
          navigation.navigate("Attendance", {
            eventId: item.id,
            eventTitle: item.title
          })
        }
      >
        <Card.Title
          title={item.title}
          titleStyle={styles.cardTitle}
          subtitle={`📍 ${item.location || 'Location not specified'}`}
          left={(props) => (
            <Avatar.Icon
              {...props}
              icon="calendar"
              style={{
                backgroundColor: isExactMatch ? "#10b981" :
                  isRelevantSection ? "#3b82f6" :
                    isAllSection ? "#8b5cf6" : "#6b7280"
              }}
            />
          )}
          right={(props) => (
            isRelevantSection ? (
              <Badge
                style={[
                  styles.badge,
                  isExactMatch ? styles.exactBadge : styles.relevantBadge
                ]}
              >
                {isExactMatch ? 'Your Area' : 'All Areas'}
              </Badge>
            ) : isAllSection ? (
              <Badge style={styles.allBadge}>
                All
              </Badge>
            ) : (
              <Badge style={styles.otherBadge}>
                Other
              </Badge>
            )
          )}
        />
        <Card.Content>
          <Text style={styles.detail}>
            📅 {new Date(item.event_date).toLocaleDateString()}
          </Text>
          {item.target_barangay && (
            <Text style={[
              styles.barangayText,
              isExactMatch && styles.exactBarangayText,
              isRelevantSection && !isExactMatch && styles.relevantBarangayText,
              isAllSection && styles.allBarangayText,
              !isRelevantSection && !isAllSection && styles.otherBarangayText
            ]}>
              🏘️ {item.target_barangay}
              {isExactMatch && " • Your assigned barangay"}
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderSectionHeader = ({ section }) => (
    <View style={[
      styles.sectionHeader,
      section.type === 'relevant' && styles.relevantSectionHeader,
      section.type === 'other' && styles.otherSectionHeader,
      section.type === 'all' && styles.allSectionHeader
    ]}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Badge style={styles.sectionBadge}>
          {section.count}
        </Badge>
      </View>
      <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
        <SafeAreaView style={styles.center}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading Events...</Text>
          {staffAssignedBarangay && (
            <Text style={styles.assignedBarangayInfo}>Your assigned barangay: {staffAssignedBarangay}</Text>
          )}
          {!staffAssignedBarangay && (
            <Text style={styles.noAssignedBarangayInfo}>No assigned barangay</Text>
          )}
          {!isOnline && (
            <Text style={styles.offlineHint}>You're offline - using cached data</Text>
          )}
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error && sectionedEvents.length === 0) {
    return (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
        <SafeAreaView style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText}>Pull down to refresh</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const totalEvents = sectionedEvents.reduce((total, section) => total + section.data.length, 0);

  return (
    <LinearGradient
      colors={["#667eea", "#764ba2"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Events</Text>
          <Text style={styles.headerSubtitle}>
            {totalEvents} event{totalEvents !== 1 ? 's' : ''} total
          </Text>
          {staffAssignedBarangay ? (
            <Text style={styles.assignedBarangayInfo}>Assigned barangay: {staffAssignedBarangay}</Text>
          ) : (
            <Text style={styles.noAssignedBarangayInfo}>Viewing all events - no assigned barangay</Text>
          )}
        </View>

        {/* Error Banner */}
        {error && sectionedEvents.length > 0 && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
            <Text style={styles.errorBannerSubtext}>Pull down to refresh</Text>
          </View>
        )}

        {/* Offline Indicator */}
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>📱 You're offline - showing cached events</Text>
          </View>
        )}

        <SectionList
          sections={sectionedEvents}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderEvent}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#fff"]}
              tintColor="#fff"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Events Available</Text>
              <Text style={styles.emptySubtitle}>
                {isOnline ? "Check back later for new events" : "Connect to internet to refresh events"}
              </Text>
            </View>
          }
          stickySectionHeadersEnabled={false}
        />


      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  assignedBarangayInfo: {
    marginTop: 8,
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    textAlign: 'center',
  },
  noAssignedBarangayInfo: {
    marginTop: 8,
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  offlineHint: {
    marginTop: 8,
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    textAlign: 'center',
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    textAlign: 'center',
  },

  // Header
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Section Headers
  sectionHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
  },
  relevantSectionHeader: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  otherSectionHeader: {
    backgroundColor: 'rgba(107, 114, 128, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: '#6b7280',
  },
  allSectionHeader: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  sectionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Banners
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    margin: 16,
    marginTop: 0,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorBannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  errorBannerSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  offlineBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    margin: 16,
    marginTop: 0,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  offlineText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  // List
  listContainer: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 80,
  },
  card: {
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  relevantCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  exactMatchCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  allCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#8b5cf6',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827"
  },
  detail: {
    fontSize: 14,
    marginTop: 4,
    color: "#374151"
  },
  barangayText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  relevantBarangayText: {
    color: "#3b82f6",
    fontWeight: '500',
  },
  exactBarangayText: {
    color: "#10b981",
    fontWeight: '600',
  },
  allBarangayText: {
    color: "#8b5cf6",
    fontWeight: '500',
  },
  otherBarangayText: {
    color: "#6b7280",
    fontStyle: 'italic',
  },
  badge: {
    marginRight: 16,
  },
  relevantBadge: {
    backgroundColor: '#3b82f6',
  },
  exactBadge: {
    backgroundColor: '#10b981',
  },
  allBadge: {
    backgroundColor: '#8b5cf6',
    marginRight: 16,
  },
  otherBadge: {
    backgroundColor: '#6b7280',
    marginRight: 16,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
});