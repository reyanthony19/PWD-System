// screens/staff/Profile.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Button, Avatar, Card } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import api from "@/services/api";

export default function Profile() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch profile with token
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem("token");

        if (!token) {
          Alert.alert("Session Expired", "Please log in again.");
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
          return;
        }

        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const res = await api.get("/user");
        setUser(res.data);
      } catch (err) {
        console.error("Profile fetch error:", err.response?.data || err.message);
        Alert.alert("Error", "Failed to load profile. Please log in again.");
        await AsyncStorage.clear();
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

 const handleLogout = async () => {
  try {
    // Clear AsyncStorage to remove the user session
    await AsyncStorage.clear();

    // Clear the Authorization header from the API defaults
    delete api.defaults.headers.common["Authorization"];

    // Trigger a reload by replacing the current navigation stack
    navigation.replace('Login'); // This will take the user to the Login screen

    // Optionally, show a confirmation alert (can be skipped for smoother UX)
    Alert.alert("Success", "You have been logged out successfully.");
  } catch (error) {
    console.error("Logout error:", error);
    Alert.alert("Error", "Failed to logout. Please try again.");
  }
};


  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 10, color: "#2563eb" }}>
          Loading Profile...
        </Text>
      </View>
    );
  }

  const profile =
    user?.admin_profile || user?.staff_profile || user?.member_profile || {};
  const fullName = `${profile.first_name || ""} ${profile.middle_name || ""} ${profile.last_name || ""}`.trim();

  const fields = [
    { label: "Username", value: user?.username, icon: "account" },
    { label: "Email", value: user?.email, icon: "email" },
    { label: "Contact Number", value: profile.contact_number, icon: "phone" },
    {
      label: "Birthdate",
      value: profile.birthdate ? profile.birthdate.split("T")[0] : null,
      icon: "calendar",
    },
    { label: "Address", value: profile.address, icon: "home-map-marker" },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 20, alignItems: "center" }}
    >
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
        onPress={() => navigation.navigate("EditProfile")}
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
  fullName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
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
