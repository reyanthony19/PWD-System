import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Text,
} from "react-native";
import { Card, Avatar } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import api from "@/services/api";
import { LinearGradient } from "expo-linear-gradient";

export default function MemberBenefits() {
  const navigation = useNavigation();
  const [benefits, setBenefits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [claimStatus, setClaimStatus] = useState({}); // Store claim status for each benefit

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    // Fetch benefits and check claim status
    const fetchBenefits = async () => {
      try {
        const token = await AsyncStorage.getItem("token");

        // Check if token exists
        if (!token) {
          setLoading(false);
          navigation.replace("Login"); // Navigate to login if token is not found
          return;
        }

        // Fetch the benefits list
        const res = await api.get("/benefits-lists", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Debugging log to check the response
        console.log("Benefits Response Data:", res.data);

        // Set the benefits data
        setBenefits(res.data || []); // Assuming res.data contains the array

        // Get current user info
        const userRes = await api.get("/user", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Fetch claim status for each benefit
        const claimStatuses = {};
        for (const benefit of res.data || []) {
          const claimRes = await api.get(`/benefits/${benefit.id}/${userRes.data.id}/claims`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          claimStatuses[benefit.id] = claimRes.data.claimed ? "Claimed" : "Not Claimed";
        }
        setClaimStatus(claimStatuses);

      } catch (err) {
        console.error("Benefits fetch error:", err.response?.data || err.message);
        setError("Failed to load benefits.");

        // Handle token expiration or invalid token
        if (err.response?.status === 401) {
          await AsyncStorage.removeItem("token");
          navigation.replace("Login"); // Navigate to login if session is expired
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBenefits();

    // Set up an interval to refresh benefits every 10 seconds (or 20 seconds)
    const intervalId = setInterval(() => {
      fetchBenefits();
    }, 10000); // 10000ms = 10 seconds (use 20000 for 20 seconds)

    // Clear the interval on component unmount
    return () => clearInterval(intervalId);

  }, [navigation]);

  // Loading state
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 10, color: "#2563eb" }}>Loading Benefits...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );
  }

  // Icon based on benefit type
  const typeIcon = (type) => {
    switch (type.toLowerCase()) {
      case "cash":
        return "cash";
      case "relief":
        return "gift";
      default:
        return "information";
    }
  };

  // Render each benefit item
  const renderBenefit = ({ item }) => {
    const claimStatusText = claimStatus[item.id] || "Checking..."; // Get the claim status or set to "Checking..."

    return (
      <Card
        style={styles.card}
        onPress={() =>
          navigation.navigate("MemberBenefitRecord", { benefitId: item.id, title: item.name })
        }
      >
        <Card.Title
          title={item.name}
          titleStyle={styles.cardTitle}
          subtitle={`📌 Type: ${item.type}`}
          left={(props) => (
            <Avatar.Icon
              {...props}
              icon={typeIcon(item.type)}
              style={{ backgroundColor: "#2563eb" }}
            />
          )}
        />
        <Card.Content>
          <Text style={styles.detail}>📋 Status: <Text style={claimStatusText === "Claimed" ? styles.received : styles.notReceived}>{claimStatusText}</Text></Text>
        </Card.Content>
      </Card>
    );
  };

  return (
    <LinearGradient colors={["#6ee7b7", "#2563eb"]} style={styles.container}>
      <View style={styles.contentContainer}>
        {benefits.length === 0 ? (
          <Text style={styles.empty}>No benefits available</Text>
        ) : (
          <FlatList
            data={benefits}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderBenefit}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  contentContainer: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { textAlign: "center", fontSize: 16, color: "#6b7280", marginTop: 20 },
  card: { borderRadius: 16, marginBottom: 16, backgroundColor: "#fff", elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  detail: { fontSize: 14, marginTop: 4, color: "#374151" },
  received: { color: "green" },
  notReceived: { color: "red" },
});
