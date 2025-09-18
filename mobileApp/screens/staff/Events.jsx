import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { Text, Card, Avatar } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "@/services/api";
export default function Events() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ ensures fetch runs only once
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchEvents = async () => {
      try {
        const token = await AsyncStorage.getItem("token");

        if (!token) {
          setLoading(false);
          router.replace("/login");
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
          if (router.pathname !== "/login") {
            router.replace("/login");
          }
        } else {
          setError("Failed to load events.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [router]);

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
        router.push({
          pathname: "/staff/Attendance", // ✅ absolute path
          params: { eventId: item.id, eventTitle: item.title },
        })
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
