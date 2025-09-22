import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useCameraPermissions } from "expo-camera";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import api from "@/services/api";
import { LinearGradient } from "expo-linear-gradient"; // Import Expo's LinearGradient

export default function MemberAttendance() {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId } = route.params || {}; // ✅ coming from navigation params

  const [permission, requestPermission] = useCameraPermissions();
  const [event, setEvent] = useState(null);
  const [attendances, setAttendances] = useState([]); // Store attendances here
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [monthlyMemberCount, setMonthlyMemberCount] = useState([]);
  const [canScan, setCanScan] = useState(true); // Flag to control scan button

  const isPermissionGranted = Boolean(permission?.granted);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ✅ Event details
        const eventRes = await api.get(`/events/${eventId}`);
        setEvent(eventRes.data);

        // ✅ Attendance list (with relationships)
        const attRes = await api.get(`/events/${eventId}/attendances`);
        const data = attRes.data.data || attRes.data;
        setAttendances(data);

        // Check if the event date is valid for scanning
        checkScanValidity(eventRes.data.event_date);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchData();
    }
  }, [eventId]);

  // Check if the event date is valid for scanning (within the day before or the event day)
  const checkScanValidity = (eventDate) => {
    const currentDate = new Date();
    const eventDateObj = new Date(eventDate);

    // Check if current date is within the day before and day of the event
    const dayBeforeEvent = new Date(eventDateObj);
    dayBeforeEvent.setDate(eventDateObj.getDate() - 1);

    const dayAfterEvent = new Date(eventDateObj);
    dayAfterEvent.setDate(eventDateObj.getDate() + 1);

    // Enable scan if the current date is within the valid range
    if (currentDate >= dayBeforeEvent && currentDate <= dayAfterEvent) {
      setCanScan(true);
    } else {
      setCanScan(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 8, color: "#2563eb", fontWeight: "600" }}>
          Loading Attendance...
        </Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#6ee7b7", "#2563eb"]} // Gradient colors
      style={styles.container} // Apply gradient to the container
    >
      <View style={styles.contentContainer}>
        {/* Header */}
        {event && (
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <Ionicons name="people" size={32} color="#2563eb" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.title}>{event.title}</Text>
                <Text style={styles.subtitle}>
                  <MaterialCommunityIcons
                    name="calendar-check"
                    size={16}
                    color="#2563eb"
                  />{" "}
                  {new Date(event.event_date).toLocaleDateString()} ·{" "}
                  {event.location}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* QR Scan Button */}
      

        {/* Attendance List */}
        <FlatList
          data={attendances}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
            <Text
              style={{ textAlign: "center", marginTop: 20, color: "#6b7280" }}
            >
              No attendees yet.
            </Text>
          }
          renderItem={({ item }) => {
            const fullName = item.user?.member_profile
              ? `${item.user.member_profile.first_name || ""} ${item.user.member_profile.middle_name || ""} ${item.user.member_profile.last_name || ""}`.trim()
              : item.user?.name || "—";

            const scannedBy = item.scanned_by?.staff_profile
              ? `${item.scanned_by.staff_profile.first_name || ""} ${item.scanned_by.staff_profile.middle_name || ""} ${item.scanned_by.staff_profile.last_name || ""}`.trim()
              : item.scanned_by?.name || "—";

            return (
              <View style={styles.listItem}>
                <Text style={styles.name}>{fullName}</Text>
                <Text style={styles.details}>
                  <Ionicons name="location" size={14} color="#6b7280" /> Barangay:{" "}
                  {item.user?.member_profile?.barangay || "—"}
                </Text>
                <Text style={styles.details}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={14}
                    color="#6b7280"
                  />{" "}
                  Scanned:{" "}
                  {item.scanned_at
                    ? new Date(item.scanned_at).toLocaleString([], {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })
                    : "—"}
                </Text>
                <Text style={styles.details}>
                  <Ionicons name="person" size={14} color="#6b7280" /> Scanned By:{" "}
                  {scannedBy}
                </Text>
              </View>
            );
          }}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" }, // Gradient container style
  contentContainer: { flex: 1, padding: 16 },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  headerRow: { flexDirection: "row", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "bold", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6b7280", marginTop: 2 },
  scanButton: {
    flexDirection: "row",
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  disabled: { backgroundColor: "#9ca3af" },
  scanButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  listItem: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  name: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  details: { fontSize: 14, color: "#6b7280", marginTop: 2 },
});
