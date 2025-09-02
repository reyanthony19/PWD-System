import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from "react-native";
import { Text, Button, ActivityIndicator } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/api";

export default function StaffHome({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [benefits, setBenefits] = useState([]);
  const [attendances, setAttendances] = useState([]);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.replace("LoginScreen");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [profileRes, eventsRes, benefitsRes, attendancesRes] =
        await Promise.all([
          api.get("/user", { headers }),
          api.get("/events", { headers }),
          api.get("/benefits-lists", { headers }),
          api.get("/attendances", { headers }),
        ]);

      setProfile(profileRes.data);
      setEvents(eventsRes.data || []);
      setBenefits(benefitsRes.data || []);
      setAttendances(attendancesRes.data || []);
    } catch (err) {
      console.error("Error fetching staff data:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace("LoginScreen");
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header with Profile */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi, {profile?.username} 👋</Text>
          <Text style={styles.subtitle}>Explore your dashboard</Text>
        </View>
        <Image
          source={require("../assets/logo.png")} // fallback avatar
          style={styles.avatar}
        />
      </View>

      {/* Events Section */}
      <Text style={styles.sectionTitle}>📅 Events</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {events.length > 0 ? (
          events.map((event) => (
            <TouchableOpacity key={event.id} style={styles.card}>
              <Image
                source={{ uri: event.image || "https://via.placeholder.com/300" }}
                style={styles.cardImage}
              />
              <View style={styles.cardOverlay}>
                <Text style={styles.cardTitle}>{events.title}</Text>
                <Text style={styles.cardSubtitle}>{events.date || "No date"}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text>No events available</Text>
        )}
      </ScrollView>

      {/* Benefits Section */}
      <Text style={styles.sectionTitle}>🎁 Benefits</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {benefits.length > 0 ? (
          benefits.map((benefit) => (
            <TouchableOpacity key={benefit.id} style={styles.card}>
              <Image
                source={{ uri: benefit.image || "https://via.placeholder.com/300" }}
                style={styles.cardImage}
              />
              <View style={styles.cardOverlay}>
                <Text style={styles.cardTitle}>{benefit.name}</Text>
                <Text style={styles.cardSubtitle}>Available</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text>No benefits available</Text>
        )}
      </ScrollView>

      {/* Attendances Section */}
      <Text style={styles.sectionTitle}>📝 Attendances</Text>
      {attendances.length > 0 ? (
        attendances.map((att) => (
          <View key={att.id} style={styles.listItem}>
            <Text style={styles.listText}>
              {att.member_name} - {att.event_name}
            </Text>
          </View>
        ))
      ) : (
        <Text>No attendances yet</Text>
      )}

      {/* Logout Button */}
      <Button
        mode="contained"
        onPress={handleLogout}
        style={styles.logoutButton}
        buttonColor="#ef4444"
        labelStyle={{ fontWeight: "bold" }}
      >
        Logout
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#f9fafb" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greeting: { fontSize: 22, fontWeight: "bold" },
  subtitle: { fontSize: 14, color: "#6b7280" },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#ddd" },

  // Section Titles
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 10,
  },

  // Horizontal Cards
  card: {
    width: 200,
    height: 140,
    borderRadius: 16,
    marginRight: 12,
    overflow: "hidden",
    elevation: 3,
    backgroundColor: "#fff",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  cardOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  cardSubtitle: { color: "#f3f4f6", fontSize: 12 },

  // Attendances
  listItem: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    elevation: 2,
  },
  listText: { fontSize: 14, color: "#374151" },

  // Logout Button
  logoutButton: {
    marginTop: 20,
    borderRadius: 12,
    paddingVertical: 6,
  },
});
