import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { TextInput, Button, Text, Card } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import api from "../services/api"; // 

export default function Login() {
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Error states
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const handleLogin = async () => {
    setEmailError(false);
    setPasswordError(false);

    // Validation
    if (!email || !password) {
      if (!email) setEmailError(true);
      if (!password) setPasswordError(true);
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/login", { email, password });
      const user = res.data.user;

      // Check role
      if (!user || (user.role !== "staff" && user.role !== "member")) {
        setEmailError(true);
        setPasswordError(true);
        return;
      }

      // Save token + user
      await AsyncStorage.setItem("token", res.data.token);
      await AsyncStorage.setItem("user", JSON.stringify(user));

      // Navigate by role
      if (user.role === "staff") {
        router.replace("/staff"); // app/staff/index.js
      } else if (user.role === "member") {
        router.replace("/member"); // app/home/index.js
      }
    } catch (err) {
      console.log("Login error:", err.response?.data || err.message);
      setEmailError(true);
      setPasswordError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Card style={styles.card}>
            <Card.Content>
              {/* Logo */}
              <View style={styles.logoWrapper}>
                <Image
                  source={require("../assets/logo.png")}
                  style={styles.logo}
                />
              </View>

              <Text style={styles.title}>Login</Text>

              {/* Email */}
              <TextInput
                label="Email"
                mode="outlined"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError(false);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                outlineColor={emailError ? "red" : "#0284c7"}
                activeOutlineColor={emailError ? "red" : "#0284c7"}
                error={emailError}
              />

              {/* Password */}
              <TextInput
                label="Password"
                mode="outlined"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError(false);
                }}
                secureTextEntry
                style={styles.input}
                outlineColor={passwordError ? "red" : "#0284c7"}
                activeOutlineColor={passwordError ? "red" : "#0284c7"}
                error={passwordError}
              />

              {/* Submit button */}
              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles.button}
                buttonColor="#0284c7"
              >
                {loading ? "Logging in..." : "Sign In"}
              </Button>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#f1f5f9",
  },
  container: {
    flex: 1,
    justifyContent: "center",
  },
  card: {
    borderRadius: 16,
    padding: 20,
    elevation: 4,
  },
  logoWrapper: {
    alignItems: "center",
    marginBottom: 12,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginBottom: 16,
    borderRadius: 8,
  },
});
