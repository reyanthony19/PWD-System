import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  Portal,
  Dialog,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../api/api";

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    old_password: "",
    password: "",
    password_confirmation: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    contact_number: "",
    birthdate: "",
    address: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal state
  const [visible, setVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const showModal = (msg) => {
    setModalMessage(msg);
    setVisible(true);
  };
  const hideModal = () => setVisible(false);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchUser = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.replace("LoginScreen");
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };
      const response = await api.get("/user", { headers });

      const fetchedUser = response.data;
      setUser(fetchedUser);

      const p =
        fetchedUser.admin_profile ||
        fetchedUser.staff_profile ||
        fetchedUser.member_profile ||
        {};

      setFormData((prev) => ({
        ...prev,
        username: fetchedUser.username || "",
        email: fetchedUser.email || "",
        first_name: p.first_name || "",
        middle_name: p.middle_name || "",
        last_name: p.last_name || "",
        contact_number: p.contact_number || "",
        birthdate: formatDate(p.birthdate),
        address: p.address || "",
      }));
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleUpdate = async () => {
    setSaving(true);

    if (
      formData.password &&
      formData.password !== formData.password_confirmation
    ) {
      showModal("New password and confirmation do not match.");
      setSaving(false);
      return;
    }

    const payload = { ...formData };
    if (!payload.password) delete payload.password;
    if (!payload.old_password) delete payload.old_password;
    if (!payload.password_confirmation) delete payload.password_confirmation;

    try {
      await api.put(`/user/${user?.id}`, payload);
      showModal("Profile updated successfully!");
      setFormData((prev) => ({
        ...prev,
        old_password: "",
        password: "",
        password_confirmation: "",
      }));
    } catch (err) {
      console.error("Failed to update profile:", err);
      showModal(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading Profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0} // Adjust offset if header exists
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Edit Profile</Text>

        {[
          { label: "Username", name: "username" },
          { label: "Email", name: "email" },
          { label: "Current Password", name: "old_password", secure: true },
          { label: "New Password", name: "password", secure: true },
          { label: "Confirm Password", name: "password_confirmation", secure: true },
          { label: "First Name", name: "first_name" },
          { label: "Middle Name", name: "middle_name" },
          { label: "Last Name", name: "last_name" },
          { label: "Contact Number", name: "contact_number", keyboard: "phone-pad" },
          { label: "Birthdate (YYYY-MM-DD)", name: "birthdate" },
          { label: "Address", name: "address" },
        ].map((field) => (
          <TextInput
            key={field.name}
            label={field.label}
            value={formData[field.name]}
            onChangeText={(v) => handleChange(field.name, v)}
            secureTextEntry={field.secure || false}
            keyboardType={field.keyboard || "default"}
            style={styles.input}
          />
        ))}

        <Button
          mode="contained"
          onPress={handleUpdate}
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
        >
          {saving ? "Saving..." : "Update Profile"}
        </Button>
      </ScrollView>

      <Portal>
        <Dialog visible={visible} onDismiss={hideModal}>
          <Dialog.Title>
            {modalMessage.includes("successfully") ? "✅ Success" : "⚠️ Error"}
          </Dialog.Title>
          <Dialog.Content>
            <Text>{modalMessage}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideModal}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: "#fff",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: { marginBottom: 12 },
  saveButton: { marginTop: 16, borderRadius: 8 },
});
