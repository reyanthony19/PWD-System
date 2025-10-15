import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl
} from "react-native";
import { Card, Avatar, Badge } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import api from "@/services/api";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import NetInfo from '@react-native-community/netinfo';

// Enhanced Cache configuration
const CACHE_KEYS = {
  USER_DATA: 'member_home_user_data',
  EVENTS: 'member_home_events',
  BENEFITS: 'member_home_benefits',
  BENEFIT_RECORDS: 'member_home_benefit_records',
  BENEFIT_PARTICIPANTS: 'member_home_benefit_participants',
  PARTICIPANTS_MAP: 'member_home_participants_map',
  LAST_FETCH: 'member_home_last_fetch'
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
const CACHE_DURATION_PARTICIPANTS = 30 * 60 * 1000; // 30 minutes for participants

export default function MemberHome() {
  const navigation = useNavigation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [memberStats, setMemberStats] = useState(null);
  const [benefits, setBenefits] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [benefitRecords, setBenefitRecords] = useState([]);

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

  // NEW: Enhanced datetime combination function for events
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

  // NEW: Format event time for display
  const formatEventTime = (event) => {
    if (!event) return 'Time not set';
    
    if (event.event_time) {
      try {
        // Handle different time formats
        const timeParts = event.event_time.split(':');
        const hours = parseInt(timeParts[0]);
        const minutes = timeParts[1];
        
        // Format as 12-hour time with AM/PM
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        
        return `${displayHours}:${minutes} ${period}`;
      } catch (error) {
        console.error('Error formatting event time:', error);
        return event.event_time;
      }
    }
    
    return 'Time not set';
  };

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

  // NEW: Get cache with custom duration
  const getCacheWithDuration = async (key, duration) => {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const isExpired = Date.now() - cacheData.timestamp > duration;

      return isExpired ? null : cacheData.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  };

  // NEW: Add delay utility to prevent rate limiting
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // NEW: Enhanced benefit participants caching
  const fetchBenefitParticipantsWithCache = async (benefitId, userId) => {
    const cacheKey = `${CACHE_KEYS.BENEFIT_PARTICIPANTS}_${benefitId}`;

    try {
      // Try cache first (with longer duration for participants)
      const cachedParticipants = await getCacheWithDuration(cacheKey, CACHE_DURATION_PARTICIPANTS);
      if (cachedParticipants) {
        console.log(`✅ Using cached participants for benefit ${benefitId}`);
        return cachedParticipants;
      }

      // If not cached or expired, fetch from API
      if (isOnline) {
        console.log(`🌐 Fetching participants for benefit ${benefitId}`);
        const response = await api.get(`/benefits/${benefitId}/participants`);
        const participants = response.data || [];

        // Cache the result
        await setCache(cacheKey, participants);

        return participants;
      } else {
        console.log(`📶 Offline - no cached participants for benefit ${benefitId}`);
        return [];
      }
    } catch (error) {
      console.error(`❌ Error fetching participants for benefit ${benefitId}:`, error);

      // On error, try to return cached data even if expired
      const cachedParticipants = await getCache(cacheKey);
      if (cachedParticipants) {
        console.log(`🔄 Using expired cache due to error for benefit ${benefitId}`);
        return cachedParticipants;
      }

      return [];
    }
  };

  // NEW: Batch process benefit participants to avoid rate limiting
  const batchProcessBenefitParticipants = async (benefitsData, userId) => {
    if (!benefitsData || !Array.isArray(benefitsData)) return [];

    const filteredBenefits = [];
    const batchSize = 2; // Process 2 benefits at a time
    const delayBetweenBatches = 1000; // 1 second between batches

    for (let i = 0; i < benefitsData.length; i += batchSize) {
      const batch = benefitsData.slice(i, i + batchSize);

      const batchPromises = batch.map(async (benefit) => {
        try {
          const participants = await fetchBenefitParticipantsWithCache(benefit.id, userId);
          const isParticipant = participants.some(participant =>
            participant.user_id === userId ||
            (participant.user && participant.user.id === userId)
          );

          return isParticipant ? benefit : null;
        } catch (error) {
          console.log(`Error processing benefit ${benefit.id}:`, error);
          return null;
        }
      });

      // Wait for current batch to complete
      const batchResults = await Promise.all(batchPromises);
      const validBenefits = batchResults.filter(benefit => benefit !== null);
      filteredBenefits.push(...validBenefits);

      // Add delay between batches to avoid rate limiting
      if (i + batchSize < benefitsData.length) {
        await delay(delayBetweenBatches);
      }
    }

    return filteredBenefits;
  };

  // UPDATED: Check if user is in benefit participants with caching
  const isUserInBenefitParticipants = async (benefitId, userId) => {
    try {
      const participants = await fetchBenefitParticipantsWithCache(benefitId, userId);
      return participants.some(participant =>
        participant.user_id === userId ||
        (participant.user && participant.user.id === userId)
      );
    } catch (error) {
      console.log('Error checking benefit participants:', error);
      return false;
    }
  };

  // UPDATED: Filter benefits where user is in participants with batching
  const filterBenefitsByUserParticipation = async (benefitsData, userId) => {
    if (!benefitsData || !Array.isArray(benefitsData)) return [];

    // If no benefits, return empty array
    if (benefitsData.length === 0) return [];

    console.log(`🔍 Filtering ${benefitsData.length} benefits for user participation`);

    // Use batch processing to avoid rate limiting
    return await batchProcessBenefitParticipants(benefitsData, userId);
  };

  // UPDATED: Check if user has claimed a benefit using benefit records
  const isBenefitClaimedByUser = (benefitId, userId, records) => {
    if (!records || !Array.isArray(records)) return false;

    return records.some(record =>
      record.benefit_id === benefitId &&
      (record.user_id === userId || (record.user && record.user.id === userId))
    );
  };

  // UPDATED: Filter benefits and determine availability/claimed status
  const filterBenefitsWithClaimStatus = (benefitsData, userId, records) => {
    if (!benefitsData || !Array.isArray(benefitsData)) return [];

    return benefitsData.map(benefit => {
      // Check if user has claimed this benefit
      const isClaimed = isBenefitClaimedByUser(benefit.id, userId, records);

      // Find the actual record for claimed date
      const userRecord = records.find(record =>
        record.benefit_id === benefit.id &&
        (record.user_id === userId || (record.user && record.user.id === userId))
      );

      // Determine benefit status
      let status = 'available';
      if (isClaimed) {
        status = 'claimed';
      } else if (benefit.status === 'completed' || benefit.status === 'distributed') {
        status = 'completed';
      } else if (benefit.status === 'cancelled') {
        status = 'cancelled';
      }

      return {
        ...benefit,
        userStatus: status, // User-specific status
        isClaimed: isClaimed,
        claimed_at: userRecord ? userRecord.created_at : null,
        userRecord: userRecord // Store the full record for reference
      };
    });
  };

  // UPDATED: Sort benefits: available first, then claimed, then by date
  const sortBenefits = (benefits) => {
    if (!benefits || !Array.isArray(benefits)) return [];

    return benefits.sort((a, b) => {
      const statusOrder = {
        'available': 1,
        'claimed': 2,
        'completed': 3,
        'cancelled': 4
      };

      const aOrder = statusOrder[a.userStatus] || 5;
      const bOrder = statusOrder[b.userStatus] || 5;

      // Prioritize by status
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      // If same status, sort by date (newest first)
      const dateA = new Date(a.start_date || a.created_at);
      const dateB = new Date(b.start_date || b.created_at);
      return dateB - dateA;
    });
  };

  // Fetch user benefit records
  const fetchUserBenefitRecords = async (userId) => {
    try {
      let records = [];

      if (isOnline) {
        try {
          // Fetch all benefit records using the correct endpoint
          const response = await api.get("/benefit-records");
          const allRecords = response.data.data || response.data || [];

          // Filter records for current user only
          records = allRecords.filter(record =>
            record.user_id === userId ||
            (record.user && record.user.id === userId)
          );

          // Cache the filtered records
          await setCache(CACHE_KEYS.BENEFIT_RECORDS, records);
        } catch (error) {
          console.error('Error fetching benefit records:', error);
          // If online fetch fails, try cached records
          const cachedRecords = await getCache(CACHE_KEYS.BENEFIT_RECORDS);
          if (cachedRecords) {
            records = cachedRecords;
          }
        }
      } else {
        // Offline - use cached records
        const cachedRecords = await getCache(CACHE_KEYS.BENEFIT_RECORDS);
        if (cachedRecords) {
          records = cachedRecords;
        }
      }

      if (isMountedRef.current) {
        setBenefitRecords(records);
      }

      return records;
    } catch (error) {
      console.error('Error in fetchUserBenefitRecords:', error);
      return [];
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
      const memberBarangay = userRes.data?.member_profile?.barangay;
      const userId = userRes.data.id;

      if (!memberBarangay) {
        setError("Barangay information not found in profile");
        setLoading(false);
        return;
      }

      // Fetch benefit records first, then other data
      const records = await fetchUserBenefitRecords(userId);

      // Fetch all other data in parallel
      await Promise.all([
        fetchMemberStats(userId, memberBarangay, records),
        fetchUpcomingEvents(memberBarangay),
        fetchMemberBenefits(userId, records), // Pass records to benefits fetch
        fetchMemberAttendance(userId)
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

  // UPDATED: Fetch benefits with enhanced caching and batching - LIMIT TO 5
  const fetchMemberBenefits = async (userId, records) => {
    try {
      let benefitsData = [];

      if (isOnline) {
        try {
          // Fetch ALL benefits first
          const res = await api.get("/benefits");
          benefitsData = res.data.data || res.data || [];

          // Cache the benefits
          await setCache(CACHE_KEYS.BENEFITS, benefitsData);
        } catch (err) {
          console.error("Benefits fetch error:", err);
          // If online fetch fails, try to use cached benefits
          const cachedBenefits = await getCache(CACHE_KEYS.BENEFITS);
          if (cachedBenefits) {
            benefitsData = cachedBenefits;
          } else {
            throw new Error("Failed to fetch benefits");
          }
        }
      } else {
        // Offline - use cached benefits
        const cachedBenefits = await getCache(CACHE_KEYS.BENEFITS);
        if (cachedBenefits) {
          benefitsData = cachedBenefits;
        } else {
          throw new Error("OFFLINE_NO_CACHE");
        }
      }

      // STEP 1: Filter benefits where user is in participants (with batching)
      const userBenefits = await filterBenefitsByUserParticipation(benefitsData, userId);

      // STEP 2: Determine claim status using benefit records
      const benefitsWithStatus = filterBenefitsWithClaimStatus(userBenefits, userId, records);

      // STEP 3: Sort benefits: available first, then claimed
      const sortedBenefits = sortBenefits(benefitsWithStatus);

      // UPDATED: Take only recent 5 benefits for home screen
      const recentBenefits = sortedBenefits.slice(0, 5);

      if (isMountedRef.current) {
        setBenefits(recentBenefits);
      }

    } catch (error) {
      console.error("Benefits fetch error:", error);
      // Don't set error here to avoid breaking the whole home screen
    }
  };

  // UPDATED: Fetch member stats with records
  const fetchMemberStats = async (userId, memberBarangay, records) => {
    try {
      const [benefitsData, attendanceData, eventsData] = await Promise.all([
        api.get(`/benefits`).then(res => res.data.data || res.data).catch(() => []),
        api.get(`/users/${userId}/attendances`).then(res => res.data.data || res.data).catch(() => []),
        api.get("/events").then(res => res.data.data || res.data).catch(() => [])
      ]);

      // STEP 1: Filter benefits where user is in participants
      const userBenefits = await filterBenefitsByUserParticipation(benefitsData, userId);

      // STEP 2: Determine claim status using benefit records
      const benefitsWithStatus = filterBenefitsWithClaimStatus(userBenefits, userId, records);

      const barangayEvents = eventsData.filter(event =>
        event.target_barangay === memberBarangay || event.target_barangay === "All"
      );

      // UPDATED: Use userStatus for stats calculation
      const claimedBenefits = benefitsWithStatus.filter(b => b.userStatus === 'claimed');
      const availableBenefits = benefitsWithStatus.filter(b => b.userStatus === 'available');

      const totalBenefitsValue = claimedBenefits.reduce((sum, benefit) => sum + (benefit.amount || 0), 0);

      const stats = {
        totalEvents: barangayEvents.length,
        eventsAttended: attendanceData.length,
        benefitsReceived: claimedBenefits.length,
        availableBenefits: availableBenefits.length,
        totalBenefitsValue: totalBenefitsValue,
        attendanceRate: barangayEvents.length > 0
          ? Math.round((attendanceData.length / barangayEvents.length) * 100)
          : 0,
        memberBarangay: memberBarangay,
        lastUpdated: new Date().toLocaleString()
      };

      if (isMountedRef.current) {
        setMemberStats(stats);
      }

    } catch (error) {
      console.error("Stats fetch error:", error);
    }
  };

  // UPDATED: Fetch upcoming events with proper datetime handling - LIMIT TO 5
  const fetchUpcomingEvents = async (memberBarangay) => {
    try {
      const eventsData = await api.get("/events").then(res => res.data.data || res.data);

      const now = new Date();
      const barangayEvents = eventsData.filter(event =>
        event.target_barangay === memberBarangay || event.target_barangay === "All"
      );

      // ENHANCED: Use combined datetime for proper filtering
      const upcomingEvents = barangayEvents
        .filter(event => {
          const eventDateTime = combineEventDateTime(event);
          return eventDateTime && eventDateTime >= now;
        })
        .sort((a, b) => {
          const dateTimeA = combineEventDateTime(a);
          const dateTimeB = combineEventDateTime(b);
          return dateTimeA - dateTimeB; // Sort by soonest first
        })
        .slice(0, 5); // UPDATED: Only show 5 events on home

      if (isMountedRef.current) {
        setEvents(upcomingEvents);
      }

    } catch (err) {
      console.error("Events fetch error:", err);
    }
  };

  const fetchMemberAttendance = async (userId) => {
    try {
      const attendanceData = await api.get(`/users/${userId}/attendances`).then(res => res.data.data || res.data);

      if (isMountedRef.current) {
        setAttendance(attendanceData);
      }

    } catch (error) {
      console.error("Attendance fetch error:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setError("");

    // Clear participants cache on refresh to get fresh data
    try {
      const keys = await AsyncStorage.getAllKeys();
      const participantKeys = keys.filter(key => key.includes(CACHE_KEYS.BENEFIT_PARTICIPANTS));
      await AsyncStorage.multiRemove(participantKeys);
      console.log('🧹 Cleared participants cache for refresh');
    } catch (error) {
      console.error('Error clearing participants cache:', error);
    }

    await fetchUserData();
    setRefreshing(false);
  };

  const generateQuickStats = () => {
    if (!memberStats) return [];

    return [
      {
        id: 1,
        title: "Events Attended",
        value: memberStats.eventsAttended.toString(),
        icon: "calendar-check",
        color: "#3b82f6",
        subtitle: `in ${memberStats.memberBarangay}`
      },
      {
        id: 2,
        title: "Benefits Received",
        value: memberStats.benefitsReceived.toString(),
        icon: "gift",
        color: "#10b981"
      },
      {
        id: 3,
        title: "Available Benefits",
        value: memberStats.availableBenefits.toString(),
        icon: "gift-outline",
        color: "#f59e0b"
      },
      {
        id: 4,
        title: "Total Support",
        value: `₱${memberStats.totalBenefitsValue.toLocaleString()}`,
        icon: "hand-heart",
        color: "#8b5cf6"
      },
      {
        id: 5,
        title: "Attendance Rate",
        value: `${memberStats.attendanceRate}%`,
        icon: "chart-line",
        color: "#ec4899",
        subtitle: `in ${memberStats.memberBarangay}`
      }
    ];
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
              {stat.subtitle && (
                <Text style={styles.statSubtitle}>{stat.subtitle}</Text>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  // UPDATED: Render event with proper time display
  const renderEvent = ({ item }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => navigation.navigate("MemberAttendance", {
        eventId: item.id,
        eventTitle: item.title
      })}
    >
      <View style={styles.eventHeader}>
        <Avatar.Icon
          icon="calendar"
          style={{ backgroundColor: "#2563eb" }}
        />
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <Text style={styles.eventLocation}>📍 {item.location || 'TBA'}</Text>
        </View>
      </View>
      <View style={styles.eventDetails}>
        <Text style={styles.eventDetail}>
          📅 {item.event_date ? new Date(item.event_date).toLocaleDateString() : 'Date not set'}
        </Text>
        <Text style={styles.eventTime}>
          ⏰ {formatEventTime(item)}
        </Text>
        <View style={styles.barangayBadge}>
          <Icon name="map-marker" size={12} color="#3b82f6" />
          <Text style={styles.eventBarangay}>{item.target_barangay}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderRecentBenefit = ({ item }) => {
    const isClaimed = item.userStatus === 'claimed';
    const isAvailable = item.userStatus === 'available';

    return (
      <TouchableOpacity
        style={styles.benefitCard}
        onPress={() => navigation.navigate('MemberBenefitsRecord', {
          benefitId: item.id,
          benefitTitle: item.name || item.title,
          isClaimed: isClaimed,
          benefitRecord: item.userRecord
        })}
      >
        <View style={styles.benefitHeader}>
          <View style={[
            styles.benefitIcon,
            {
              backgroundColor: isClaimed ? '#10b981' :
                isAvailable ? '#3b82f6' : '#6b7280'
            }
          ]}>
            <Icon
              name={item.type === 'cash' ? 'cash' : 'package-variant'}
              size={20}
              color="#fff"
            />
          </View>
          <View style={styles.benefitInfo}>
            <Text style={styles.benefitTitle}>{item.name || item.title || 'Benefit'}</Text>
            <Text style={styles.benefitType}>
              {item.type ? `${item.type.charAt(0).toUpperCase() + item.type.slice(1)} Benefit` : 'General Benefit'}
            </Text>
          </View>
          <Badge style={[
            styles.benefitStatus,
            {
              backgroundColor: isClaimed ? '#10b981' :
                isAvailable ? '#3b82f6' : '#6b7280'
            }
          ]}>
            {item.userStatus}
          </Badge>
        </View>
        {item.amount && (
          <Text style={styles.benefitAmount}>₱{item.amount.toLocaleString()}</Text>
        )}
        {isClaimed && item.claimed_at && (
          <Text style={styles.benefitDate}>
            Claimed on {new Date(item.claimed_at).toLocaleDateString()}
          </Text>
        )}
        {isAvailable && (
          <Text style={[styles.benefitDate, { color: '#3b82f6' }]}>
            Tap to View this benefit
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading Home Page...</Text>
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

  const memberBarangay = user?.member_profile?.barangay;

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
              <Text style={styles.welcomeText}>Welcome back!</Text>
              <Text style={styles.userName}>
                {user?.username || 'Member'}
              </Text>
              <View style={styles.barangayContainer}>
                <Icon name="map-marker" size={14} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.memberBarangay}>
                  {memberBarangay || 'Barangay not specified'}
                </Text>
                {!isOnline && (
                  <Icon name="wifi-off" size={12} color="rgba(255, 255, 255, 0.6)" style={styles.offlineIcon} />
                )}
              </View>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
              <Avatar.Icon
                size={50}
                icon="account"
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

          {/* Upcoming Events Section - UPDATED: Show 5 events */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Events ({events.length})</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Events')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {events.length === 0 ? (
              <View style={styles.emptyCard}>
                <Icon name="calendar-remove" size={40} color="#9ca3af" />
                <Text style={styles.emptyText}>No upcoming events</Text>
                <Text style={styles.emptySubtext}>Check back later for new events</Text>
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

          {/* Recent Benefits Section - UPDATED: Show 5 benefits */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Benefits ({benefits.length})</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MemberBenefits')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {benefits.length === 0 ? (
              <View style={styles.emptyCard}>
                <Icon name="gift-off" size={40} color="#9ca3af" />
                <Text style={styles.emptyText}>No benefits yet</Text>
                <Text style={styles.emptySubtext}>Benefits will appear here when available</Text>
              </View>
            ) : (
              <FlatList
                data={benefits}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderRecentBenefit}
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
                onPress={() => navigation.navigate('Profile')}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#3b82f6' }]}>
                  <Icon name="account" size={24} color="#fff" />
                </View>
                <Text style={styles.actionText}>My Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate("MemberBenefits")}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#10b981' }]}>
                  <Icon name="gift" size={24} color="#fff" />
                </View>
                <Text style={styles.actionText}>Benefits</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate("MemberEvents")}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#8b5cf6' }]}>
                  <Icon name="calendar" size={24} color="#fff" />
                </View>
                <Text style={styles.actionText}>Events</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate("MemberEditProfile")}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#f59e0b' }]}>
                  <Icon name="account-edit" size={24} color="#fff" />
                </View>
                <Text style={styles.actionText}>Edit Profile</Text>
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

// ... (styles remain exactly the same as your original)
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
    borderRadius: 8,
    marginBottom: 8
  },
  retryText: {
    color: '#fff',
    fontWeight: '600'
  },
  secondaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6'
  },
  secondaryButtonText: {
    color: '#3b82f6',
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
  statSubtitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 2
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
  eventLocation: {
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
  eventTime: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2
  },
  barangayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  eventBarangay: {
    fontSize: 12,
    color: "#3b82f6",
    marginLeft: 4,
    fontWeight: '500'
  },

  // Benefits
  benefitCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1
  },
  benefitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  benefitInfo: {
    flex: 1
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2
  },
  benefitType: {
    fontSize: 12,
    color: '#6b7280'
  },
  benefitStatus: {
    alignSelf: 'flex-start'
  },
  benefitAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4
  },
  benefitDate: {
    fontSize: 12,
    color: '#9ca3af'
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