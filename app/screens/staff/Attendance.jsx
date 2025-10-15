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
  Alert
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useCameraPermissions } from "expo-camera";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Badge } from "react-native-paper";
import api from "@/services/api";
import { LinearGradient } from "expo-linear-gradient";

export default function Attendance() {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId } = route.params || {};

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
      setError("");

      // Event details
      const eventRes = await api.get(`/events/${eventId}`);
      setEvent(eventRes.data);

      // Attendance list
      const attRes = await api.get(`/events/${eventId}/attendances`);
      const data = attRes.data.data || attRes.data;
      setAttendances(data);

      // Calculate statistics
      calculateStats(data);

      // Check if the event date is valid for scanning
      checkScanValidity(eventRes.data.event_date, eventRes.data.event_time);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const calculateStats = (attendanceData) => {
    const totalAttendees = attendanceData.length;

    const maleCount = attendanceData.filter(item =>
      item.user?.member_profile?.gender === 'male'
    ).length;

    const femaleCount = attendanceData.filter(item =>
      item.user?.member_profile?.gender === 'female'
    ).length;

    // Count attendees from last 2 hours
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
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

  // Format event time for display
  const formatEventTime = (timeString) => {
    if (!timeString) return 'Time not set';
    
    try {
      // Handle different time formats
      const timeParts = timeString.split(':');
      const hours = parseInt(timeParts[0]);
      const minutes = timeParts[1];
      
      // Format as 12-hour time with AM/PM
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      
      return `${displayHours}:${minutes} ${period}`;
    } catch (error) {
      console.error('Error formatting event time:', error);
      return timeString;
    }
  };

  // Combine date and time for proper validation
  const combineEventDateTime = (eventDate, eventTime) => {
    if (!eventDate) return null;
    
    try {
      let dateTimeString = eventDate;
      
      // If event_time exists, combine with event_date
      if (eventTime) {
        // Handle different time formats
        const timePart = eventTime.includes(':') 
          ? eventTime.split(':').slice(0, 2).join(':') // Take only HH:mm
          : '00:00';
        
        dateTimeString = `${eventDate}T${timePart}:00`;
      } else {
        // If no time, set to end of day for proper date comparison
        dateTimeString = `${eventDate}T23:59:59`;
      }
      
      const combinedDate = new Date(dateTimeString);
      return isNaN(combinedDate.getTime()) ? null : combinedDate;
    } catch (error) {
      console.error('Error combining event datetime:', error);
      return null;
    }
  };

  const checkScanValidity = (eventDate, eventTime) => {
    const currentDate = new Date();
    const eventDateTime = combineEventDateTime(eventDate, eventTime);

    if (!eventDateTime) {
      setCanScan(false);
      return;
    }

    const dayBeforeEvent = new Date(eventDateTime);
    dayBeforeEvent.setDate(eventDateTime.getDate() - 1);

    const dayAfterEvent = new Date(eventDateTime);
    dayAfterEvent.setDate(eventDateTime.getDate() + 1);

    if (currentDate >= dayBeforeEvent && currentDate <= dayAfterEvent) {
      setCanScan(true);
    } else {
      setCanScan(false);
    }
  };

  const handleScanPress = () => {
    if (!isPermissionGranted) {
      requestPermission();
      return;
    }

    if (!canScan) {
      Alert.alert(
        "Scanning Not Available",
        "QR Scanning only available on the event day.",
        [{ text: "OK" }]
      );
      return;
    }

    navigation.navigate("Scanner", { eventId });
  };

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: '#3b82f620' }]}>
          <Ionicons name="people" size={20} color="#3b82f6" />
        </View>
        <Text style={styles.statNumber}>{stats.totalAttendees}</Text>
        <Text style={styles.statLabel}>Total</Text>
      </View>

      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: '#10b98120' }]}>
          <Ionicons name="male" size={20} color="#10b981" />
        </View>
        <Text style={styles.statNumber}>{stats.maleCount}</Text>
        <Text style={styles.statLabel}>Male</Text>
      </View>

      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: '#ec489920' }]}>
          <Ionicons name="female" size={20} color="#ec4899" />
        </View>
        <Text style={styles.statNumber}>{stats.femaleCount}</Text>
        <Text style={styles.statLabel}>Female</Text>
      </View>

      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: '#f59e0b20' }]}>
          <MaterialCommunityIcons name="clock" size={20} color="#f59e0b" />
        </View>
        <Text style={styles.statNumber}>{stats.recentAttendees}</Text>
        <Text style={styles.statLabel}>Recent</Text>
      </View>
    </View>
  );

  const renderAttendanceItem = ({ item }) => {
    const fullName = item.user?.member_profile
      ? `${item.user.member_profile.first_name || ""} ${item.user.member_profile.middle_name || ""} ${item.user.member_profile.last_name || ""}`.trim()
      : item.user?.name || "—";

    const scannedBy = item.scanned_by?.staff_profile
      ? `${item.scanned_by.staff_profile.first_name || ""} ${item.scanned_by.staff_profile.middle_name || ""} ${item.scanned_by.staff_profile.last_name || ""}`.trim()
      : item.scanned_by?.name || "—";

    const gender = item.user?.member_profile?.gender;
    const barangay = item.user?.member_profile?.barangay || "—";

    return (
      <Card style={styles.attendanceCard}>
        <Card.Content>
          <View style={styles.attendanceHeader}>
            <View style={styles.nameContainer}>
              <Text style={styles.name}>{fullName}</Text>
              {gender && (
                <Badge
                  style={[
                    styles.genderBadge,
                    gender === 'male' ? styles.maleBadge : styles.femaleBadge
                  ]}
                >
                  {gender === 'male' ? 'M' : 'F'}
                </Badge>
              )}
            </View>
            <Text style={styles.time}>
              {item.scanned_at
                ? new Date(item.scanned_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })
                : "—"}
            </Text>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Ionicons name="location" size={14} color="#6b7280" />
              <Text style={styles.detailText}>{barangay}</Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="account" size={14} color="#6b7280" />
              <Text style={styles.detailText}>Scanned by: {scannedBy}</Text>
            </View>

            {item.scanned_at && (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="clock-outline" size={14} color="#6b7280" />
                <Text style={styles.detailText}>
                  {new Date(item.scanned_at).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
        <SafeAreaView style={styles.center}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading Attendance...</Text>
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
              onRefresh={onRefresh}
              colors={["#fff"]}
              tintColor="#fff"
            />
          }
        >
          {/* Header Section */}
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </Pressable>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Attendance</Text>
              <Text style={styles.headerSubtitle}>Event Participants</Text>
            </View>
          </View>

          {/* Event Card */}
          {event && (
            <Card style={styles.eventCard}>
              <Card.Content>
                <View style={styles.eventHeader}>
                  <View style={styles.eventIcon}>
                    <Ionicons name="calendar" size={24} color="#2563eb" />
                  </View>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <View style={styles.eventDetails}>
                      <View style={styles.eventDetail}>
                        <MaterialCommunityIcons name="calendar" size={14} color="#6b7280" />
                        <Text style={styles.eventDetailText}>
                          {new Date(event.event_date).toLocaleDateString()}
                        </Text>
                      </View>
                      {/* Display Event Time */}
                      {event.event_time && (
                        <View style={styles.eventDetail}>
                          <MaterialCommunityIcons name="clock-outline" size={14} color="#6b7280" />
                          <Text style={styles.eventDetailText}>
                            {formatEventTime(event.event_time)}
                          </Text>
                        </View>
                      )}
                      <View style={styles.eventDetail}>
                        <Ionicons name="location" size={14} color="#6b7280" />
                        <Text style={styles.eventDetailText}>{event.location}</Text>
                      </View>
                      {event.target_barangay && (
                        <View style={styles.eventDetail}>
                          <Ionicons name="map" size={14} color="#6b7280" />
                          <Text style={styles.eventDetailText}>
                            {event.target_barangay === "All" ? "All Barangays" : event.target_barangay}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Scan Button */}
          <Pressable
            style={[
              styles.scanButton,
              (!isPermissionGranted || !canScan) && styles.scanButtonDisabled
            ]}
            onPress={handleScanPress}
          >
            <View style={styles.scanButtonContent}>
              <View style={styles.scanIcon}>
                <Ionicons
                  name={isPermissionGranted ? "camera" : "camera-outline"}
                  size={24}
                  color="#fff"
                />
              </View>
              <View style={styles.scanTextContainer}>
                <Text style={styles.scanButtonText}>
                  {isPermissionGranted ? "Scan QR Code" : "Grant Camera Access"}
                </Text>
                <Text style={styles.scanButtonSubtext}>
                  {canScan ? "Tap to scan attendance" : "Scanning period has ended"}
                </Text>
                {event?.event_time && canScan && (
                  <Text style={styles.eventTimeNote}>
                    Event at {formatEventTime(event.event_time)}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </View>
          </Pressable>

          {/* Statistics */}
          {renderStats()}

          {/* Attendance List */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Attendees ({attendances.length})
              </Text>
              {attendances.length > 0 && (
                <Text style={styles.sectionSubtitle}>
                  Updated just now
                </Text>
              )}
            </View>

            {attendances.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Card.Content style={styles.emptyContent}>
                  <Ionicons name="people-outline" size={48} color="#9ca3af" />
                  <Text style={styles.emptyTitle}>No Attendees Yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Scan QR codes to add attendees to this event
                  </Text>
                </Card.Content>
              </Card>
            ) : (
              <FlatList
                data={attendances}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderAttendanceItem}
                scrollEnabled={false}
                style={styles.attendanceList}
              />
            )}
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
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
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

  // Event Card
  eventCard: {
    borderRadius: 16,
    marginBottom: 20,
    elevation: 4,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3b82f620',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  eventDetails: {
    gap: 6,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventDetailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },

  // Scan Button
  scanButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  scanTextContainer: {
    flex: 1,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  scanButtonSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  eventTimeNote: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },

  // Statistics
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // Attendance List
  attendanceList: {
    gap: 12,
  },
  attendanceCard: {
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginRight: 8,
  },
  genderBadge: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  maleBadge: {
    backgroundColor: '#3b82f6',
  },
  femaleBadge: {
    backgroundColor: '#ec4899',
  },
  time: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailsContainer: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },

  // Empty State
  emptyCard: {
    borderRadius: 16,
    elevation: 2,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },

  bottomSpacing: {
    height: 20,
  },
});