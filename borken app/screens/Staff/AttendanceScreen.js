import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Button,
  Modal,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../api/api";

export default function AttendanceScreen({ route, navigation }) {
  const { eventId, eventTitle } = route.params;
  const [attendees, setAttendees] = useState([]);
  const [filteredAttendees, setFilteredAttendees] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filters
  const [search, setSearch] = useState("");
  const [barangayFilter, setBarangayFilter] = useState("");
  const [scannedByFilter, setScannedByFilter] = useState("");

  // QR Scanner
  const [hasPermission, setHasPermission] = useState(null);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanned, setScanned] = useState(false);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const eventRes = await api.get(`/events/${eventId}`, { headers });
      setEvent(eventRes.data);

      const attRes = await api.get(`/attendances?event_id=${eventId}`, {
        headers,
      });
      const data = attRes.data.data || attRes.data || [];
      setAttendees(data);
      setFilteredAttendees(data);
    } catch (err) {
      console.error("Attendance fetch error:", err.response?.data || err.message);
      setError("Failed to load event or attendances.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    navigation.setOptions({ title: eventTitle || "Attendances" });

    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // apply filters
  useEffect(() => {
    let data = [...attendees];

    if (search) {
      data = data.filter((a) => {
        const fullName = a.user
          ? `${a.user.first_name || ""} ${a.user.last_name || ""}`.toLowerCase()
          : "";
        return fullName.includes(search.toLowerCase());
      });
    }

    if (barangayFilter) {
      data = data.filter((a) => a.user?.barangay === barangayFilter);
    }

    if (scannedByFilter) {
      data = data.filter(
        (a) => a.scanned_by_user?.id?.toString() === scannedByFilter
      );
    }

    setFilteredAttendees(data);
  }, [search, barangayFilter, scannedByFilter, attendees]);

  // ask camera permission once
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === "granted");
      } catch (err) {
        console.error("Camera permission error:", err);
        setHasPermission(false);
      }
    })();
  }, []);

  // parse QR content to extract a user_id
  const parseUserIdFromQR = (raw) => {
    if (!raw || typeof raw !== "string") return null;
    raw = raw.trim();

    try {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.user_id || parsed.id)) {
        return Number(parsed.user_id || parsed.id);
      }
    } catch {}

    try {
      const url = new URL(raw);
      const uid = url.searchParams.get("user_id") || url.searchParams.get("id");
      if (uid) return Number(uid);
      const pathMatch = url.pathname.match(/\/(\d+)(?:\/)?$/);
      if (pathMatch) return Number(pathMatch[1]);
    } catch {}

    const digitsMatch = raw.match(/(\d+)/);
    if (digitsMatch) return Number(digitsMatch[1]);

    return null;
  };

  // handle QR scanned
  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) return;
    setScanned(true);
    setScannerVisible(false);

    const parsedUserId = parseUserIdFromQR(data);
    if (!parsedUserId || Number.isNaN(parsedUserId)) {
      Alert.alert("Invalid QR", "Could not extract user id from scanned QR.");
      setTimeout(() => setScanned(false), 1000);
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await api.post(
        "/attendances",
        { event_id: eventId, user_id: parsedUserId },
        { headers }
      );

      await fetchData();

      Alert.alert("Success", `Attendance recorded for user ${parsedUserId}`);
    } catch (err) {
      console.error("QR Scan API error:", err.response?.data || err.message);
      const msg = err.response?.data?.message || "Failed to record attendance.";
      Alert.alert("Error", msg);
    } finally {
      setTimeout(() => setScanned(false), 1200);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text>Loading Attendance...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );
  }

  const barangays = [
    ...new Set(attendees.map((a) => a.user?.barangay).filter(Boolean)),
  ];
  const scannedByUsers = [
    ...new Set(attendees.map((a) => a.scanned_by_user?.id).filter(Boolean)),
  ];

  return (
    <View style={styles.container}>
      {/* Event Details */}
      {event && (
        <View style={styles.eventCard}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventInfo}>
            {new Date(event.event_date).toLocaleDateString()} •{" "}
            {event.event_time
              ? new Date(`1970-01-01T${event.event_time}`).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })
              : "—"}
          </Text>
          <Text style={styles.eventInfo}>
            📍 {event.location} |{" "}
            <Text
              style={{
                fontWeight: "bold",
                color:
                  event.status === "upcoming"
                    ? "green"
                    : event.status === "completed"
                    ? "gray"
                    : "red",
              }}
            >
              {event.status}
            </Text>
          </Text>
        </View>
      )}

      {/* QR Code Scanner Button */}
      <Button
        title="📷 Scan QR Code"
        onPress={() => {
          if (hasPermission === false) {
            Alert.alert(
              "Camera permission required",
              "Please grant camera permission in your device settings."
            );
            return;
          }
          setScannerVisible(true);
        }}
      />

      <Modal visible={scannerVisible} animationType="slide">
        <View style={{ flex: 1 }}>
          {hasPermission === null ? (
            <View style={styles.center}>
              <Text>Requesting camera permission...</Text>
            </View>
          ) : hasPermission === false ? (
            <View style={styles.center}>
              <Text style={{ color: "red" }}>
                No access to camera. Please enable camera permission.
              </Text>
              <Button title="Close Scanner" onPress={() => setScannerVisible(false)} />
            </View>
          ) : (
            <>
              <Camera
                style={{ flex: 1 }}
                type={CameraType.back}   // ✅ Correct for v16+
                onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                barCodeScannerSettings={{
                  barCodeTypes: ["qr"],  // ✅ Only QR codes
                }}
              />

              <View style={{ padding: 12 }}>
                <Button title="Close Scanner" onPress={() => setScannerVisible(false)} />
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* Search + Filters */}
      <TextInput
        style={styles.input}
        placeholder="Search attendee..."
        value={search}
        onChangeText={setSearch}
      />

      <Text style={styles.filterLabel}>Filter by Barangay</Text>
      <Picker
        selectedValue={barangayFilter}
        onValueChange={(v) => setBarangayFilter(v)}
      >
        <Picker.Item label="All" value="" />
        {barangays.map((b) => (
          <Picker.Item key={b} label={b} value={b} />
        ))}
      </Picker>

      <Text style={styles.filterLabel}>Filter by Scanned By</Text>
      <Picker
        selectedValue={scannedByFilter}
        onValueChange={(v) => setScannedByFilter(v)}
      >
        <Picker.Item label="All" value="" />
        {scannedByUsers.map((id) => {
          const user = attendees.find((a) => a.scanned_by_user?.id === id)
            ?.scanned_by_user;
          return (
            <Picker.Item
              key={id}
              label={
                user
                  ? `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                    user.name
                  : "Unknown"
              }
              value={id.toString()}
            />
          );
        })}
      </Picker>

      {/* Attendee List */}
      {filteredAttendees.length === 0 ? (
        <Text style={styles.empty}>No attendees found.</Text>
      ) : (
        <FlatList
          data={filteredAttendees}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchData} />
          }
          renderItem={({ item }) => {
            const fullName = item.user
              ? `${item.user.first_name || ""} ${item.user.last_name || ""}`.trim()
              : "—";
            const scannedByName = item.scanned_by_user
              ? `${item.scanned_by_user.first_name || ""} ${item.scanned_by_user.last_name || ""}`.trim()
              : "—";

            return (
              <View style={styles.card}>
                <Text style={styles.name}>{fullName}</Text>
                <Text style={styles.info}>
                  Barangay: {item.user?.barangay || "—"}
                </Text>
                <Text style={styles.info}>
                  Scanned At:{" "}
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
                <Text style={styles.info}>Scanned By: {scannedByName}</Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f9fafb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { textAlign: "center", fontSize: 16, color: "#6b7280", marginTop: 20 },
  eventCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
  },
  eventTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  eventInfo: { fontSize: 14, color: "#6b7280" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  filterLabel: { fontSize: 14, fontWeight: "bold", marginTop: 8 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  name: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  info: { fontSize: 14, color: "#6b7280" },
});
