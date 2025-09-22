import React, { useState } from "react";
import {
  Alert,
  TextInput,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import api from "@/services/api";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const animations = {
    username: useState(new Animated.Value(1))[0],
    email: useState(new Animated.Value(1))[0],
    password: useState(new Animated.Value(1))[0],
    confirmPassword: useState(new Animated.Value(1))[0],
    button: useState(new Animated.Value(1))[0],
  };

  const handleFocus = (fieldAnim) => {
    Animated.timing(fieldAnim, {
      toValue: 1.05,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleBlur = (fieldAnim) => {
    Animated.timing(fieldAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPressIn = () => {
    Animated.spring(animations.button, {
      toValue: 0.95,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.spring(animations.button, {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handleChange = (name, value) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  const handleRegister = async () => {
    if (form.password !== form.confirmPassword) {
      setError("Password and confirmation do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("username", form.username);
      formData.append("email", form.email);
      formData.append("password", form.password);

      const res = await api.post("/member/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000,
      });

      Alert.alert("Success", res.data.message || "Registration successful!");

      setForm({ username: "", email: "", password: "", confirmPassword: "" });
    } catch (err) {
      console.error("Registration error:", err);
      if (err.message === "Network Error") {
        setError("Cannot connect to server. Check your internet or API URL.");
      } else {
        const errors = err.response?.data?.errors;
        setError(
          errors
            ? Object.values(errors).flat().join(", ")
            : err.response?.data?.message || "Registration failed."
        );
      }
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient colors={["#6ee7b7", "#2563eb"]} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.title}>Create Account ✨</Text>
            <Text style={styles.subtitle}>Register to get started</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {Object.keys(form).map((field) => (
              <Animated.View
                key={field}
                style={{ transform: [{ scale: animations[field] }] }}
              >
                <TextInput
                  style={styles.input}
                  placeholder={
                    field === "confirmPassword"
                      ? "CONFIRM PASSWORD"
                      : field.toUpperCase()
                  }
                  value={form[field]}
                  onChangeText={(val) => handleChange(field, val)}
                  keyboardType={field === "email" ? "email-address" : "default"}
                  secureTextEntry={field.includes("password")}
                  onFocus={() => handleFocus(animations[field])}
                  onBlur={() => handleBlur(animations[field])}
                  left={
                    <TextInput.Icon
                      icon={() => (
                        <Ionicons
                          name={
                            field.includes("password")
                              ? "lock-closed"
                              : field === "email"
                              ? "mail"
                              : "person"
                          }
                          size={22}
                          color="#666"
                        />
                      )}
                    />
                  }
                />
              </Animated.View>
            ))}

            <TouchableOpacity
              onPress={handleRegister}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
              disabled={loading}
              style={{ marginTop: 10 }}
            >
              <Animated.View
                style={{ transform: [{ scale: animations.button }] }}
              >
                <LinearGradient
                  colors={["#6ee7b7", "#2563eb"]}
                  style={styles.submitBtn}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitText}>Register</Text>
                  )}
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: "center", padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
    color: "#111",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#444",
  },
  input: {
    marginBottom: 16,
    backgroundColor: "white",
    borderRadius: 12,
    fontSize: 16,
  },
  submitBtn: {
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
    marginVertical: 16,
  },
  submitText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  error: {
    color: "red",
    textAlign: "center",
    marginBottom: 14,
    fontSize: 15,
  },
});
