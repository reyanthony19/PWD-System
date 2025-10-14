import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Alert, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "@/services/api";
import { LinearGradient } from "expo-linear-gradient";

export default function StaffHome({ navigation }) {
  const [user, setUser] = useState({});
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    loadUser();
    fetchMembersData();
    fetchEvents();

    const intervalId = setInterval(() => {
      fetchMembersData();
      fetchEvents();
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      const userRes = await api.get("/user", { headers: { Authorization: `Bearer ${token}` } });
      setUser(userRes.data);
    } catch (err) {
      console.error("Error fetching user:", err);
      Alert.alert("Error", "Failed to load user data");
    }
  };

  const fetchMembersData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const usersRes = await api.get("/users", { headers: { Authorization: `Bearer ${token}` } });
      const approvedMembers = (usersRes.data || []).filter(
        (u) => u.status === "approved" && u.role === "member"
      );
      setMembers(approvedMembers);
    } catch (err) {
      setError("Failed to load data.");
      Alert.alert("Error", "Failed to load members data");
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const eventsRes = await api.get("/events", { headers: { Authorization: `Bearer ${token}` } });
      const eventsData = Array.isArray(eventsRes.data?.data) ? eventsRes.data.data : [];

      const usersRes = await api.get("/users", { headers: { Authorization: `Bearer ${token}` } });
      const users = usersRes.data || [];

      const userMap = users.reduce((acc, u) => {
        acc[u.id] = u.username;
        return acc;
      }, {});

      const updatedEvents = eventsData.map((e) => ({
        ...e,
        username: userMap[e.user_id] || "Unknown",
      }));

      const now = new Date();
      setEvents(updatedEvents.filter((e) => new Date(e.event_date) > now));
      setPastEvents(updatedEvents.filter((e) => new Date(e.event_date) <= now));

      checkUpcomingEvents(updatedEvents);
    } catch (err) {
      console.error("Error fetching events:", err);
      Alert.alert("Error", "Failed to load events");
    }
  };

  const checkUpcomingEvents = (list) => {
    const now = new Date();
    list.forEach((event) => {
      const eventDate = new Date(event.event_date);
      const diffDays = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
      if (diffDays === 3) {
        Alert.alert("Upcoming Event", `The event "${event.title}" is in 3 days!`);
      }
    });
  };

  if (loading) {
    return (
      <LinearGradient colors={["#6ee7b7", "#2563eb"]} style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={["#6ee7b7", "#2563eb"]} style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#6ee7b7", "#2563eb"]} style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>

          <Text style={styles.headerTitle}>Welcome, {user.username || "Staff"}</Text>
        </View>

        {/* Stats Cards */}
       
        <View style={styles.statsContainer}>

          <View style={styles.card}>

            <Text style={styles.cardNumber}>{members.length}</Text>
            <Text style={styles.cardLabel}>Total Members</Text>
          </View>
        </View>

        {/* Upcoming Events */}
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        <FlatList
          data={events}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={events.length === 0 && { paddingVertical: 10 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No upcoming events.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>
                {new Date(item.event_date).toLocaleDateString()}
              </Text>
              <Text style={styles.cardSubtitle}>Location : {item.location}</Text>
            </View>
          )}
        />

        {/* Past Events */}
        <Text style={styles.sectionTitle}>Past Events</Text>
        <FlatList
          data={pastEvents}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={pastEvents.length === 0 && { paddingVertical: 10 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No past events.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>
                {new Date(item.event_date).toLocaleDateString()}
              </Text>
              <Text style={styles.cardSubtitle}>Location : {item.location}</Text>
            </View>
          )}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  contentContainer: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  logo: { width: 60, height: 60, marginRight: 10 },
  statsContainer: { flexDirection: "row", flexWrap: "wrap", marginVertical: 15 },
  card: {
    backgroundColor: "#fff",
    width: "48%",
    padding: 15,
    margin: "1%",
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  cardNumber: { fontSize: 22, fontWeight: "bold", color: "#333" },
  cardLabel: { fontSize: 14, color: "#555" },

  sectionTitle: { fontSize: 18, fontWeight: "bold", marginTop: 8, marginBottom: 10, color: "#fff" },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  cardSubtitle: { fontSize: 14, color: "#6b7280", marginTop: 4 },

  loadingText: { marginTop: 10, color: "#fff" },
  errorText: { color: "red" },

  emptyText: { textAlign: "center", color: "#f1f5f9" },
});
