import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import api from "@/services/api"; // Ensure your API is correctly set up

export default function Register() {
  const [form, setForm] = useState({
    username: "", first_name: "", middle_name: "", last_name: "",
    email: "", password: "", contact_number: "", birthdate: "",
    address: "", sex: "", disability_type: "", barangay: "",
    blood_type: "", sss_number: "", philhealth_number: "",
    guardian_full_name: "", guardian_relationship: "",
    guardian_contact_number: "", guardian_address: "",
  });

  const [documents, setDocuments] = useState({
    barangay_indigency: null,
    medical_certificate: null,
    picture_2x2: null,
    birth_certificate: null,
    remarks: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const barangayOptions = ["Awang","Bagocboc","Barra","Bonbon","Cauyonan","Igpit","Limonda","Luyong Bonbon","Malanang","Nangcaon","Patag","Poblacion","Taboc","Tingalan"];

  const sexOptions = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Other", value: "other" },
  ];

  const handleChange = (name, value) =>
    setForm(prev => ({ ...prev, [name]: value }));

  const handleDocPick = async (name) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/png", "application/pdf"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) return;

      const file = result.assets[0];

      // Limit file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        Alert.alert("File Too Large", "Please select a file smaller than 5MB.");
        return;
      }

      setDocuments(prev => ({
        ...prev,
        [name]: {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || "application/octet-stream",
        },
      }));
    } catch (err) {
      console.error("Document picker error:", err);
      Alert.alert("Error", "Failed to pick document.");
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();

      // Append form fields
      Object.entries(form).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      // Append documents
      ["barangay_indigency", "medical_certificate", "picture_2x2", "birth_certificate"].forEach(key => {
        const file = documents[key];
        if (file && file.uri) {
          formData.append(key, {
            uri: file.uri,
            name: file.name,
            type: file.type,
          });
        }
      });

      // Optional remarks
      if (documents.remarks) formData.append("remarks", documents.remarks);

      // DEBUG: View FormData
      // NOTE: This is for debugging purposes only
      console.log("FormData preview:");
      for (let pair of formData._parts) {
        console.log(`${pair[0]}:`, pair[1]);
      }

      const res = await api.post("/member/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 15000,
      });

      Alert.alert("Success", res.data.message || "Registration successful!");

      // Reset form
      setForm({
        username: "", first_name: "", middle_name: "", last_name: "",
        email: "", password: "", contact_number: "", birthdate: "",
        address: "", sex: "", disability_type: "", barangay: "",
        blood_type: "", sss_number: "", philhealth_number: "",
        guardian_full_name: "", guardian_relationship: "",
        guardian_contact_number: "", guardian_address: "",
      });

      setDocuments({
        barangay_indigency: null,
        medical_certificate: null,
        picture_2x2: null,
        birth_certificate: null,
        remarks: "",
      });

    } catch (err) {
      console.error("Registration error:", err);
      if (err.message === "Network Error") {
        setError("Cannot connect to server. Check your internet or API URL.");
      } else {
        const errors = err.response?.data?.errors;
        setError(errors ? Object.values(errors).flat().join(", ") : err.response?.data?.message || "Registration failed.");
      }
    }

    setLoading(false);
  };

  return (
    <LinearGradient colors={["#f0f4ff", "#d9e0ff"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Member Registration</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Personal Info */}
          {["username", "email", "password", "contact_number", "first_name", "middle_name", "last_name"].map(field => (
            <TextInput
              key={field}
              style={styles.input}
              placeholder={field.replace("_", " ").toUpperCase()}
              value={form[field]}
              onChangeText={val => handleChange(field, val)}
              keyboardType={field === "email" ? "email-address" : field === "contact_number" ? "phone-pad" : "default"}
              secureTextEntry={field === "password"}
            />
          ))}

          {/* Birthdate */}
          <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
            <Text style={{ color: form.birthdate ? "#000" : "#888" }}>
              {form.birthdate || "Select Birthdate"}
            </Text>
          </TouchableOpacity>

          <DateTimePickerModal
            isVisible={showDatePicker}
            mode="date"
            onConfirm={date => {
              setShowDatePicker(false);
              handleChange("birthdate", date.toISOString().split("T")[0]);
            }}
            onCancel={() => setShowDatePicker(false)}
          />

          {/* Address */}
          <TextInput
            style={styles.input}
            placeholder="Complete Address"
            value={form.address}
            onChangeText={val => handleChange("address", val)}
          />

          {/* Pickers */}
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={form.barangay}
              onValueChange={val => handleChange("barangay", val)}
            >
              <Picker.Item label="Select Barangay" value="" />
              {barangayOptions.map(b => <Picker.Item key={b} label={b} value={b} />)}
            </Picker>
          </View>

          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={form.sex}
              onValueChange={val => handleChange("sex", val)}
            >
              <Picker.Item label="Select Sex" value="" />
              {sexOptions.map(s => <Picker.Item key={s.value} label={s.label} value={s.value} />)}
            </Picker>
          </View>

          {/* Other Fields */}
          {["disability_type", "blood_type", "sss_number", "philhealth_number", "guardian_full_name", "guardian_relationship", "guardian_contact_number", "guardian_address"].map(field => (
            <TextInput
              key={field}
              style={styles.input}
              placeholder={field.replace("_", " ").toUpperCase()}
              value={form[field]}
              onChangeText={val => handleChange(field, val)}
            />
          ))}

          {/* Document Uploads */}
          {["barangay_indigency", "medical_certificate", "picture_2x2", "birth_certificate"].map(doc => (
            <TouchableOpacity key={doc} style={styles.uploadBtn} onPress={() => handleDocPick(doc)}>
              <Text>{documents[doc]?.name || `Upload ${doc.replace("_", " ").toUpperCase()}`}</Text>
            </TouchableOpacity>
          ))}

          {/* Remarks */}
          <TextInput
            style={styles.input}
            placeholder="Optional Remarks"
            value={documents.remarks}
            onChangeText={val => setDocuments(prev => ({ ...prev, remarks: val }))}
          />

          {/* Submit */}
          <TouchableOpacity onPress={handleRegister} disabled={loading}>
            <LinearGradient colors={["#4f46e5", "#6366f1"]} style={styles.submitBtn}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Register Member</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: "center", padding: 16 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6, elevation: 5 },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#555", borderRadius: 12, padding: 16, marginBottom: 16, backgroundColor: "#fff", fontSize: 16 },
  dateInput: { borderWidth: 1, borderColor: "#555", borderRadius: 12, padding: 16, marginBottom: 16, justifyContent: "center" },
  pickerWrapper: { borderWidth: 1, borderColor: "#555", borderRadius: 12, marginBottom: 16, backgroundColor: "#fff" },
  uploadBtn: { borderWidth: 1, borderColor: "#555", borderRadius: 12, padding: 16, marginBottom: 16, alignItems: "center", backgroundColor: "#f5f5f5" },
  submitBtn: { borderRadius: 25, paddingVertical: 16, alignItems: "center", marginVertical: 16 },
  submitText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  error: { color: "red", textAlign: "center", marginBottom: 16, fontSize: 16 },
});
