import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCameraPermissions } from "expo-camera";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import api from "../../services/api";

export default function Attendance() {
  const { eventId } = useLocalSearchParams();
  const router = useRouter();

  const [permission, requestPermission] = useCameraPermissions();
  const [event, setEvent] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);

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
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchData();
      const interval = setInterval(fetchData, 5000); // auto-refresh
      return () => clearInterval(interval);
    }
  }, [eventId]);

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
    <View style={styles.container}>
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
      <View style={{ marginVertical: 20 }}>
        <Pressable
          style={[styles.scanButton, !isPermissionGranted && styles.disabled]}
          onPress={
            isPermissionGranted
              ? () => router.push(`/staff/scanner?eventId=${eventId}`)
              : requestPermission
          }
        >
          <Ionicons
            name="camera"
            size={20}
            color="#fff"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.scanButtonText}>
            {isPermissionGranted ? "Scan QR Code" : "Grant Camera Permission"}
          </Text>
        </Pressable>
      </View>

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
          // ✅ Use member_profile for attendee
          const fullName = item.user?.member_profile
            ? `${item.user.member_profile.first_name || ""} ${item.user.member_profile.middle_name || ""} ${item.user.member_profile.last_name || ""}`.trim()
            : item.user?.name || "—";

          // ✅ Use staff_profile for scanned_by
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 16 },
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
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 10,
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
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  name: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  details: { fontSize: 14, color: "#6b7280", marginTop: 2 },
});
