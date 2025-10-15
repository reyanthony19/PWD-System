import React, { useEffect, useState } from "react";
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
  const [eventsAttended, setEventsAttended] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
    }, [])
  );

  const fetchUserData = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.replace("Login");
        return;
      }

      // Fetch user profile first to get barangay
      const userRes = await api.get("/user");
      setUser(userRes.data);

      const memberBarangay = userRes.data?.member_profile?.barangay;

      if (!memberBarangay) {
        setError("Barangay information not found in profile");
        setLoading(false);
        return;
      }

      // Fetch member-specific data in parallel
      await Promise.all([
        fetchMemberStats(userRes.data.id, memberBarangay),
        fetchUpcomingEvents(memberBarangay),
        fetchMemberBenefits(userRes.data.id),
        fetchMemberAttendance(userRes.data.id),
        fetchEventsAttended(userRes.data.id, memberBarangay)
      ]);

    } catch (error) {
      console.error("User data fetch error:", error);
      if (error.response?.status === 401) {
        await AsyncStorage.removeItem("token");
        navigation.replace("Login");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberStats = async (userId, memberBarangay) => {
    try {
      // Calculate member-specific statistics from actual data
      const benefitsRes = await api.get(`/users/${userId}/benefits`);
      const attendanceRes = await api.get(`/users/${userId}/attendances`);
      const eventsRes = await api.get("/events");

      const benefitsData = benefitsRes.data.data || benefitsRes.data || [];
      const attendanceData = attendanceRes.data.data || attendanceRes.data || [];
      const allEvents = eventsRes.data.data || eventsRes.data || [];

      // Filter events by member's barangay
      const barangayEvents = allEvents.filter(event =>
        event.target_barangay === memberBarangay
      );

      const claimedBenefits = benefitsData.filter(b => b.status === 'claimed');
      const totalBenefitsValue = claimedBenefits.reduce((sum, benefit) => sum + (benefit.amount || 0), 0);

      const stats = {
        totalEvents: barangayEvents.length,
        eventsAttended: attendanceData.length,
        benefitsReceived: claimedBenefits.length,
        pendingBenefits: benefitsData.filter(b => b.status === 'pending').length,
        totalBenefitsValue: totalBenefitsValue,
        attendanceRate: barangayEvents.length > 0
          ? Math.round((attendanceData.length / barangayEvents.length) * 100)
          : 0,
        memberBarangay: memberBarangay
      };

      setMemberStats(stats);

    } catch (error) {
      console.error("Stats fetch error:", error);
    }
  };

  const fetchUpcomingEvents = async (memberBarangay) => {
    try {
      const res = await api.get("/events");
      const eventsData = res.data.data || res.data || [];

      // Filter events by member's barangay and get upcoming ones
      const now = new Date();
      const barangayEvents = eventsData.filter(event =>
        event.target_barangay === memberBarangay
      );

      const upcomingEvents = barangayEvents
        .filter(event => event.event_date && new Date(event.event_date) >= now)
        .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
        .slice(0, 5);

      setEvents(upcomingEvents);

    } catch (err) {
      console.error("Events fetch error:", err);
      setError("Failed to load events.");
    }
  };

  const fetchMemberBenefits = async (userId) => {
    try {
      const res = await api.get(`/users/${userId}/benefits`);
      const benefitsData = res.data.data || res.data || [];

      // Sort by date, most recent first
      const sortedBenefits = benefitsData.sort((a, b) =>
        new Date(b.claimed_at || b.created_at) - new Date(a.claimed_at || a.created_at)
      );

      setBenefits(sortedBenefits);

    } catch (error) {
      console.error("Benefits fetch error:", error);
    }
  };

  const fetchMemberAttendance = async (userId) => {
    try {
      const res = await api.get(`/users/${userId}/attendances`);
      const attendanceData = res.data.data || res.data || [];
      setAttendance(attendanceData);

    } catch (error) {
      console.error("Attendance fetch error:", error);
    }
  };

  const fetchEventsAttended = async (userId, memberBarangay) => {
    try {
      // Get all events first
      const eventsRes = await api.get("/events");
      const allEvents = eventsRes.data.data || eventsRes.data || [];

      // Filter events by member's barangay
      const barangayEvents = allEvents.filter(event =>
        event.target_barangay === memberBarangay
      );

      // Get user's attendance records
      const attendanceRes = await api.get(`/users/${userId}/attendances`);
      const userAttendance = attendanceRes.data.data || attendanceRes.data || [];

      // Filter events that user attended (only from their barangay)
      const attendedEvents = barangayEvents.filter(event =>
        userAttendance.some(att => att.event_id === event.id)
      );

      setEventsAttended(attendedEvents);

    } catch (error) {
      console.error("Events attended fetch error:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  };

  // Generate personalized reports based on actual member data
  const generateMemberReports = () => {
    if (!memberStats) return [];

    const reports = [
      {
        id: 1,
        title: "Monthly Support Summary",
        type: "Financial",
        date: new Date().toISOString().split('T')[0],
        status: "Generated",
        icon: "file-chart",
        color: "#10b981",
        description: `Total benefits received: ₱${memberStats.totalBenefitsValue.toLocaleString()}`
      },
      {
        id: 2,
        title: "Event Participation Report",
        type: "Attendance",
        date: new Date().toISOString().split('T')[0],
        status: "Generated",
        icon: "calendar-check",
        color: "#3b82f6",
        description: `Attended ${memberStats.eventsAttended} of ${memberStats.totalEvents} events in ${memberStats.memberBarangay} (${memberStats.attendanceRate}% rate)`
      },
      {
        id: 3,
        title: "Benefit Distribution History",
        type: "Benefits",
        date: new Date().toISOString().split('T')[0],
        status: "Generated",
        icon: "gift",
        color: "#8b5cf6",
        description: `${memberStats.benefitsReceived} benefits claimed, ${memberStats.pendingBenefits} pending`
      }
    ];

    // Add recent benefit claims as individual reports
    benefits.slice(0, 2).forEach((benefit, index) => {
      reports.push({
        id: 4 + index,
        title: `${benefit.type === 'cash' ? 'Cash' : 'Relief'} Benefit`,
        type: "Claim",
        date: benefit.claimed_at || benefit.created_at,
        status: benefit.status === 'claimed' ? 'Completed' : 'Pending',
        icon: benefit.type === 'cash' ? 'cash' : 'package-variant',
        color: benefit.status === 'claimed' ? '#10b981' : '#f59e0b',
        description: `Amount: ₱${benefit.amount || '0'} | Status: ${benefit.status}`
      });
    });

    return reports;
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
        title: "Total Support",
        value: `₱${memberStats.totalBenefitsValue.toLocaleString()}`,
        icon: "hand-heart",
        color: "#8b5cf6"
      },
      {
        id: 4,
        title: "Attendance Rate",
        value: `${memberStats.attendanceRate}%`,
        icon: "chart-line",
        color: "#f59e0b",
        subtitle: `in ${memberStats.memberBarangay}`
      }
    ];
  };

  const renderQuickStats = () => {
    const stats = generateQuickStats();

    return (
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
    );
  };

  const renderReport = ({ item }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => {
        if (item.type === "Claim") {
          navigation.navigate('BenefitDetails', { benefitId: item.id });
        }
      }}
    >
      <View style={styles.reportContent}>
        <View style={styles.reportHeader}>
          <View style={[styles.reportIcon, { backgroundColor: item.color }]}>
            <Icon name={item.icon} size={20} color="#fff" />
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportTitle}>{item.title}</Text>
            <Text style={styles.reportType}>{item.type}</Text>
            <Text style={styles.reportDescription}>{item.description}</Text>
          </View>
          <Badge style={[
            styles.statusBadge,
            { backgroundColor: item.status === 'Completed' ? '#10b981' : '#f59e0b' }
          ]}>
            {item.status}
          </Badge>
        </View>
        <Text style={styles.reportDate}>Generated on {new Date(item.date).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

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
          📅 {new Date(item.event_date).toLocaleDateString()}
        </Text>
        <Text style={styles.eventTime}>
          ⏰ {new Date(item.event_date).toLocaleTimeString()}
        </Text>
        <View style={styles.barangayBadge}>
          <Icon name="map-marker" size={12} color="#3b82f6" />
          <Text style={styles.eventBarangay}>{item.target_barangay}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderRecentBenefit = ({ item }) => (
    <TouchableOpacity
      style={styles.benefitCard}
      onPress={() => navigation.navigate('BenefitDetails', { benefitId: item.id })}
    >
      <View style={styles.benefitHeader}>
        <View style={[
          styles.benefitIcon,
          { backgroundColor: item.status === 'claimed' ? '#10b981' : '#f59e0b' }
        ]}>
          <Icon
            name={item.type === 'cash' ? 'cash' : 'package-variant'}
            size={20}
            color="#fff"
          />
        </View>
        <View style={styles.benefitInfo}>
          <Text style={styles.benefitTitle}>{item.name}</Text>
          <Text style={styles.benefitType}>
            {item.type === 'cash' ? 'Cash Benefit' : 'Relief Goods'}
          </Text>
        </View>
        <Badge style={[
          styles.benefitStatus,
          { backgroundColor: item.status === 'claimed' ? '#10b981' : '#f59e0b' }
        ]}>
          {item.status}
        </Badge>
      </View>
      {item.amount && (
        <Text style={styles.benefitAmount}>₱{item.amount.toLocaleString()}</Text>
      )}
      {item.claimed_at && (
        <Text style={styles.benefitDate}>
          Claimed on {new Date(item.claimed_at).toLocaleDateString()}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loding</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const memberReports = generateMemberReports();
  const recentBenefits = benefits.slice(0, 3);
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

          {/* Upcoming Events Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Events in {memberBarangay}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Events')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {events.length === 0 ? (
              <View style={styles.emptyCard}>
                <Icon name="calendar-remove" size={40} color="#9ca3af" />
                <Text style={styles.emptyText}>No upcoming events in {memberBarangay}</Text>
                <Text style={styles.emptySubtext}>Check back later for new events in your barangay</Text>
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

          {/* Recent Benefits Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Benefits</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Benefits')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {recentBenefits.length === 0 ? (
              <View style={styles.emptyCard}>
                <Icon name="gift-off" size={40} color="#9ca3af" />
                <Text style={styles.emptyText}>No benefits yet</Text>
                <Text style={styles.emptySubtext}>Benefits will appear here when available</Text>
              </View>
            ) : (
              <FlatList
                data={recentBenefits}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderRecentBenefit}
                scrollEnabled={false}
              />
            )}
          </View>

          {/* Your Reports Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Reports</Text>
              <Text style={styles.seeAllText}>Auto-generated</Text>
            </View>
            {memberReports.length === 0 ? (
              <View style={styles.emptyCard}>
                <Icon name="file-document-outline" size={40} color="#9ca3af" />
                <Text style={styles.emptyText}>No reports available</Text>
                <Text style={styles.emptySubtext}>Reports will generate as you participate</Text>
              </View>
            ) : (
              <FlatList
                data={memberReports}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderReport}
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
                onPress={() => navigation.navigate("Benefits")}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#10b981' }]}>
                  <Icon name="gift" size={24} color="#fff" />
                </View>
                <Text style={styles.actionText}>Benefits</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate("Events")}
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

// ... (keep the same styles)
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
    alignItems: "center"
  },
  loadingText: {
    marginTop: 12,
    color: "#2563eb",
    fontSize: 16
  },
  errorText: {
    color: "#ef4444",
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16
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
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },

  // Quick Stats
  statsContainer: {
    marginBottom: 24
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

  // Reports
  reportCard: {
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    elevation: 1
  },
  reportContent: {
    padding: 16
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  reportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2
  },
  reportInfo: {
    flex: 1
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2
  },
  reportType: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4
  },
  reportDescription: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 16
  },
  statusBadge: {
    alignSelf: 'flex-start'
  },
  reportDate: {
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