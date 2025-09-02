import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import api from "../api/api";

export default function MemberRegistration({ navigation }) {
  const [form, setForm] = useState({
    username: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    role: "member",
    password: "",
    contact_number: "",
    birthdate: "1999-01-01",
    address: "",
    sex: "",
    disability_type: "",
    barangay: "",
    blood_type: "",
    sss_number: "",
    philhealth_number: "",
    guardian_full_name: "",
    guardian_relationship: "",
    guardian_contact_number: "",
    guardian_address: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      await api.post("/member/register", form);
      Alert.alert("Success", "Registration successful 🎉", [
        { text: "OK", onPress: () => navigation.navigate("Login") },
      ]);
    } catch (error) {
      console.log(error.response?.data || error.message);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const barangayOptions = [
    "Awang",
    "Bagocboc",
    "Barra",
    "Bonbon",
    "Cauyonan",
    "Igpit",
    "Limonda",
    "Luyong Bonbon",
    "Malanang",
    "Nangcaon",
    "Patag",
    "Poblacion",
    "Taboc",
    "Tingalan",
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Member Registration</Text>

      {/* Username */}
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={form.username}
        onChangeText={(value) => handleChange("username", value)}
      />

      {/* Email */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={form.email}
        onChangeText={(value) => handleChange("email", value)}
      />

      {/* Password */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={form.password}
        onChangeText={(value) => handleChange("password", value)}
      />

      {/* Contact Number */}
      <TextInput
        style={styles.input}
        placeholder="Contact Number"
        keyboardType="numeric"
        maxLength={11}
        value={form.contact_number}
        onChangeText={(value) => handleChange("contact_number", value)}
      />

      {/* Name Fields */}
      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={form.first_name}
        onChangeText={(value) => handleChange("first_name", value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Middle Name"
        value={form.middle_name}
        onChangeText={(value) => handleChange("middle_name", value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={form.last_name}
        onChangeText={(value) => handleChange("last_name", value)}
      />

      {/* Birthdate */}
      <TextInput
        style={styles.input}
        placeholder="Birthdate (YYYY-MM-DD)"
        value={form.birthdate}
        onChangeText={(value) => handleChange("birthdate", value)}
      />

      {/* Address */}
      <TextInput
        style={styles.input}
        placeholder="Complete Address"
        value={form.address}
        onChangeText={(value) => handleChange("address", value)}
      />

      {/* Barangay Picker */}
      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Barangay</Text>
        <Picker
          selectedValue={form.barangay}
          onValueChange={(value) => handleChange("barangay", value)}
          style={styles.picker}
        >
          <Picker.Item label="Select Barangay" value="" />
          {barangayOptions.map((barangay) => (
            <Picker.Item key={barangay} label={barangay} value={barangay} />
          ))}
        </Picker>
      </View>

      {/* Sex Picker */}
      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Sex</Text>
        <Picker
          selectedValue={form.sex}
          onValueChange={(value) => handleChange("sex", value)}
          style={styles.picker}
        >
          <Picker.Item label="Select Sex" value="" />
          <Picker.Item label="Male" value="male" />
          <Picker.Item label="Female" value="female" />
          <Picker.Item label="Other" value="other" />
        </Picker>
      </View>

      {/* Disability & Blood Type */}
      <TextInput
        style={styles.input}
        placeholder="Disability Type"
        value={form.disability_type}
        onChangeText={(value) => handleChange("disability_type", value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Blood Type"
        value={form.blood_type}
        onChangeText={(value) => handleChange("blood_type", value)}
      />

      {/* SSS & PhilHealth */}
      <TextInput
        style={styles.input}
        placeholder="SSS Number"
        value={form.sss_number}
        onChangeText={(value) => handleChange("sss_number", value)}
      />
      <TextInput
        style={styles.input}
        placeholder="PhilHealth Number"
        value={form.philhealth_number}
        onChangeText={(value) => handleChange("philhealth_number", value)}
      />

      {/* Guardian Info */}
      <Text style={styles.sectionTitle}>Guardian Information</Text>
      <TextInput
        style={styles.input}
        placeholder="Guardian Full Name"
        value={form.guardian_full_name}
        onChangeText={(value) => handleChange("guardian_full_name", value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Relationship"
        value={form.guardian_relationship}
        onChangeText={(value) => handleChange("guardian_relationship", value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Guardian Contact Number"
        keyboardType="numeric"
        maxLength={11}
        value={form.guardian_contact_number}
        onChangeText={(value) => handleChange("guardian_contact_number", value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Guardian Address"
        value={form.guardian_address}
        onChangeText={(value) => handleChange("guardian_address", value)}
      />

      {/* Submit */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Register Member</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  pickerContainer: {
    marginBottom: 15,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  label: {
    marginLeft: 10,
    marginTop: 5,
    fontWeight: "bold",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
});
