import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useCameraPermissions } from "expo-camera";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import api from "@/services/api";
import { LinearGradient } from "expo-linear-gradient";

export default function MemberAttendance() {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId, eventTitle } = route.params || {};

  const [permission, requestPermission] = useCameraPermissions();
  const [event, setEvent] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [canScan, setCanScan] = useState(true);
  const [stats, setStats] = useState({
    totalAttendees: 0,
    maleCount: 0,
    femaleCount: 0,
    recentAttendees: 0
  });

  const isPermissionGranted = Boolean(permission?.granted);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      
      // Event details
      const eventRes = await api.get(`/events/${eventId}`);
      setEvent(eventRes.data);

      // Attendance list
      const attRes = await api.get(`/events/${eventId}/attendances`);
      const data = attRes.data.data || attRes.data;
      setAttendances(data);

      // Calculate statistics
      calculateStats(data);
      
      // Check scan validity
      checkScanValidity(eventRes.data.event_date);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load attendance data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (attendanceData) => {
    const totalAttendees = attendanceData.length;
    const maleCount = attendanceData.filter(item => 
      item.user?.member_profile?.sex?.toLowerCase() === 'male'
    ).length;
    const femaleCount = attendanceData.filter(item => 
      item.user?.member_profile?.sex?.toLowerCase() === 'female'
    ).length;
    
    // Count attendees from last 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const recentAttendees = attendanceData.filter(item => 
      item.scanned_at && new Date(item.scanned_at) > twoHoursAgo
    ).length;

    setStats({
      totalAttendees,
      maleCount,
      femaleCount,
      recentAttendees
    });
  };

  const checkScanValidity = (eventDate) => {
    const currentDate = new Date();
    const eventDateObj = new Date(eventDate);

    const dayBeforeEvent = new Date(eventDateObj);
    dayBeforeEvent.setDate(eventDateObj.getDate() - 1);

    const dayAfterEvent = new Date(eventDateObj);
    dayAfterEvent.setDate(eventDateObj.getDate() + 1);

    setCanScan(currentDate >= dayBeforeEvent && currentDate <= dayAfterEvent);
  };

  const handleScanPress = async () => {
    if (!isPermissionGranted) {
      await requestPermission();
      return;
    }
    
    if (canScan) {
      navigation.navigate("QRScanner", { 
        eventId: eventId,
        eventTitle: eventTitle || event?.title 
      });
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const renderStatsCard = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}>
          <Ionicons name="people" size={24} color="#2563eb" />
        </View>
        <Text style={styles.statNumber}>{stats.totalAttendees}</Text>
        <Text style={styles.statLabel}>Total Attendees</Text>
      </View>
      
      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
          <Ionicons name="time" size={24} color="#22c55e" />
        </View>
        <Text style={styles.statNumber}>{stats.recentAttendees}</Text>
        <Text style={styles.statLabel}>Recent (2h)</Text>
      </View>
      
      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
          <Ionicons name="male" size={24} color="#3b82f6" />
        </View>
        <Text style={styles.statNumber}>{stats.maleCount}</Text>
        <Text style={styles.statLabel}>Male</Text>
      </View>
      
      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: 'rgba(236, 72, 153, 0.1)' }]}>
          <Ionicons name="female" size={24} color="#ec4899" />
        </View>
        <Text style={styles.statNumber}>{stats.femaleCount}</Text>
        <Text style={styles.statLabel}>Female</Text>
      </View>
    </View>
  );

  const renderAttendanceItem = ({ item, index }) => {
    const fullName = item.user?.member_profile
      ? `${item.user.member_profile.first_name || ""} ${item.user.member_profile.middle_name || ""} ${item.user.member_profile.last_name || ""}`.trim()
      : item.user?.name || "—";

    const scannedBy = item.scanned_by?.staff_profile
      ? `${item.scanned_by.staff_profile.first_name || ""} ${item.scanned_by.staff_profile.middle_name || ""} ${item.scanned_by.staff_profile.last_name || ""}`.trim()
      : item.scanned_by?.name || "—";

    const barangay = item.user?.member_profile?.barangay || "—";
    const sex = item.user?.member_profile?.sex || "—";

    return (
      <View style={[
        styles.attendanceItem,
        index === 0 && styles.firstItem
      ]}>
        <View style={styles.avatarContainer}>
          <View style={[
            styles.avatar,
            { backgroundColor: sex.toLowerCase() === 'male' ? '#3b82f6' : '#ec4899' }
          ]}>
            <Text style={styles.avatarText}>
              {fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </Text>
          </View>
          {index < 3 && (
            <View style={styles.rankBadge}>
              <Ionicons name="trophy" size={12} color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.attendeeInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.attendeeName} numberOfLines={1}>
              {fullName}
            </Text>
            <Text style={styles.timeAgo}>
              {item.scanned_at ? getTimeAgo(item.scanned_at) : ""}
            </Text>
          </View>
          
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="location" size={14} color="#6b7280" />
              <Text style={styles.detailText}>{barangay}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name={sex.toLowerCase() === 'male' ? 'male' : 'female'} size={14} color="#6b7280" />
              <Text style={styles.detailText}>{sex}</Text>
            </View>
          </View>

          <View style={styles.scanInfo}>
            <Ionicons name="person" size={12} color="#9ca3af" />
            <Text style={styles.scanInfoText}>
              Scanned by {scannedBy}
            </Text>
            <Text style={styles.scanTime}>
              {item.scanned_at ? new Date(item.scanned_at).toLocaleTimeString() : "—"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading Attendance...</Text>
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
          <Text style={styles.headerTitle}>Attendance</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Event Card */}
        {event && (
          <View style={styles.eventCard}>
            <View style={styles.eventHeader}>
              <View style={styles.eventIcon}>
                <Ionicons name="calendar" size={28} color="#2563eb" />
              </View>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <View style={styles.eventDetails}>
                  <View style={styles.eventDetail}>
                    <MaterialCommunityIcons name="calendar-clock" size={16} color="#6b7280" />
                    <Text style={styles.eventDetailText}>
                      {new Date(event.event_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                  <View style={styles.eventDetail}>
                    <Ionicons name="time" size={16} color="#6b7280" />
                    <Text style={styles.eventDetailText}>
                      {new Date(event.event_date).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                  <View style={styles.eventDetail}>
                    <Ionicons name="location" size={16} color="#6b7280" />
                    <Text style={styles.eventDetailText}>{event.location}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Scan Button */}
        <TouchableOpacity 
          style={[
            styles.scanButton,
            !canScan && styles.scanButtonDisabled
          ]}
          onPress={handleScanPress}
          disabled={!canScan}
        >
          <LinearGradient
            colors={canScan ? ["#2563eb", "#1d4ed8"] : ["#9ca3af", "#6b7280"]}
            style={styles.scanButtonGradient}
          >
            <Ionicons name="qr-code" size={24} color="#fff" />
            <Text style={styles.scanButtonText}>
              {!isPermissionGranted ? "Grant Camera Permission" : 
               canScan ? "Scan QR Code" : "Scanning Not Available"}
            </Text>
            {canScan && (
              <View style={styles.scanBadge}>
                <Ionicons name="scan" size={16} color="#fff" />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Statistics */}
        {renderStatsCard()}

        {/* Attendance List */}
        <View style={styles.attendanceSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Attendees ({attendances.length})
            </Text>
            <Text style={styles.sectionSubtitle}>
              {stats.recentAttendees} checked in recently
            </Text>
          </View>

          {attendances.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No Attendees Yet</Text>
              <Text style={styles.emptyText}>
                Attendees will appear here once they scan the QR code
              </Text>
            </View>
          ) : (
            <FlatList
              data={attendances}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderAttendanceItem}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

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
    alignItems: 'flex-start'
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
    marginBottom: 12
  },
  eventDetails: {
    gap: 8
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  eventDetailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8
  },

  // Scan Button
  scanButton: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden'
  },
  scanButtonDisabled: {
    opacity: 0.7
  },
  scanButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12
  },
  scanBadge: {
    position: 'absolute',
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 4
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center'
  },

  // Attendance Section
  attendanceSection: {
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

  // Attendance Items
  attendanceItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8
  },
  firstItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b'
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14
  },
  rankBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#f59e0b',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  attendeeInfo: {
    flex: 1
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1
  },
  timeAgo: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500'
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 12
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  detailText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4
  },
  scanInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  scanInfoText: {
    fontSize: 11,
    color: '#9ca3af',
    marginLeft: 4,
    marginRight: 8
  },
  scanTime: {
    fontSize: 11,
    color: '#9ca3af',
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