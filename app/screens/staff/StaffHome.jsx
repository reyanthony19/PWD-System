import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert
} from "react-native";
import { Card, Avatar, Badge } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import api from "@/services/api";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import NetInfo from '@react-native-community/netinfo';

// Cache configuration
const CACHE_KEYS = {
  USER_DATA: 'staff_home_user_data',
  MEMBERS: 'staff_home_members',
  EVENTS: 'staff_home_events',
  PAST_EVENTS: 'staff_home_past_events',
  LAST_FETCH: 'staff_home_last_fetch'
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

export default function StaffHome() {
  const navigation = useNavigation();
  const [user, setUser] = useState({});
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [isOnline, setIsOnline] = useState(true);

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

  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
    }, [])
  );

  // Enhanced Cache utilities
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

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.navigate("Login");
        return;
      }

      // Fetch user profile
      const userRes = await api.get("/user");

      if (!userRes.data) {
        throw new Error('Failed to fetch user data');
      }

      setUser(userRes.data);

      // Fetch all data in parallel
      await Promise.all([
        fetchMembersData(),
        fetchEvents()
      ]);

    } catch (error) {
      console.error("User data fetch error:", error);

      if (error.response?.status === 401) {
        await AsyncStorage.removeItem("token");
        navigation.navigate("Login");
        return;
      }

      setError("Failed to load data. " + (error.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const fetchMembersData = async () => {
    try {
      let membersData = [];

      if (isOnline) {
        try {
          const token = await AsyncStorage.getItem("token");
          if (!token) return;

          const usersRes = await api.get("/users", { headers: { Authorization: `Bearer ${token}` } });
          membersData = (usersRes.data || []).filter(
            (u) => u.status === "approved" && u.role === "member"
          );

          // Cache the members data
          await setCache(CACHE_KEYS.MEMBERS, membersData);
        } catch (err) {
          console.error("Members fetch error:", err);
          // If online fetch fails, try to use cached members
          const cachedMembers = await getCache(CACHE_KEYS.MEMBERS);
          if (cachedMembers) {
            membersData = cachedMembers;
          } else {
            throw new Error("Failed to fetch members data");
          }
        }
      } else {
        // Offline - use cached members
        const cachedMembers = await getCache(CACHE_KEYS.MEMBERS);
        if (cachedMembers) {
          membersData = cachedMembers;
        } else {
          throw new Error("OFFLINE_NO_CACHE");
        }
      }

      if (isMountedRef.current) {
        setMembers(membersData);
      }

    } catch (error) {
      console.error("Members fetch error:", error);
      setError("Failed to load members data");
    }
  };

  const fetchEvents = async () => {
    try {
      let eventsData = [];

      if (isOnline) {
        try {
          const token = await AsyncStorage.getItem("token");
          if (!token) return;

          const eventsRes = await api.get("/events", { headers: { Authorization: `Bearer ${token}` } });
          eventsData = Array.isArray(eventsRes.data?.data) ? eventsRes.data.data : [];

          const usersRes = await api.get("/users", { headers: { Authorization: `Bearer ${token}` } });
          const users = usersRes.data || [];

          const userMap = users.reduce((acc, u) => {
            acc[u.id] = u.username;
            return acc;
          }, {});

          const updatedEvents = eventsData.map((e) => ({
            ...e,
            username: userMap[e.user_id] || "Unknown",
          }));

          eventsData = updatedEvents;

          // Cache the events data
          await setCache(CACHE_KEYS.EVENTS, eventsData);
        } catch (err) {
          console.error("Events fetch error:", err);
          // If online fetch fails, try to use cached events
          const cachedEvents = await getCache(CACHE_KEYS.EVENTS);
          if (cachedEvents) {
            eventsData = cachedEvents;
          } else {
            throw new Error("Failed to fetch events data");
          }
        }
      } else {
        // Offline - use cached events
        const cachedEvents = await getCache(CACHE_KEYS.EVENTS);
        if (cachedEvents) {
          eventsData = cachedEvents;
        } else {
          throw new Error("OFFLINE_NO_CACHE");
        }
      }

      const now = new Date();
      const upcomingEvents = eventsData.filter((e) => new Date(e.event_date) > now);
      const pastEventsData = eventsData.filter((e) => new Date(e.event_date) <= now);

      if (isMountedRef.current) {
        setEvents(upcomingEvents);
        setPastEvents(pastEventsData);
      }

      checkUpcomingEvents(eventsData);

    } catch (error) {
      console.error("Events fetch error:", error);
      setError("Failed to load events");
    }
  };

  const checkUpcomingEvents = (list) => {
    const now = new Date();
    list.forEach((event) => {
      const eventDate = new Date(event.event_date);
      const diffDays = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
      if (diffDays === 3) {
        Alert.alert("Upcoming Event", `The event "${event.title}" is in 3 days!`);
      }
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setError("");

    // Clear cache on refresh to get fresh data
    try {
      await AsyncStorage.multiRemove([
        CACHE_KEYS.MEMBERS,
        CACHE_KEYS.EVENTS,
        CACHE_KEYS.PAST_EVENTS
      ]);
      console.log('🧹 Cleared cache for refresh');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }

    await fetchUserData();
    setRefreshing(false);
  };

  const generateQuickStats = () => {
    const stats = [
      {
        id: 1,
        title: "Total Members",
        value: members.length.toString(),
        icon: "account-group",
        color: "#3b82f6"
      },
      {
        id: 2,
        title: "Upcoming Events",
        value: events.length.toString(),
        icon: "calendar-clock",
        color: "#10b981"
      },
      {
        id: 3,
        title: "Past Events",
        value: pastEvents.length.toString(),
        icon: "calendar-check",
        color: "#f59e0b"
      }
    ];

    return stats;
  };

  const renderQuickStats = () => {
    const stats = generateQuickStats();

    return (
      <View>
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Icon name="wifi-off" size={16} color="#fff" />
            <Text style={styles.offlineText}>You're offline - showing cached data</Text>
          </View>
        )}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statsContainer}
        >
          {stats.map((stat) => (
            <View key={stat.id} style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}20` }]}>
                <Icon name={stat.icon} size={24} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderEvent = ({ item }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => navigation.navigate("EventDetails", { eventId: item.id })}
    >
      <View style={styles.eventHeader}>
        <Avatar.Icon
          icon="calendar"
          style={{ backgroundColor: "#2563eb" }}
        />
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <Text style={styles.eventCreator}>By: {item.username}</Text>
        </View>
      </View>
      <View style={styles.eventDetails}>
        <Text style={styles.eventDetail}>
          📅 {new Date(item.event_date).toLocaleDateString()}
        </Text>
        <Text style={styles.eventLocation}>
          📍 {item.location || 'Location not specified'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderPastEvent = ({ item }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => navigation.navigate("EventDetails", { eventId: item.id })}
    >
      <View style={styles.eventHeader}>
        <Avatar.Icon
          icon="calendar-check"
          style={{ backgroundColor: "#6b7280" }}
        />
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <Text style={styles.eventCreator}>By: {item.username}</Text>
        </View>
        <Badge style={styles.pastBadge}>Past</Badge>
      </View>
      <View style={styles.eventDetails}>
        <Text style={styles.eventDetail}>
          📅 {new Date(item.event_date).toLocaleDateString()}
        </Text>
        <Text style={styles.eventLocation}>
          📍 {item.location || 'Location not specified'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading Staff Dashboard...</Text>
        {!isOnline && (
          <Text style={styles.offlineHint}>You're offline - using cached data</Text>
        )}
      </SafeAreaView>
    );
  }

  if (error && !user) {
    return (
      <SafeAreaView style={styles.center}>
        <Icon name="alert-circle-outline" size={50} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient
      colors={["#667eea", "#764ba2"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2563eb"]}
              tintColor="#2563eb"
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.welcomeText}>Staff Dashboard</Text>
              <Text style={styles.userName}>
                Welcome, {user?.username || 'Staff'}
              </Text>
              <View style={styles.barangayContainer}>
                <Icon name="shield-account" size={14} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.memberBarangay}>
                  Staff Account
                </Text>
                {!isOnline && (
                  <Icon name="wifi-off" size={12} color="rgba(255, 255, 255, 0.6)" style={styles.offlineIcon} />
                )}
              </View>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
              <Avatar.Icon
                size={50}
                icon="account-tie"
                style={styles.avatar}
              />
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          {renderQuickStats()}

          {/* Error Banner */}
          {error && (
            <View style={styles.errorBanner}>
              <Icon name="information" size={16} color="#fff" />
              <Text style={styles.errorBannerText}>{error}</Text>
              <TouchableOpacity onPress={onRefresh}>
                <Icon name="refresh" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* Upcoming Events Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Events ({events.length})</Text>
              <TouchableOpacity onPress={() => navigation.navigate('StaffEvents')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {events.length === 0 ? (
              <View style={styles.emptyCard}>
                <Icon name="calendar-remove" size={40} color="#9ca3af" />
                <Text style={styles.emptyText}>No upcoming events</Text>
                <Text style={styles.emptySubtext}>Create new events to get started</Text>
              </View>
            ) : (
              <FlatList
                data={events}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderEvent}
                scrollEnabled={false}
              />
            )}
          </View>

          {/* Past Events Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Past Events ({pastEvents.length})</Text>
              <TouchableOpacity onPress={() => navigation.navigate('StaffPastEvents')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {pastEvents.length === 0 ? (
              <View style={styles.emptyCard}>
                <Icon name="history" size={40} color="#9ca3af" />
                <Text style={styles.emptyText}>No past events</Text>
                <Text style={styles.emptySubtext}>Completed events will appear here</Text>
              </View>
            ) : (
              <FlatList
                data={pastEvents.slice(0, 5)} // Show only 5 past events
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderPastEvent}
                scrollEnabled={false}
              />
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('StaffMembers')}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#3b82f6' }]}>
                  <Icon name="account-group" size={24} color="#fff" />
                </View>
                <Text style={styles.actionText}>Manage Members</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate("StaffCreateEvent")}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#10b981' }]}>
                  <Icon name="calendar-plus" size={24} color="#fff" />
                </View>
                <Text style={styles.actionText}>Create Event</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate("StaffEvents")}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#8b5cf6' }]}>
                  <Icon name="calendar" size={24} color="#fff" />
                </View>
                <Text style={styles.actionText}>All Events</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate("StaffAnalytics")}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#f59e0b' }]}>
                  <Icon name="chart-bar" size={24} color="#fff" />
                </View>
                <Text style={styles.actionText}>Analytics</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Spacing */}
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  loadingText: {
    marginTop: 12,
    color: "#2563eb",
    fontSize: 16
  },
  offlineHint: {
    marginTop: 8,
    color: "#6b7280",
    fontSize: 12,
    textAlign: 'center'
  },
  errorText: {
    color: "#ef4444",
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 12
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  retryText: {
    color: '#fff',
    fontWeight: '600'
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24
  },
  welcomeText: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4
  },
  barangayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  memberBarangay: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
    fontWeight: '500'
  },
  offlineIcon: {
    marginLeft: 6
  },
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },

  // Quick Stats
  statsContainer: {
    marginBottom: 16
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },
  statTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center'
  },

  // Offline and Error Banners
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)'
  },
  offlineText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 6,
    flex: 1
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)'
  },
  errorBannerText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    marginRight: 8
  },

  // Sections
  section: {
    marginBottom: 24
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1
  },
  seeAllText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500'
  },

  // Events
  eventCard: {
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    padding: 16,
    elevation: 2
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  eventInfo: {
    flex: 1,
    marginLeft: 12
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827"
  },
  eventCreator: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2
  },
  eventDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12
  },
  eventDetail: {
    fontSize: 14,
    color: "#374151"
  },
  eventLocation: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4
  },
  pastBadge: {
    backgroundColor: '#6b7280'
  },

  // Quick Actions
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap'
  },
  actionButton: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center'
  },

  // Empty States
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    elevation: 1
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center'
  },
  emptySubtext: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center'
  },

  bottomSpacing: {
    height: 20
  }
});