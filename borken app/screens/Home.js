import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Text, Card, FAB } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/api";

export default function Home({ navigation }) {
  const [events, setEvents] = useState([]);
  const [benefits, setBenefits] = useState([]);

  useEffect(() => {
    fetchEvents();
    fetchBenefits();
  }, []);

  const fetchEvents = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await api.get("/events", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(res.data || []);
    } catch (err) {
      console.log("Error fetching events:", err.response?.data || err.message);
    }
  };

  const fetchBenefits = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await api.get("/benefits-lists", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBenefits(res.data || []);
    } catch (err) {
      console.log("Error fetching benefits:", err.response?.data || err.message);
    }
  };

  const renderEvent = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.cardTitle}>📅 {item.title}</Text>
        <Text style={styles.cardContent}>{item.description}</Text>
        <Text style={styles.cardDate}>{item.date}</Text>
      </Card.Content>
    </Card>
  );

  const renderBenefit = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.cardTitle}>🎁 {item.name}</Text>
        <Text style={styles.cardContent}>{item.description}</Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Events */}
      <Text style={styles.sectionTitle}>Upcoming Events</Text>
      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={styles.empty}>No events yet.</Text>}
      />

      {/* Benefits */}
      <Text style={styles.sectionTitle}>Available Benefits</Text>
      <FlatList
        data={benefits}
        renderItem={renderBenefit}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={styles.empty}>No benefits yet.</Text>}
      />

      {/* Floating Action Button (Optional: navigate to add post/event) */}
      <FAB
        style={styles.fab}
        icon="plus"
        color="white"
        onPress={() => navigation.navigate("LoginScreen")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f9fafb",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
  },
  card: {
    marginBottom: 10,
    borderRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardContent: {
    fontSize: 14,
    color: "#4b5563",
  },
  cardDate: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  empty: {
    textAlign: "center",
    color: "#9ca3af",
    marginVertical: 10,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: "#0284c7",
  },
});
