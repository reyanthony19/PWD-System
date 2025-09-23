import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { Button, Avatar, Card, TextInput } from "react-native-paper";
import api from "@/services/api";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from 'expo-image-picker'; // Import ImagePicker from Expo
import { Picker } from '@react-native-picker/picker'; // Import Picker for dropdowns

// Default field values
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
    gender: "",
    barangay: "",
    blood_type: "",
    disability_type: "",
    guardian_full_name: "",
    guardian_relationship: "",
    guardian_contact_number: "",
    guardian_address: "",
    barangay_indigency: null,
    medical_certificate: null,
    picture_2x2: null,
    birth_certificate: null,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Gender and Barangay options
  const genderOptions = ["Male", "Female", "Other"];
  const barangayOptions = [
    "Awang", "Bagocboc", "Barra", "Bonbon", "Cauyonan", "Igpit",
    "Limonda", "Luyong Bonbon", "Malanang", "Nangcaon", "Patag",
    "Poblacion", "Taboc", "Tingalan"
  ];

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
          birthdate: p.birthdate?.split("T")[0] || defaultValues.birthdate,
          address: p.address?.trim() || defaultValues.address,
          gender: p.gender || "",
          barangay: p.barangay || defaultValues.barangay,
          blood_type: p.blood_type || defaultValues.blood_type,
          disability_type: p.disability_type || defaultValues.disability_type,
          guardian_full_name: p.guardian_full_name || defaultValues.guardian_full_name,
          guardian_relationship: p.guardian_relationship || "",
          guardian_contact_number: p.guardian_contact_number || "",
          guardian_address: p.guardian_address || "",
          old_password: "",
          password: "",
          password_confirmation: "",
          barangay_indigency: null,
          medical_certificate: null,
          picture_2x2: null,
          birth_certificate: null,
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

  // Use Expo ImagePicker for document/file picking
  const handleFileChange = async (fieldName) => {
    let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("Permission to access the media library is required!");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Allow picking images only
        allowsEditing: true,
        quality: 1, // Set image quality to max
      });

      if (!result.cancelled) {
        setFormData((prev) => ({ ...prev, [fieldName]: result.uri }));
      }
    } catch (error) {
      console.error("Error picking file:", error);
    }
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

    const formDataToSend = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value) {
        formDataToSend.append(key, value);
      }
    });

    try {
      await api.put(`/user/${user?.id}`, formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, alignItems: "center" }} keyboardShouldPersistTaps="handled">
        <Card style={styles.profileCard}>
          <Card.Content style={{ alignItems: "center" }}>
            <Avatar.Icon size={80} icon="account-circle" style={styles.avatar} />
            <Text style={styles.fullName}>{fullName || "Edit Profile"}</Text>
            <Text style={styles.email}>{formData.email}</Text>
          </Card.Content>

          <View style={styles.divider} />

          <View style={styles.form}>
            {[["Username", "username"], ["Email", "email"], ["First Name", "first_name"], ["Middle Name", "middle_name"], ["Last Name", "last_name"], ["Contact Number", "contact_number"], ["Birthdate", "birthdate"], ["Address", "address"]].map(([label, key]) => (
              <TextInput key={key} label={label} mode="outlined" value={formData[key]} onChangeText={(text) => handleChange(key, text)} style={styles.input} />
            ))}

            {/* Gender Dropdown */}
            <Picker selectedValue={formData.gender} onValueChange={(itemValue) => handleChange("gender", itemValue)} style={styles.input}>
              <Picker.Item label="Select Gender" value="" />
              {genderOptions.map((gender) => (
                <Picker.Item key={gender} label={gender} value={gender} />
              ))}
            </Picker>

            {/* Barangay Dropdown */}
            <Picker selectedValue={formData.barangay} onValueChange={(itemValue) => handleChange("barangay", itemValue)} style={styles.input}>
              <Picker.Item label="Select Barangay" value="" />
              {barangayOptions.map((barangay) => (
                <Picker.Item key={barangay} label={barangay} value={barangay} />
              ))}
            </Picker>

            {/* Other Fields */}
            <TextInput label="Blood Type" mode="outlined" value={formData.blood_type} onChangeText={(text) => handleChange("blood_type", text)} style={styles.input} />
            <TextInput label="Current Password" mode="outlined" secureTextEntry value={formData.old_password} onChangeText={(text) => handleChange("old_password", text)} style={styles.input} />
            <TextInput label="New Password" mode="outlined" secureTextEntry value={formData.password} onChangeText={(text) => handleChange("password", text)} style={styles.input} />
            <TextInput label="Confirm Password" mode="outlined" secureTextEntry value={formData.password_confirmation} onChangeText={(text) => handleChange("password_confirmation", text)} style={styles.input} />
          </View>
        </Card>

        {/* File Upload Fields */}
        <Card style={styles.profileCard}>
          <Card.Content style={{ alignItems: "center" }}>
            <Text style={styles.fullName}>Documents Upload</Text>
          </Card.Content>
          <View style={styles.form}>
            {[{ label: "Barangay Indigency", name: "barangay_indigency" }, { label: "Medical Certificate", name: "medical_certificate" }, { label: "2x2 Picture", name: "picture_2x2" }, { label: "Birth Certificate", name: "birth_certificate" }].map(({ label, name }) => (
              <Button key={name} mode="contained" onPress={() => handleFileChange(name)} style={styles.fileUploadButton}>
                {label}
              </Button>
            ))}
          </View>
        </Card>

        <Button mode="contained" onPress={handleSave} style={styles.saveButton} buttonColor="#2563eb" loading={saving} disabled={saving} icon="content-save">
          Save Changes
        </Button>

        <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.cancelButton} textColor="#374151" icon="close-circle">
          Cancel
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  profileCard: { width: "100%", borderRadius: 16, backgroundColor: "#fff", elevation: 4, paddingVertical: 20, marginBottom: 20 },
  avatar: { backgroundColor: "#2563eb", marginBottom: 10 },
  fullName: { fontSize: 20, fontWeight: "bold", color: "#111827", marginBottom: 4 },
  email: { fontSize: 14, color: "#6b7280", marginBottom: 10 },
  divider: { height: 1, backgroundColor: "#e5e7eb", marginVertical: 10 },
  form: { paddingHorizontal: 16 },
  input: { marginBottom: 12 },
  fileUploadButton: { marginBottom: 10, width: "100%" },
  saveButton: { borderRadius: 10, marginTop: 10, width: "100%" },
  cancelButton: { borderRadius: 10, marginTop: 10, width: "100%" },
});
