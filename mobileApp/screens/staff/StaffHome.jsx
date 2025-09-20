import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Alert, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "@/services/api"; // Ensure the correct API service is imported
import { BarChart } from "react-native-chart-kit"; // Importing BarChart for chart rendering

export default function StaffHome({ navigation }) {
  const [user, setUser] = useState({});
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]); // Store events here
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [monthlyMemberCount, setMonthlyMemberCount] = useState([]);

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    loadUser();
    fetchMembersData();
    fetchUpcomingEvents();

    // Set up an interval to fetch data every 10 seconds (or change to 5 for 5 seconds)
    const intervalId = setInterval(() => {
      fetchMembersData();
      fetchUpcomingEvents();
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

      // Fetch all members data
      const usersRes = await api.get("/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMembers(usersRes.data); // Store the fetched members

      // Process the data to count members by month
      processMemberData(usersRes.data);
    } catch (err) {
      Alert.alert("Error", "Failed to load members data");
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingEvents = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      // Fetch all events
      const eventsRes = await api.get("/events", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Events Response:", eventsRes.data); // Add a log to inspect the response

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

      setEvents(upcomingEvents);
    } catch (err) {
      console.error("Error fetching events:", err);
      Alert.alert("Error", "Failed to load events");
    }
  };

  const processMemberData = (membersData) => {
    // List of month names
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    // Create a map to store member count by month (Month name format)
    const memberCounts = {};

    membersData.forEach((member) => {
      const registrationDate = new Date(member.created_at);
      const monthName = monthNames[registrationDate.getMonth()]; // Get the month name

      if (!memberCounts[monthName]) {
        memberCounts[monthName] = 0;
      }
      memberCounts[monthName]++;
    });

    // Convert the map to an array of objects for the chart
    const memberCountsArray = Object.keys(memberCounts).map((key) => ({
      month: key,
      count: memberCounts[key],
    }));

    // Set the monthly member counts state
    setMonthlyMemberCount(memberCountsArray);
  };

  // Chart Data Preparation
  const chartData = monthlyMemberCount.length
    ? {
        labels: monthlyMemberCount.map((item) => item.month), // X-axis: month names (January, February, etc.)
        datasets: [
          {
            data: monthlyMemberCount.map((item) => item.count), // Y-axis: member count for that month
          },
        ],
      }
    : null;

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

      {/* Bar Chart for Monthly Member Count */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Monthly Member Registrations</Text>
        {monthlyMemberCount.length ? (
          <BarChart
            data={chartData}
            width={Dimensions.get("window").width - 32} // Adjust width for responsiveness
            height={220}
            yAxisLabel="" // Removed the Y-axis label
            chartConfig={{
              backgroundColor: "#fff",
              backgroundGradientFrom: "#f7f7f7",
              backgroundGradientTo: "#f7f7f7",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(38, 194, 129, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: { borderRadius: 16 },
            }}
          />
        ) : (
          <Text style={{ textAlign: "center", color: "#999" }}>
            No data available for monthly member registrations.
          </Text>
        )}
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
  chartContainer: { marginTop: 20 },
  chartTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  cardSubtitle: { fontSize: 14, color: "#6b7280", marginTop: 4 },
});
