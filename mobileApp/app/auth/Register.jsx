import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Picker } from "@react-native-picker/picker";
import api from "../../services/api";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    birthdate: "",
    sex: "",
    address: "",
    barangay: "",
    contact_number: "",
    disability_type: "",
    blood_type: "",
    sss_number: "",
    philhealth_number: "",
    guardian_full_name: "",
    guardian_relationship: "",
    guardian_contact_number: "",
    guardian_address: "",
    remarks: "",
    role: "member",
    status: "approved",
  });

  const [documents, setDocuments] = useState({
    barangay_indigency: null,
    medical_certificate: null,
    picture_2x2: null,
    birth_certificate: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const barangayOptions = [
    "Awang", "Bagocboc", "Barra", "Bonbon", "Cauyonan", "Igpit",
    "Limonda", "Luyong Bonbon", "Malanang", "Nangcaon", "Patag",
    "Poblacion", "Taboc", "Tingalan"
  ];

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDocPick = async (name) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/jpeg", "image/png", "application/pdf"],
    });

    if (result.canceled) return;

    const file = result.assets[0];
    setDocuments((prev) => ({
      ...prev,
      [name]: {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || "application/octet-stream",
      },
    }));
  };

  const handleRegister = async () => {
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (value) {
          formData.append(key, value);
        }
      });

      Object.entries(documents).forEach(([key, file]) => {
        if (file) {
          formData.append(key, {
            uri: file.uri,
            name: file.name,
            type: file.type,
          });
        }
      });

      const res = await api.post("/member/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await AsyncStorage.setItem("token", res.data.token);
      alert("Registration successful!");
    } catch (err) {
      const errors = err.response?.data?.errors;
      const errorMessage = errors
        ? Object.values(errors).flat().join(", ")
        : err.response?.data?.message || "Registration failed.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Member Registration</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Username, Email, Password */}
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={form.username}
        onChangeText={(val) => handleChange("username", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        value={form.email}
        onChangeText={(val) => handleChange("email", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={form.password}
        onChangeText={(val) => handleChange("password", val)}
      />

      {/* Name Fields */}
      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={form.first_name}
        onChangeText={(val) => handleChange("first_name", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="Middle Name"
        value={form.middle_name}
        onChangeText={(val) => handleChange("middle_name", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={form.last_name}
        onChangeText={(val) => handleChange("last_name", val)}
      />

      {/* Birthdate Picker */}
      <TouchableOpacity
        style={styles.dateInput}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={{ color: form.birthdate ? "#000" : "#888" }}>
          {form.birthdate || "Select Birthdate"}
        </Text>
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        onConfirm={(date) => {
          setShowDatePicker(false);
          handleChange("birthdate", date.toISOString().split("T")[0]);
        }}
        onCancel={() => setShowDatePicker(false)}
      />

      {/* Sex Picker */}
      <Text style={styles.label}>Sex</Text>
      <Picker
        selectedValue={form.sex}
        onValueChange={(val) => handleChange("sex", val)}
        style={styles.picker}
      >
        <Picker.Item label="Select Sex" value="" />
        <Picker.Item label="Male" value="male" />
        <Picker.Item label="Female" value="female" />
        <Picker.Item label="Other" value="other" />
      </Picker>

      {/* Address & Barangay */}
      <TextInput
        style={styles.input}
        placeholder="Complete Address"
        value={form.address}
        onChangeText={(val) => handleChange("address", val)}
      />
      <Text style={styles.label}>Barangay</Text>
      <Picker
        selectedValue={form.barangay}
        onValueChange={(val) => handleChange("barangay", val)}
        style={styles.picker}
      >
        <Picker.Item label="Select Barangay" value="" />
        {barangayOptions.map((b) => (
          <Picker.Item key={b} label={b} value={b} />
        ))}
      </Picker>

      {/* Contact */}
      <TextInput
        style={styles.input}
        placeholder="Contact Number"
        value={form.contact_number}
        onChangeText={(val) => handleChange("contact_number", val)}
        keyboardType="phone-pad"
      />

      {/* Guardian Info */}
      <Text style={styles.section}>Guardian Information</Text>
      <TextInput
        style={styles.input}
        placeholder="Guardian Full Name"
        value={form.guardian_full_name}
        onChangeText={(val) => handleChange("guardian_full_name", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="Guardian Relationship"
        value={form.guardian_relationship}
        onChangeText={(val) => handleChange("guardian_relationship", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="Guardian Contact"
        value={form.guardian_contact_number}
        onChangeText={(val) => handleChange("guardian_contact_number", val)}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Guardian Address"
        value={form.guardian_address}
        onChangeText={(val) => handleChange("guardian_address", val)}
      />

      {/* File Uploads */}
      <Text style={styles.section}>Required Documents</Text>
      {[
        { name: "barangay_indigency", label: "Barangay Indigency" },
        { name: "medical_certificate", label: "Medical Certificate" },
        { name: "picture_2x2", label: "2x2 Picture" },
        { name: "birth_certificate", label: "Birth Certificate" },
      ].map((doc) => (
        <TouchableOpacity
          key={doc.name}
          style={styles.uploadBtn}
          onPress={() => handleDocPick(doc.name)}
        >
          <Text>{documents[doc.name]?.name || `Upload ${doc.label}`}</Text>
        </TouchableOpacity>
      ))}

      {/* Submit */}
      <TouchableOpacity
        style={styles.submitBtn}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Register</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f9fafb" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  picker: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  label: { marginBottom: 6, fontWeight: "500" },
  section: { fontSize: 18, fontWeight: "bold", marginVertical: 12 },
  uploadBtn: {
    borderWidth: 1,
    borderColor: "#bbb",
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  submitBtn: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  submitText: { color: "#fff", fontWeight: "bold" },
  error: { color: "red", marginBottom: 12, textAlign: "center" },
});
