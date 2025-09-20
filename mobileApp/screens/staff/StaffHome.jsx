import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Alert, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "@/services/api"; // Ensure the correct API service is imported

export default function StaffHome({ navigation }) {
  const [user, setUser] = useState({});
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]); // Store events here
  const [pastEvents, setPastEvents] = useState([]); // Store past events here
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    loadUser();
    fetchMembersData();
    fetchEvents();

    // Set up an interval to fetch data every 10 seconds (or change to 5 for 5 seconds)
    const intervalId = setInterval(() => {
      fetchMembersData();
      fetchEvents();
    }, 10000); // 10000ms = 10 seconds

    // Clear the interval when the component is unmounted
    return () => clearInterval(intervalId);
  }, []);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        setLoading(false);
        console.log("Token not found. Redirecting to login...");
        return;
      }

      // Fetch current user data
      const userRes = await api.get("/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
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

      // Fetch all users data
      const usersRes = await api.get("/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Filter members with status "approved" and role "member"
      const approvedMembers = usersRes.data.filter(user => user.status === "approved" && user.role === "member");

      setMembers(approvedMembers); // Store the filtered members
    } catch (err) {
      Alert.alert("Error", "Failed to load members data");
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      // Fetch all events
      const eventsRes = await api.get("/events", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Check if events are returned in the correct structure
      const eventsData = Array.isArray(eventsRes.data.data) ? eventsRes.data.data : [];

      // Fetch user data to replace user_id with username
      const usersRes = await api.get("/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const users = usersRes.data;

      // Create a mapping of user_id to username
      const userMap = users.reduce((acc, user) => {
        acc[user.id] = user.username;
        return acc;
      }, {});

      // Map events and replace user_id with username
      const updatedEvents = eventsData.map(event => ({
        ...event,
        username: userMap[event.user_id] || "Unknown", // Replace user_id with username
      }));

      // Filter events to show only upcoming events
      const currentDate = new Date();
      const upcomingEvents = updatedEvents.filter((event) => new Date(event.event_date) > currentDate);
      const pastEvents = updatedEvents.filter((event) => new Date(event.event_date) <= currentDate);

      setEvents(upcomingEvents);
      setPastEvents(pastEvents);
    } catch (err) {
      console.error("Error fetching events:", err);
      Alert.alert("Error", "Failed to load events");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 10, color: "#2563eb" }}>Loading Dashboard...</Text>
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

  return (
    <View style={styles.container}>
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

      {/* Upcoming Events Section */}
      <Text style={styles.sectionTitle}>Upcoming Events</Text>
      {events.length > 0 ? (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{new Date(item.event_date).toLocaleDateString()}</Text>
              <Text style={styles.cardSubtitle}>Hosted by: {item.username}</Text> {/* Display the username */}
            </View>
          )}
        />
      ) : (
        <Text style={{ textAlign: "center", color: "#999", marginTop: 20 }}>
          No upcoming events.
        </Text>
      )}

      {/* Past Events Section */}
      <Text style={styles.sectionTitle}>Past Events</Text>
      {pastEvents.length > 0 ? (
        <FlatList
          data={pastEvents}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{new Date(item.event_date).toLocaleDateString()}</Text>
              <Text style={styles.cardSubtitle}>Hosted by: {item.username}</Text>
            </View>
          )}
        />
      ) : (
        <Text style={{ textAlign: "center", color: "#999", marginTop: 20 }}>
          No past events.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#f9f9f9" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
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
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  cardSubtitle: { fontSize: 14, color: "#6b7280", marginTop: 4 },
});
