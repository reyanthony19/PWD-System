import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  ScrollView, 
  ActivityIndicator 
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await AsyncStorage.getItem("user");
        if (user) setCurrentUser(JSON.parse(user));
      } catch (err) {
        console.error("Error loading user:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 8, color: "#2563eb", fontWeight: "600" }}>
          Loading...
        </Text>
      </View>
    );
  }

  const fullName = currentUser 
    ? `${currentUser.first_name || ""} ${currentUser.middle_name || ""} ${currentUser.last_name || ""}`.trim()
    : "Guest";

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      {/* Welcome Header */}
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome,</Text>
        <Text style={styles.username}>{fullName}</Text>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.buttonsContainer}>
        <Pressable 
          style={styles.card} 
          onPress={() => router.push("/staff/benefits/BenefitAttendance")}
        >
          <Ionicons name="list" size={32} color="#2563eb" />
          <Text style={styles.cardTitle}>Benefit Attendance</Text>
          <Text style={styles.cardSubtitle}>View all benefit claimants</Text>
        </Pressable>

        <Pressable 
          style={styles.card} 
          onPress={() => router.push("/staff/scanner/BenefitScanner")}
        >
          <Ionicons name="camera" size={32} color="#2563eb" />
          <Text style={styles.cardTitle}>Scanner</Text>
          <Text style={styles.cardSubtitle}>Scan QR codes to claim benefits</Text>
        </Pressable>

        {/* Additional modules */}
        <Pressable 
          style={styles.card} 
          onPress={() => router.push("/staff/reports")}
        >
          <MaterialCommunityIcons name="chart-box" size={32} color="#2563eb" />
          <Text style={styles.cardTitle}>Reports</Text>
          <Text style={styles.cardSubtitle}>View benefit distribution reports</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { marginBottom: 30 },
  welcome: { fontSize: 18, color: "#6b7280" },
  username: { fontSize: 24, fontWeight: "bold", color: "#111827", marginTop: 4 },
  buttonsContainer: { flexDirection: "column", gap: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#111827", marginTop: 8 },
  cardSubtitle: { fontSize: 14, color: "#6b7280", marginTop: 4 },
});
