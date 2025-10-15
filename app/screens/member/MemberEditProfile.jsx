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
import { useNavigation } from "@react-navigation/native";
import api from "@/services/api";

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
    address: "",
    barangay: "",
    blood_type: "",
    disability_type: "",
    sex: "",
    id_number: "",
    sss_number: "",
    philhealth_number: "",
    guardian_full_name: "",
    guardian_relationship: "",
    guardian_contact_number: "",
    guardian_address: "",
    remarks: "",
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
        setUser(u);

        const p = u.member_profile || {};
        setFormData({
          username: u.username || "",
          email: u.email || "",
          first_name: p.first_name || "",
          middle_name: p.middle_name || "",
          last_name: p.last_name || "",
          contact_number: p.contact_number || "",
          address: p.address || "",
          barangay: p.barangay || "",
          blood_type: p.blood_type || "",
          disability_type: p.disability_type || "",
          sex: p.sex || "",
          id_number: p.id_number || "",
          sss_number: p.sss_number || "",
          philhealth_number: p.philhealth_number || "",
          guardian_full_name: p.guardian_full_name || "",
          guardian_relationship: p.guardian_relationship || "",
          guardian_contact_number: p.guardian_contact_number || "",
          guardian_address: p.guardian_address || "",
          remarks: p.remarks || "",
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
    
    // Prepare payload - remove empty fields and confirmation field
    const payload = { ...formData };
    if (!payload.password) {
      delete payload.password;
      delete payload.old_password;
    }
    delete payload.password_confirmation;

    // Remove empty optional fields to avoid validation issues
    const optionalFields = [
      'middle_name', 'barangay', 'blood_type', 'disability_type', 'sex',
      'id_number', 'sss_number', 'philhealth_number', 'guardian_full_name',
      'guardian_relationship', 'guardian_contact_number', 'guardian_address', 'remarks'
    ];

    optionalFields.forEach(field => {
      if (!payload[field]) {
        delete payload[field];
      }
    });

    try {
      await api.put(`/user/${user?.id}`, payload);
      Alert.alert("Success", "Profile updated successfully!");
      navigation.goBack();
    } catch (err) {
      console.error("Update error:", err);
      
      if (err.response?.status === 422) {
        // Handle Laravel validation errors
        const errors = err.response.data.errors;
        const firstError = Object.values(errors)[0];
        Alert.alert("Validation Error", Array.isArray(firstError) ? firstError[0] : firstError);
      } else if (err.response?.status === 403) {
        Alert.alert("Unauthorized", "You don't have permission to update this profile.");
      } else if (err.response?.data?.message) {
        Alert.alert("Error", err.response.data.message);
      } else {
        Alert.alert("Error", "Failed to update profile. Please check your connection.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
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
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileHeader}>
            <Avatar.Icon size={80} icon="account-circle" style={styles.avatar} />
            <View style={styles.profileText}>
              <Text style={styles.fullName}>{fullName || "Member Profile"}</Text>
              <Text style={styles.email}>{formData.email}</Text>
            </View>
          </Card.Content>

          <View style={styles.divider} />

          {/* Form Fields inside Card */}
          <View style={styles.form}>
            
            {/* Account Information */}
            <Text style={styles.sectionTitle}>Account Information</Text>
            {[
              ["Username", "username"],
              ["Email", "email"],
              ["Contact Number", "contact_number"],
            ].map(([label, key]) => (
              <TextInput
                key={key}
                label={label}
                mode="outlined"
                value={formData[key]}
                onChangeText={(text) => handleChange(key, text)}
                style={styles.input}
                keyboardType={key === "email" ? "email-address" : key === "contact_number" ? "phone-pad" : "default"}
              />
            ))}

            {/* Name Information */}
            <Text style={styles.sectionTitle}>Name Information</Text>
            {[
              ["First Name", "first_name"],
              ["Middle Name", "middle_name"],
              ["Last Name", "last_name"],
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

            {/* Address Information */}
            <Text style={styles.sectionTitle}>Address Information</Text>
            {[
              ["Address", "address"],
              ["Barangay", "barangay"],
            ].map(([label, key]) => (
              <TextInput
                key={key}
                label={label}
                mode="outlined"
                value={formData[key]}
                onChangeText={(text) => handleChange(key, text)}
                style={styles.input}
                multiline={key === "address"}
                numberOfLines={key === "address" ? 3 : 1}
              />
            ))}

            {/* Medical & Identification */}
            <Text style={styles.sectionTitle}>Medical & Identification</Text>
            {[
              ["Blood Type", "blood_type"],
              ["SSS Number", "sss_number"],
              ["PhilHealth Number", "philhealth_number"],
              ["Disability Type", "disability_type"],
              ["ID Number", "id_number"],
              ["Sex", "sex"],
            ].map(([label, key]) => (
              <TextInput
                key={key}
                label={label}
                mode="outlined"
                value={formData[key]}
                onChangeText={(text) => handleChange(key, text)}
                style={styles.input}
                keyboardType={key.includes("number") ? "numeric" : "default"}
              />
            ))}

            {/* Guardian Information */}
            <Text style={styles.sectionTitle}>Guardian Information</Text>
            {[
              ["Guardian Full Name", "guardian_full_name"],
              ["Guardian Relationship", "guardian_relationship"],
              ["Guardian Contact Number", "guardian_contact_number"],
              ["Guardian Address", "guardian_address"],
            ].map(([label, key]) => (
              <TextInput
                key={key}
                label={label}
                mode="outlined"
                value={formData[key]}
                onChangeText={(text) => handleChange(key, text)}
                style={styles.input}
                keyboardType={key === "guardian_contact_number" ? "phone-pad" : "default"}
                multiline={key === "guardian_address"}
                numberOfLines={key === "guardian_address" ? 3 : 1}
              />
            ))}

            {/* Remarks */}
            <Text style={styles.sectionTitle}>Remarks</Text>
            <TextInput
              label="Remarks"
              mode="outlined"
              value={formData.remarks}
              onChangeText={(text) => handleChange("remarks", text)}
              style={styles.input}
              multiline
              numberOfLines={4}
            />

            {/* Password Change Section */}
            <Text style={styles.sectionTitle}>Change Password (Optional)</Text>
            <Text style={styles.sectionSubtitle}>
              Leave blank if you don't want to change your password
            </Text>
            {[
              ["Current Password", "old_password"],
              ["New Password", "password"],
              ["Confirm New Password", "password_confirmation"],
            ].map(([label, key]) => (
              <TextInput
                key={key}
                label={label}
                mode="outlined"
                secureTextEntry
                value={formData[key]}
                onChangeText={(text) => handleChange(key, text)}
                style={styles.input}
              />
            ))}
          </View>
        </Card>

        {/* Action Buttons */}
        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveButton}
          buttonColor="#2563eb"
          loading={saving}
          disabled={saving}
          icon="content-save"
        >
          {saving ? "Updating..." : "Update Profile"}
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
  container: { 
    flex: 1, 
    backgroundColor: "#f3f4f6" 
  },
  scrollContent: { 
    padding: 20,
    paddingBottom: 40 
  },
  loader: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  loadingText: { 
    marginTop: 10, 
    color: "#2563eb" 
  },
  profileCard: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#fff",
    elevation: 4,
    paddingVertical: 20,
    marginBottom: 20,
  },
  profileHeader: { 
    flexDirection: "row", 
    alignItems: "center" 
  },
  avatar: { 
    backgroundColor: "#2563eb", 
    marginRight: 16 
  },
  profileText: { 
    flex: 1 
  },
  fullName: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#111827",
    marginBottom: 4 
  },
  email: { 
    fontSize: 14, 
    color: "#6b7280",
    marginBottom: 2 
  },
  memberId: { 
    fontSize: 12, 
    color: "#9ca3af" 
  },
  divider: { 
    height: 1, 
    backgroundColor: "#e5e7eb", 
    marginVertical: 20,
    marginHorizontal: 16 
  },
  form: { 
    paddingHorizontal: 16 
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 20,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 12,
    fontStyle: 'italic'
  },
  input: { 
    marginBottom: 12 
  },
  saveButton: { 
    borderRadius: 10, 
    marginTop: 10, 
    width: "100%",
    paddingVertical: 6 
  },
  cancelButton: { 
    borderRadius: 10, 
    marginTop: 10, 
    width: "100%",
    paddingVertical: 6 
  },
});