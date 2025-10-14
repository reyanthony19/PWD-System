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
import { useNavigation } from "@react-navigation/native";
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

  // Dummy data for reports and forums
  const [reports, setReports] = useState([
    {
      id: 1,
      title: "Monthly Disability Support Report",
      type: "Support",
      date: "2024-01-15",
      status: "Completed",
      icon: "file-chart",
      color: "#10b981"
    },
    {
      id: 2,
      title: "Medical Assistance Summary",
      type: "Medical",
      date: "2024-01-10",
      status: "Pending",
      icon: "hospital",
      color: "#f59e0b"
    },
    {
      id: 3,
      title: "Financial Aid Distribution",
      type: "Financial",
      date: "2024-01-05",
      status: "Completed",
      icon: "cash",
      color: "#3b82f6"
    }
  ]);

  const [forums, setForums] = useState([
    {
      id: 1,
      title: "Physical Therapy Tips & Support",
      category: "Health & Wellness",
      members: 234,
      posts: 156,
      icon: "wheelchair",
      color: "#8b5cf6",
      lastActive: "2 hours ago"
    },
    {
      id: 2,
      title: "Employment Opportunities",
      category: "Career",
      members: 189,
      posts: 89,
      icon: "briefcase",
      color: "#06b6d4",
      lastActive: "1 day ago"
    },
    {
      id: 3,
      title: "Daily Living Assistance",
      category: "Lifestyle",
      members: 312,
      posts: 267,
      icon: "home-heart",
      color: "#ef4444",
      lastActive: "5 hours ago"
    },
    {
      id: 4,
      title: "Technology & Accessibility",
      category: "Tech",
      members: 156,
      posts: 73,
      icon: "laptop",
      color: "#84cc16",
      lastActive: "3 hours ago"
    }
  ]);

  const [quickStats, setQuickStats] = useState([
    { id: 1, title: "Events Attended", value: "12", icon: "calendar-check", color: "#3b82f6" },
    { id: 2, title: "Support Received", value: "₱15,000", icon: "hand-heart", color: "#10b981" },
    { id: 3, title: "Community Posts", value: "23", icon: "forum", color: "#8b5cf6" },
    { id: 4, title: "Documents", value: "8", icon: "file-document", color: "#f59e0b" }
  ]);

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetchUserData();
    fetchEvents();

    const intervalId = setInterval(() => {
      fetchEvents();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [navigation]);

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.replace("Login");
        return;
      }
      
      const res = await api.get("/user");
      setUser(res.data);
    } catch (error) {
      console.error("User data fetch error:", error);
    }
  };

  const fetchEvents = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setLoading(false);
        navigation.replace("Login");
        return;
      }

      const res = await api.get("/events", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setEvents(res.data.data || res.data || []);
    } catch (err) {
      console.error("Events fetch error:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        await AsyncStorage.removeItem("token");
        navigation.replace("Login");
      } else {
        setError("Failed to load events.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  const renderQuickStats = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.statsContainer}
    >
      {quickStats.map((stat) => (
        <View key={stat.id} style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}20` }]}>
            <Icon name={stat.icon} size={24} color={stat.color} />
          </View>
          <Text style={styles.statValue}>{stat.value}</Text>
          <Text style={styles.statTitle}>{stat.title}</Text>
        </View>
      ))}
    </ScrollView>
  );

  const renderReport = ({ item }) => (
    <Card style={styles.reportCard}>
      <Card.Content style={styles.reportContent}>
        <View style={styles.reportHeader}>
          <View style={[styles.reportIcon, { backgroundColor: item.color }]}>
            <Icon name={item.icon} size={20} color="#fff" />
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportTitle}>{item.title}</Text>
            <Text style={styles.reportType}>{item.type}</Text>
          </View>
          <Badge style={[
            styles.statusBadge,
            { backgroundColor: item.status === 'Completed' ? '#10b981' : '#f59e0b' }
          ]}>
            {item.status}
          </Badge>
        </View>
        <Text style={styles.reportDate}>Generated on {item.date}</Text>
      </Card.Content>
    </Card>
  );

  const renderForum = ({ item }) => (
    <TouchableOpacity 
      style={styles.forumCard}
      onPress={() => navigation.navigate('ForumDiscussion', { forumId: item.id })}
    >
      <View style={styles.forumHeader}>
        <View style={[styles.forumIcon, { backgroundColor: item.color }]}>
          <Icon name={item.icon} size={24} color="#fff" />
        </View>
        <View style={styles.forumInfo}>
          <Text style={styles.forumTitle}>{item.title}</Text>
          <Text style={styles.forumCategory}>{item.category}</Text>
        </View>
      </View>
      <View style={styles.forumStats}>
        <View style={styles.forumStat}>
          <Icon name="account-group" size={16} color="#6b7280" />
          <Text style={styles.forumStatText}>{item.members} members</Text>
        </View>
        <View style={styles.forumStat}>
          <Icon name="message-text" size={16} color="#6b7280" />
          <Text style={styles.forumStatText}>{item.posts} posts</Text>
        </View>
      </View>
      <Text style={styles.lastActive}>Last active: {item.lastActive}</Text>
    </TouchableOpacity>
  );

  const renderEvent = ({ item }) => (
    <Card
      style={styles.eventCard}
      onPress={() => navigation.navigate("MemberAttendance", { 
        eventId: item.id, 
        eventTitle: item.title 
      })}
    >
      <Card.Title
        title={item.title}
        titleStyle={styles.eventTitle}
        subtitle={`📍 ${item.location}`}
        left={(props) => (
          <Avatar.Icon
            {...props}
            icon="calendar"
            style={{ backgroundColor: "#2563eb" }}
          />
        )}
      />
      <Card.Content>
        <Text style={styles.eventDetail}>
          📅 {new Date(item.event_date).toLocaleDateString()}
        </Text>
        <Text style={styles.eventTime}>
          ⏰ {new Date(item.event_date).toLocaleTimeString()}
        </Text>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.welcomeText}>Welcome back!</Text>
              <Text style={styles.userName}>
                {user?.member_profile?.first_name || user?.username || 'Member'}
              </Text>
            </View>
            <Avatar.Icon 
              size={50} 
              icon="account" 
              style={styles.avatar} 
            />
          </View>

          {/* Quick Stats */}
          {renderQuickStats()}

          {/* Upcoming Events Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AllEvents')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {events.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Card.Content style={styles.emptyContent}>
                  <Icon name="calendar-remove" size={40} color="#9ca3af" />
                  <Text style={styles.emptyText}>No upcoming events</Text>
                  <Text style={styles.emptySubtext}>Check back later for new events</Text>
                </Card.Content>
              </Card>
            ) : (
              <FlatList
                data={events.slice(0, 3)}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderEvent}
                scrollEnabled={false}
              />
            )}
          </View>

          {/* Reports Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Reports</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AllReports')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={reports}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderReport}
              scrollEnabled={false}
            />
          </View>

          {/* Community Forums */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Community Forums</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AllForums')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={forums}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderForum}
              scrollEnabled={false}
            />
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
    alignItems: "center" 
  },
  loadingText: { 
    marginTop: 12, 
    color: "#2563eb",
    fontSize: 16 
  },
  errorText: { 
    color: "#ef4444",
    fontSize: 16 
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    backdropFilter: 'blur(10px)'
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
    color: '#fff'
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
    elevation: 2
  },
  eventTitle: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#111827" 
  },
  eventDetail: { 
    fontSize: 14, 
    marginTop: 4, 
    color: "#374151" 
  },
  eventTime: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2
  },

  // Reports
  reportCard: {
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    elevation: 1
  },
  reportContent: {
    paddingVertical: 12
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  reportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
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
    color: '#6b7280'
  },
  statusBadge: {
    alignSelf: 'flex-start'
  },
  reportDate: {
    fontSize: 12,
    color: '#9ca3af'
  },

  // Forums
  forumCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1
  },
  forumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  forumIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  forumInfo: {
    flex: 1
  },
  forumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2
  },
  forumCategory: {
    fontSize: 12,
    color: '#6b7280'
  },
  forumStats: {
    flexDirection: 'row',
    marginBottom: 8
  },
  forumStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16
  },
  forumStatText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4
  },
  lastActive: {
    fontSize: 11,
    color: '#9ca3af',
    fontStyle: 'italic'
  },

  // Empty States
  emptyCard: {
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    elevation: 1
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4
  },
  emptySubtext: {
    fontSize: 12,
    color: '#9ca3af'
  },

  bottomSpacing: {
    height: 20
  }
});