import AsyncStorage from "@react-native-async-storage/async-storage";
import {useRouter} from "expo-router";
import { useEffect, useState } from "react";
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {Text, TextInput} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { TouchableOpacity } from "react-native";
import api from "../../services/api";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [loginError, setLoginError] = useState("");

  // 🔑 Auto-login check
  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const userStr = await AsyncStorage.getItem("user");

        if (token && userStr) {
          const user = JSON.parse(userStr);

          if (user?.role === "staff") {
            router.replace("/staff/");
          } else if (user?.role === "member") {
            router.replace("/member/");
          } else {
            await AsyncStorage.clear();
          }
        }
      } catch (e) {
        console.log("Session check failed:", e);
      }
    };
    checkSession();
  }, []);

  const handleLogin = async () => {
    setEmailError(false);
    setPasswordError(false);
    setLoginError("");

    if (!email || !password) {
      if (!email) setEmailError(true);
      if (!password) setPasswordError(true);
      setLoginError("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/login", { email, password });
      const user = res.data.user;

      if (!user || !user.role) {
        setLoginError("Invalid user role.");
        return;
      }

      await AsyncStorage.setItem("token", res.data.token);
      await AsyncStorage.setItem("user", JSON.stringify(user));

      if (user.role === "staff") {
        router.replace("/staff");
      } else if (user.role === "member") {
        router.replace("/member");
      } else {
        setLoginError("Unauthorized role. Contact admin.");
        await AsyncStorage.clear();
      }
    } catch (err) {
      console.log("Login error:", err.response?.data || err.message);
      setLoginError("Invalid email or password.");
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
      <ImageBackground
        source={require("../../assets/images/logo.png")} // 🌄 background image
        style={styles.bg}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>

            {loginError ? (
              <Text style={styles.errorText}>{loginError}</Text>
            ) : null}

            <TextInput
              label="Email"
              mode="outlined"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError(false);
                setLoginError("");
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              outlineColor={emailError ? "red" : "#ccc"}
              activeOutlineColor={emailError ? "red" : "#0284c7"}
              error={emailError}
            />

            <TextInput
              label="Password"
              mode="outlined"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError(false);
                setLoginError("");
              }}
              secureTextEntry
              style={styles.input}
              outlineColor={passwordError ? "red" : "#ccc"}
              activeOutlineColor={passwordError ? "red" : "#0284c7"}
              error={passwordError}
            />

            {/* Gradient Button */}
            <TouchableOpacity
              style={{ marginTop: 16 }}
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={["#ff512f", "#dd2476"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientButton}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Logging in..." : "SIGN IN"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    resizeMode: "cover",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
    color: "#111",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    color: "#555",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
  input: {
    marginBottom: 14,
    backgroundColor: "white",
    borderRadius: 8,
  },
  gradientButton: {
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
