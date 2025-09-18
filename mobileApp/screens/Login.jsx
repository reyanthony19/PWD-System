import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Text, TextInput } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import api from "@/services/api";

export default function Login() {
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const storedRemember = await AsyncStorage.getItem("rememberMe");
        if (storedRemember === "true") {
          const storedEmail = await AsyncStorage.getItem("email");
          const storedPassword = await AsyncStorage.getItem("password");
          setEmail(storedEmail || "");
          setPassword(storedPassword || "");
          setRememberMe(true);
        }
      } catch (e) {
        console.log("Login init failed:", e);
      }
    };
    init();
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

      if (!user?.role) {
        setLoginError("Invalid user role.");
        return;
      }

      await AsyncStorage.setItem("token", res.data.token);
      await AsyncStorage.setItem("user", JSON.stringify(user));

      if (rememberMe) {
        await AsyncStorage.setItem("email", email);
        await AsyncStorage.setItem("password", password);
        await AsyncStorage.setItem("rememberMe", "true");
      } else {
        await AsyncStorage.multiRemove(["email", "password", "rememberMe"]);
      }

      if (user.role === "staff") {
        navigation.replace("StaffHome");
      } else if (user.role === "member") {
        navigation.replace("MemberHome");
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
      <LinearGradient
        colors={["#ff512f", "#dd2476"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bg}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text
              style={styles.title}
              accessible
              accessibilityRole="header"
            >
              Welcome Back 👋
            </Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>

            {loginError ? (
              <Text
                style={styles.errorText}
                accessibilityLiveRegion="polite"
              >
                {loginError}
              </Text>
            ) : null}

            {/* Email */}
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
              outlineColor={emailError ? "red" : "#aaa"}
              activeOutlineColor={emailError ? "red" : "#dd2476"}
              error={emailError}
              left={<TextInput.Icon icon={() => <Ionicons name="mail" size={22} color="#666" />} />}
              returnKeyType="next"
              blurOnSubmit={false}
              accessible
              accessibilityLabel="Email Address"
            />

            {/* Password */}
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
              outlineColor={passwordError ? "red" : "#aaa"}
              activeOutlineColor={passwordError ? "red" : "#dd2476"}
              error={passwordError}
              left={<TextInput.Icon icon={() => <Ionicons name="lock-closed" size={22} color="#666" />} />}
              returnKeyType="done"
              accessible
              accessibilityLabel="Password"
            />

            {/* Remember Me */}
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
              accessible
              accessibilityRole="checkbox"
              accessibilityLabel="Remember Me"
              accessibilityState={{ checked: rememberMe }}
            >
              <View
                style={[
                  styles.checkbox,
                  rememberMe && { backgroundColor: "#dd2476", borderColor: "#dd2476" },
                ]}
              />
              <Text style={styles.rememberText}>Remember Me</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={{ marginTop: 10 }}
              onPress={handleLogin}
              disabled={loading}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Sign In"
            >
              <LinearGradient
                colors={["#ff512f", "#dd2476"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientButton}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>SIGN IN</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Signup link */}
            <TouchableOpacity
              style={{ marginTop: 18 }}
              onPress={() => navigation.navigate("Register")}
              accessible
              accessibilityRole="link"
              accessibilityLabel="Sign up for a new account"
            >
              <Text style={styles.signupText}>
                Don’t have an account?{" "}
                <Text style={{ color: "#dd2476", fontWeight: "bold" }}>
                  Sign Up
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: "center", padding: 20 },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 6, color: "#111" },
  subtitle: { fontSize: 16, textAlign: "center", marginBottom: 22, color: "#444" },
  errorText: { color: "red", textAlign: "center", marginBottom: 14, fontSize: 16 },
  input: { marginBottom: 18, backgroundColor: "white", borderRadius: 12, fontSize: 18 },
  rememberRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  rememberText: { marginLeft: 8, color: "#333", fontSize: 16 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: "#777" },
  gradientButton: { borderRadius: 28, paddingVertical: 16, alignItems: "center", marginTop: 6 },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 18 },
  signupText: { textAlign: "center", color: "#333", fontSize: 15 },
});
