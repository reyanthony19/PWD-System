import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Button, Avatar, Card, TextInput } from "react-native-paper";
import api from "@/services/api";
import { useNavigation } from "@react-navigation/native";

const defaultValues = {
  contact_number: "0000000000",
  address: "Please update your address",
  barangay: "Update this field",
  blood_type: "Unknown",
  sss_number: "Not set",
  philhealth_number: "Not set",
  disability_type: "Unspecified",
  guardian_full_name: "No guardian name",
  birthdate: new Date(new Date().setFullYear(new Date().getFullYear() - 18))
    .toISOString()
    .split("T")[0], // 18 years ago
};

export default function MemberEditProfile() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    contact_number: "",
    birthdate: "",
    address: "",
    old_password: "",
    password: "",
    password_confirmation: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/user");
        const u = res.data;
        const p = u.member_profile || {};

        setUser(u);

        setFormData({
          username: u.username || "",
          email: u.email || "",
          first_name: p.first_name || "",
          middle_name: p.middle_name || "",
          last_name: p.last_name || "",
          contact_number: p.contact_number?.trim() || defaultValues.contact_number,
          birthdate:
            p.birthdate?.split("T")[0] || defaultValues.birthdate,
          address: p.address?.trim() || defaultValues.address,
          old_password: "",
          password: "",
          password_confirmation: "",
        });
      } catch (err) {
        console.error("Profile fetch error:", err);
        Alert.alert("Error", "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (formData.password && formData.password !== formData.password_confirmation) {
      Alert.alert("Error", "New password and confirmation do not match.");
      return;
    }

    setSaving(true);
    const payload = { ...formData };
    if (!payload.password) delete payload.password;
    if (!payload.old_password) delete payload.old_password;
    if (!payload.password_confirmation) delete payload.password_confirmation;

    try {
      await api.put(`/user/${user?.id}`, payload);
      Alert.alert("Success", "Profile updated successfully!");
      navigation.goBack();
    } catch (err) {
      console.error("Update error:", err);
      Alert.alert("Error", err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
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

  const fullName = `${formData.first_name} ${formData.middle_name} ${formData.last_name}`.trim();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 20, alignItems: "center" }}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.profileCard}>
          <Card.Content style={{ alignItems: "center" }}>
            <Avatar.Icon size={80} icon="account-circle" style={styles.avatar} />
            <Text style={styles.fullName}>{fullName || "Edit Profile"}</Text>
            <Text style={styles.email}>{formData.email}</Text>
          </Card.Content>

          <View style={styles.divider} />

          <View style={styles.form}>
            {[["Username", "username"],
              ["Email", "email"],
              ["First Name", "first_name"],
              ["Middle Name", "middle_name"],
              ["Last Name", "last_name"],
              ["Contact Number", "contact_number"],
              ["Birthdate", "birthdate"],
              ["Address", "address"]
            ].map(([label, key]) => (
              <TextInput
                key={key}
                label={label}
                mode="outlined"
                value={formData[key]}
                onChangeText={(text) => handleChange(key, text)}
                style={styles.input}
              />
            ))}

            <TextInput
              label="Current Password"
              mode="outlined"
              secureTextEntry
              value={formData.old_password}
              onChangeText={(text) => handleChange("old_password", text)}
              style={styles.input}
            />
            <TextInput
              label="New Password"
              mode="outlined"
              secureTextEntry
              value={formData.password}
              onChangeText={(text) => handleChange("password", text)}
              style={styles.input}
            />
            <TextInput
              label="Confirm Password"
              mode="outlined"
              secureTextEntry
              value={formData.password_confirmation}
              onChangeText={(text) => handleChange("password_confirmation", text)}
              style={styles.input}
            />
          </View>
        </Card>

        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveButton}
          buttonColor="#2563eb"
          loading={saving}
          disabled={saving}
          icon="content-save"
        >
          Save Changes
        </Button>

        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
          textColor="#374151"
          icon="close-circle"
        >
          Cancel
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
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
  fullName: { fontSize: 20, fontWeight: "bold", color: "#111827", marginBottom: 4 },
  email: { fontSize: 14, color: "#6b7280", marginBottom: 10 },

  divider: { height: 1, backgroundColor: "#e5e7eb", marginVertical: 10 },

  form: { paddingHorizontal: 16 },
  input: { marginBottom: 12 },

  saveButton: { borderRadius: 10, marginTop: 10, width: "100%" },
  cancelButton: { borderRadius: 10, marginTop: 10, width: "100%" },
});
