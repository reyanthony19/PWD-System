import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Image,
} from "react-native";
import { Button, Avatar, Card } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import api from "@/services/api";

const { width } = Dimensions.get("window");

const defaultValues = {
  contact_number: "No contact yet",
  address: "Address not provided",
  barangay: "Barangay not provided",
  blood_type: "Unknown",
  sss_number: "N/A",
  philhealth_number: "N/A",
  disability_type: "Not declared",
  guardian_full_name: "Guardian name missing",
  guardian_relationship: "Relationship not specified",
  guardian_contact_number: "No contact yet",
  guardian_address: "Guardian address missing",
  sex: "unspecified",
  first_name: "First name not set",
  middle_name: "Middle name not set",
  last_name: "Last name not set",
  birthdate: new Date().toISOString().split("T")[0], // today
};

export default function MemberProfile() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState(null); // To store member documents
  const [loading, setLoading] = useState(true);
  const [incompleteFields, setIncompleteFields] = useState([]);

  // Use the proper base URL to fetch the images
  const BASE_URL = "http://127.0.0.1/storage/";  // Change this to your Laravel app's public URL

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
        setUser(res.data);  // Save user data to state

        // Log user details
        console.log("Fetched user details:", res.data);

        const profile = res.data?.member_profile || {};
        const missing = [];

        Object.entries(defaultValues).forEach(([key, defValue]) => {
          if (
            profile[key] === defValue ||
            profile[key]?.toString().trim() === "" ||
            profile[key] == null
          ) {
            missing.push(key);
          }
        });

        setIncompleteFields(missing);

        // Fetch member documents using user ID
        const userDocuments = await getMemberDocuments(res.data.id); // Pass user_id
        console.log("Fetched member documents:", userDocuments);  // Log the member documents for debugging
        setDocuments(userDocuments); // Store the documents in state
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
    const intervalId = setInterval(fetchUser, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // Fetch member documents based on user ID
  const getMemberDocuments = async (user_id) => {
    try {
      const res = await api.get(`/user/documents/${user_id}`);  
      console.log("Fetched documents response:", res.data); 
      return res.data;  
    } catch (error) {
      console.error("Error fetching member documents:", error);
      throw new Error("Failed to fetch member documents.");
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");

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

  const profile = user?.member_profile ||  {};
  const docs = documents || {};
  const fullName = `${profile.first_name || ""} ${profile.middle_name || ""} ${profile.last_name || ""}`.trim();

  // Fields to display, including image fields
  const fields = [
    { label: "Username", value: user?.username, icon: "account", key: "username" },
    { label: "Email", value: user?.email, icon: "email", key: "email" },
    { label: "Contact Number", value: profile.contact_number, icon: "phone", key: "contact_number" },
    {
      label: "Birthdate",
      value: profile.birthdate ? profile.birthdate.split("T")[0] : null,
      icon: "calendar",
      key: "birthdate",
    },
    { label: "Address", value: profile.address, icon: "home-map-marker", key: "address" },
    { label: "Barangay", value: profile.barangay, icon: "map-marker", key: "barangay" },
    { label: "Blood Type", value: profile.blood_type, icon: "blood-bag", key: "blood_type" },
    { label: "SSS Number", value: profile.sss_number, icon: "card-account-details", key: "sss_number" },
    { label: "PhilHealth Number", value: profile.philhealth_number, icon: "hospital-box", key: "philhealth_number" },
    { label: "Disability Type", value: profile.disability_type, icon: "wheelchair-accessibility", key: "disability_type" },
    { label: "Guardian", value: profile.guardian_full_name, icon: "account-group", key: "guardian_full_name" },
    // Add fields for images
    { label: "Barangay Indigency", value: docs.barangay_indigency, icon: "image", key: "barangay_indigency" },
    { label: "Medical Certificate", value: docs.medical_certificate, icon: "image", key: "medical_certificate" },
    { label: "2x2 Picture", value: docs.picture_2x2, icon: "image", key: "picture_2x2" },
    { label: "Birth Certificate", value: docs.birth_certificate, icon: "image", key: "birth_certificate" },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {incompleteFields.length > 0 && (
        <View style={styles.warningBox}>
          <Icon name="alert-circle" size={20} color="#b45309" style={{ marginRight: 6 }} />
          <Text style={styles.warningText}>
            Some profile information is incomplete. Please review and update.
          </Text>
        </View>
      )}

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
              {f.key.includes("image") && f.value ? (
                // Log the image URL before displaying it
                console.log(`Displaying image for ${f.label}: ${BASE_URL}${f.value}`),
                // Display images for image fields
                <Image source={{ uri: `${BASE_URL}${f.value}` }} style={styles.image} />
              ) : (
                <Text style={styles.value}>{f.value || "—"}</Text>
              )}
              {incompleteFields.includes(f.key) && (
                <Text style={styles.fieldWarning}>⚠️ Incomplete – needs update</Text>
              )}
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
    width: width * 0.9,
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
  fieldWarning: { fontSize: 12, color: "#b91c1c", marginTop: 2, fontStyle: "italic" },

  image: { width: 100, height: 100, borderRadius: 8, marginTop: 8 },
  button: {
    borderRadius: 10,
    marginTop: 10,
    width: width * 0.9,
  },

  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    borderColor: "#fcd34d",
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    width: width * 0.9,
    marginBottom: 12,
  },
  warningText: {
    color: "#92400e",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    flexWrap: "wrap",
  },
});
