import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Button, Avatar, Card } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import api from "@/services/api";

const { width } = Dimensions.get("window");

export default function MemberProfile() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          Alert.alert("Session Expired", "Please log in again.");
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
          return;
        }

        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const res = await api.get("/user");
        setUser(res.data);
      } catch (err) {
        console.error("Profile fetch error:", err.response?.data || err.message);
        Alert.alert("Error", "Failed to load profile. Please log in again.");
        await AsyncStorage.clear();
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      delete api.defaults.headers.common["Authorization"];
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch (err) {
      console.error("Logout error:", err);
      Alert.alert("Error", "Failed to logout. Please try again.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 10, color: "#2563eb" }}>Loading Profile...</Text>
      </View>
    );
  }

  const profile = user?.member_profile || {};
  const fullName = `${profile.first_name || ""} ${profile.middle_name || ""} ${profile.last_name || ""}`.trim();

  const fields = [
    { label: "Username", value: user?.username, icon: "account" },
    { label: "Email", value: user?.email, icon: "email" },
    { label: "Contact Number", value: profile.contact_number, icon: "phone" },
    { label: "Birthdate", value: profile.birthdate ? profile.birthdate.split("T")[0] : null, icon: "calendar" },
    { label: "Address", value: profile.address, icon: "home-map-marker" },
    { label: "Barangay", value: profile.barangay, icon: "map-marker" },
    { label: "Blood Type", value: profile.blood_type, icon: "blood-bag" },
    { label: "SSS Number", value: profile.sss_number, icon: "card-account-details" },
    { label: "PhilHealth Number", value: profile.philhealth_number, icon: "hospital-box" },
    { label: "Disability Type", value: profile.disability_type, icon: "wheelchair-accessibility" },
    { label: "Guardian", value: profile.guardian_full_name, icon: "account-group" },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Card style={styles.profileCard}>
        <Card.Content style={{ alignItems: "center" }}>
          <Avatar.Icon size={90} icon="account" style={styles.avatar} />
          <Text style={styles.fullName}>{fullName || "Member"}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </Card.Content>

        <View style={styles.divider} />

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

      <Button
        mode="contained"
        onPress={() => navigation.navigate("MemberEditProfile")}
        style={styles.button}
        buttonColor="#2563eb"
        icon="account-edit"
      >
        Update Profile
      </Button>

      <Button
        mode="contained"
        onPress={handleLogout}
        style={[styles.button, { backgroundColor: "#dc2626" }]}
        icon="logout"
      >
        Logout
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  scrollContent: { paddingVertical: 24, alignItems: "center" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  profileCard: {
    width: width * 0.9, // 90% of screen width
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

  fieldRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 16 },
  icon: { marginRight: 12 },
  label: { fontSize: 12, color: "#6b7280" },
  value: { fontSize: 16, fontWeight: "600", color: "#111827" },

  button: {
    borderRadius: 10,
    marginTop: 10,
    width: width * 0.9, // same as card
  },
});
