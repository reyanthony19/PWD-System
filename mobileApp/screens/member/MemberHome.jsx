import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function MemberHome() {
  const navigation = useNavigation();
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
      <View style={[styles.container, styles.loader]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 8, color: "#2563eb", fontWeight: "600" }}>
          Loading...
        </Text>
      </View>
    );
  }

  const fullName = currentUser?.member_profile
    ? `${currentUser.member_profile.first_name || ""} ${currentUser.member_profile.last_name || ""}`.trim()
    : "Guest";
  const username = currentUser ? currentUser.username || "" : "";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <Ionicons name="person-circle" size={100} color="#2563eb" />
        <Text style={styles.profileName}>{fullName}</Text>
        {username ? <Text style={styles.profileUsername}>@{username}</Text> : null}
      </View>

      {/* Navigation Cards */}
      <View style={styles.cardsWrapper}>
        {[
          {
            icon: <Ionicons name="person" size={36} color="#fff" />,
            title: "My Profile",
            subtitle: "View & edit your info",
            bgColor: "#2563eb",
            onPress: () => navigation.navigate("MemberProfile"),
          },
          {
            icon: <Ionicons name="camera" size={36} color="#fff" />,
            title: "Scanner",
            subtitle: "Check in via QR",
            bgColor: "#f59e0b",
            onPress: () => navigation.navigate("MemberScanner"),
          },
          {
            icon: <MaterialCommunityIcons name="chart-box" size={36} color="#fff" />,
            title: "Reports",
            subtitle: "View your reports",
            bgColor: "#10b981",
            onPress: () => navigation.navigate("MemberReports"),
          },
        ].map((card, index) => (
          <Pressable
            key={index}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: card.bgColor },
              pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
            ]}
            onPress={card.onPress}
          >
            <View style={styles.cardIcon}>{card.icon}</View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  scrollContent: { paddingVertical: 24, alignItems: "center" },
  loader: { justifyContent: "center", alignItems: "center" },

  // Profile Card
  profileCard: {
    width: width * 0.9,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 30,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
  },
  profileName: { fontSize: 24, fontWeight: "bold", color: "#111827", marginTop: 12 },
  profileUsername: { fontSize: 16, color: "#6b7280", marginTop: 4 },

  // Cards Wrapper
  cardsWrapper: { width: "100%", alignItems: "center", gap: 16 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    width: width * 0.9,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  cardIcon: {
    width: 60,
    height: 60,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  cardSubtitle: { fontSize: 14, color: "#e0e0e0", marginTop: 4 },
});
