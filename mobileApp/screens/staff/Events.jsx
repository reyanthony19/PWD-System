import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { Text, Card, Avatar } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import api from "@/services/api";

export default function Events() {
  const navigation = useNavigation(); // Use useNavigation here
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        <Text style={{ marginTop: 10, color: "#2563eb" }}>
          Loading Events...
        </Text>
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

  const renderEvent = ({ item }) => (
    <Card
      style={styles.card}
      onPress={() =>
        navigation.navigate("Attendance", { eventId: item.id, eventTitle: item.title }) // Navigate to event details using navigate()
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
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6", padding: 16 },
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
