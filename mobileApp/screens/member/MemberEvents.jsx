import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator, Text } from "react-native";
import { Card, Avatar } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import api from "@/services/api";
import { LinearGradient } from "expo-linear-gradient"; // Import Expo's LinearGradient

export default function MemberEvents() {
  const navigation = useNavigation(); // Use useNavigation here
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null); // Store current user's ID
  const [attendanceStatus, setAttendanceStatus] = useState({}); // Store attendance status for each event

  // ✅ ensures fetch runs only once
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    // Function to fetch events
    const fetchEvents = async () => {
      try {
        const token = await AsyncStorage.getItem("token");

        if (!token) {
          setLoading(false);
          navigation.replace("Login"); // Navigate to login if token is not found
          return;
        }

        const res = await api.get("/events", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setEvents(res.data.data || res.data || []);

        // Get the current user's ID
        const userRes = await api.get("/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUserId(userRes.data.id);

        // Check attendance status for each event after getting the current user's ID
        const attendanceStatuses = {};
        for (const event of res.data.data) {
          const attendanceRes = await api.get(`/events/${event.id}/${userRes.data.id}`);
          attendanceStatuses[event.id] = attendanceRes.data.attended ? "Present" : "Absent";
        }
        setAttendanceStatus(attendanceStatuses);

      } catch (err) {
        console.error("Events fetch error:", err.response?.data || err.message);

        if (err.response?.status === 401) {
          await AsyncStorage.removeItem("token");
          navigation.replace("Login"); // Navigate to login if session is expired
        } else {
          setError("Failed to load events.");
        }
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchEvents();

    // Set up an interval to refresh events every 10 seconds (or 20 seconds)
    const intervalId = setInterval(() => {
      fetchEvents();
    }, 10000); // 10000ms = 10 seconds (use 20000 for 20 seconds)

    // Clear the interval on component unmount
    return () => clearInterval(intervalId);

  }, [navigation]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 10, color: "#2563eb" }}>Loading Events...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={{ color: "red" }}>{error}</Text>
      </SafeAreaView>
    );
  }

  const renderEvent = ({ item }) => {
    const isPresent = attendanceStatus[item.id] === "Present";
    return (
      <Card
        style={styles.card}
        onPress={() =>
          navigation.navigate("MemberAttendance", { eventId: item.id, eventTitle: item.title }) // Navigate to event details using navigate()
        }
      >
        <Card.Title
          title={item.title}
          titleStyle={styles.cardTitle}
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
          <Text style={styles.detail}>
            📅 {new Date(item.event_date).toLocaleDateString()}
          </Text>
          <Text style={styles.detail}>
            {isPresent ? "✅ Present" : "❌ Absent"}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  return (
    <LinearGradient
      colors={["#6ee7b7", "#2563eb"]} // Gradient colors
      style={styles.container} // Apply gradient to the container
    >
      <SafeAreaView style={styles.contentContainer}>
        {events.length === 0 ? (
          <Text style={styles.empty}>No events available</Text>
        ) : (
          <FlatList
            data={events}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderEvent}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" }, // Added gradient container
  contentContainer: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { textAlign: "center", fontSize: 16, color: "#6b7280", marginTop: 20 },

  card: {
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
    elevation: 3,
  },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  detail: { fontSize: 14, marginTop: 4, color: "#374151" },
});
