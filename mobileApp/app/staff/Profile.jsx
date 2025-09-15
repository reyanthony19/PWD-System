import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native";
import { Button, Avatar, Card } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import api from "../../services/api";

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/user");
        setUser(res.data);
      } catch (err) {
        console.error("Profile fetch error:", err);
        Alert.alert("Error", "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    router.replace("/auth/");
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 10, color: "#2563eb" }}>Loading Profile...</Text>
      </View>
    );
  }

  const profile = user?.admin_profile || user?.staff_profile || user?.member_profile || {};
  const fullName = `${profile.first_name || ""} ${profile.middle_name || ""} ${profile.last_name || ""}`.trim();

  const fields = [
    { label: "Username", value: user?.username, icon: "account" },
    { label: "Email", value: user?.email, icon: "email" },
    { label: "Contact Number", value: profile.contact_number, icon: "phone" },
    { label: "Birthdate", value: profile.birthdate?.split("T")[0], icon: "calendar" },
    { label: "Address", value: profile.address, icon: "home-map-marker" },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, alignItems: "center" }}>
      {/* Profile Card */}
      <Card style={styles.profileCard}>
        <Card.Content style={{ alignItems: "center" }}>
          <Avatar.Icon size={90} icon="account" style={styles.avatar} />
          <Text style={styles.fullName}>{fullName || "Full Name"}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </Card.Content>

        <View style={styles.divider} />

        {/* Info Section */}
        {fields.map((f, idx) => (
          <View key={idx} style={styles.fieldRow}>
            <Icon name={f.icon} size={22} color="#2563eb" style={styles.icon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{f.label}</Text>
              <Text style={styles.value}>{f.value || "—"}</Text>
            </View>
          </View>
        ))}
      </Card>

      {/* Buttons */}
      <Button
        mode="contained"
        onPress={() => router.push("/staff/EditProfile")}
        style={styles.editButton}
        buttonColor="#2563eb"
        icon="account-edit"
      >
        Edit Profile
      </Button>

      <Button
        mode="contained"
        onPress={handleLogout}
        style={styles.logoutButton}
        buttonColor="#dc2626"
        icon="logout"
      >
        Logout
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  profileCard: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#fff",
    elevation: 4,
    paddingVertical: 20,
    marginBottom: 20,
  },
  avatar: { backgroundColor: "#2563eb", marginBottom: 10 },
  fullName: { fontSize: 22, fontWeight: "bold", color: "#111827", marginBottom: 4 },
  email: { fontSize: 14, color: "#6b7280", marginBottom: 10 },

  divider: { height: 1, backgroundColor: "#e5e7eb", marginVertical: 10 },

  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  icon: { marginRight: 12 },
  label: { fontSize: 12, color: "#6b7280" },
  value: { fontSize: 16, fontWeight: "600", color: "#111827" },

  editButton: { borderRadius: 10, marginTop: 10, width: "100%" },
  logoutButton: { borderRadius: 10, marginTop: 10, width: "100%" },
});
