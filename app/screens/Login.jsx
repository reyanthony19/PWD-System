import React, { useState, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import { Text, TextInput } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import api from "@/services/api";

const { width, height } = Dimensions.get("window");

export default function Login() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animated values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const emailAnim = useState(new Animated.Value(1))[0];
  const passwordAnim = useState(new Animated.Value(1))[0];
  const buttonAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    const init = async () => {
      try {
        const storedRemember = await AsyncStorage.getItem("rememberMe");
        const storedEmail = await AsyncStorage.getItem("email");
        const storedPassword = await AsyncStorage.getItem("password");

        if (storedRemember === "true") {
          setEmail(storedEmail || "");
          setPassword(storedPassword || "");
          setRememberMe(true);
        } else {
          setRememberMe(false);
        }
      } catch (e) {
        console.log("Error reading AsyncStorage:", e);
      }
    };
    init();

    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    setEmailError(false);
    setPasswordError(false);
    setLoginError("");

    if (!email || !password) {
      if (!email) {
        setEmailError(true);
        animateError(emailAnim);
      }
      if (!password) {
        setPasswordError(true);
        animateError(passwordAnim);
      }
      setLoginError("Please fill in all required fields.");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError(true);
      animateError(emailAnim);
      setLoginError("Please enter a valid email.");
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
        navigation.replace("StaffFlow");
      } else if (user.role === "member") {
        navigation.replace("MemberFlow");
      } else {
        setLoginError("Unauthorized role. Contact admin.");
        await AsyncStorage.clear();
      }
    } catch (err) {
      setLoginError("Invalid email or password.");
      setEmailError(true);
      setPasswordError(true);
      animateError(emailAnim);
      animateError(passwordAnim);
    } finally {
      setLoading(false);
    }
  };

  const animateError = (anim) => {
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 1.02,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleFocus = (fieldAnim) => {
    Animated.timing(fieldAnim, {
      toValue: 1.02,
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
    Animated.spring(buttonAnim, {
      toValue: 0.95,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.spring(buttonAnim, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient 
        colors={["#667eea", "#764ba2", "#667eea"]} 
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Header Section */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={["#fff", "#f0f9ff"]}
                  style={styles.logo}
                >
                  <Ionicons name="people" size={32} color="#2563eb" />
                </LinearGradient>
              </View>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to your account</Text>
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
              {loginError ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color="#ef4444" />
                  <Text style={styles.errorText}>{loginError}</Text>
                </View>
              ) : null}

              {/* Email Input */}
              <Animated.View style={{ transform: [{ scale: emailAnim }] }}>
                <TextInput
                  label="Email Address"
                  mode="outlined"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setEmailError(false);
                    setLoginError("");
                  }}
                  onFocus={() => handleFocus(emailAnim)}
                  onBlur={() => handleBlur(emailAnim)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  style={[
                    styles.input,
                    emailError && styles.inputError
                  ]}
                  outlineColor={emailError ? "#ef4444" : "transparent"}
                  activeOutlineColor={emailError ? "#ef4444" : "#2563eb"}
                  textColor="#111827"
                  left={
                    <TextInput.Icon 
                      icon={() => (
                        <Ionicons 
                          name="mail" 
                          size={22} 
                          color={emailError ? "#ef4444" : "#6b7280"} 
                        />
                      )} 
                    />
                  }
                  theme={{
                    colors: {
                      primary: emailError ? "#ef4444" : "#2563eb",
                      background: "transparent",
                    },
                    roundness: 12,
                  }}
                />
              </Animated.View>

              {/* Password Input */}
              <Animated.View style={{ transform: [{ scale: passwordAnim }] }}>
                <TextInput
                  label="Password"
                  mode="outlined"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setPasswordError(false);
                    setLoginError("");
                  }}
                  secureTextEntry={!showPassword}
                  onFocus={() => handleFocus(passwordAnim)}
                  onBlur={() => handleBlur(passwordAnim)}
                  style={[
                    styles.input,
                    passwordError && styles.inputError
                  ]}
                  outlineColor={passwordError ? "#ef4444" : "transparent"}
                  activeOutlineColor={passwordError ? "#ef4444" : "#2563eb"}
                  textColor="#111827"
                  left={
                    <TextInput.Icon 
                      icon={() => (
                        <Ionicons 
                          name="lock-closed" 
                          size={22} 
                          color={passwordError ? "#ef4444" : "#6b7280"} 
                        />
                      )} 
                    />
                  }
                  right={
                    <TextInput.Icon 
                      icon={() => (
                        <Ionicons 
                          name={showPassword ? "eye-off" : "eye"} 
                          size={22} 
                          color="#6b7280"
                          onPress={() => setShowPassword(!showPassword)}
                        />
                      )} 
                    />
                  }
                  theme={{
                    colors: {
                      primary: passwordError ? "#ef4444" : "#2563eb",
                      background: "transparent",
                    },
                    roundness: 12,
                  }}
                />
              </Animated.View>

              {/* Remember Me & Forgot Password */}
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.rememberRow}
                  onPress={() => setRememberMe(!rememberMe)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: rememberMe }}
                >
                  <View style={[
                    styles.checkbox, 
                    rememberMe && styles.checkboxChecked
                  ]}>
                    {rememberMe && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.rememberText}>Remember me</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                onPress={handleLogin}
                onPressIn={handleButtonPressIn}
                onPressOut={handleButtonPressOut}
                disabled={loading}
                activeOpacity={0.9}
              >
                <Animated.View style={{ transform: [{ scale: buttonAnim }] }}>
                  <LinearGradient 
                    colors={["#2563eb", "#1d4ed8"]} 
                    style={styles.loginButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Text style={styles.loginButtonText}>Sign In</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </Animated.View>
              </TouchableOpacity>

              {/* Sign Up Link */}
              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>
                  Don't have an account?{" "}
                  <Text 
                    style={styles.signupLink}
                    onPress={() => navigation.navigate("Register")}
                  >
                    Sign up now
                  </Text>
                </Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                By continuing, you agree to our Terms and Privacy Policy
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: "center",
    minHeight: height,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.8)",
  },
  formContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
    backdropFilter: "blur(10px)",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: {
    color: "#ef4444",
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    fontSize: 16,
    height: 56,
  },
  inputError: {
    backgroundColor: "#fef2f2",
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#d1d5db",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  rememberText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "500",
  },
  forgotText: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "600",
  },
  loginButton: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    marginRight: 8,
  },
  signupContainer: {
    alignItems: "center",
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  signupText: {
    color: "#6b7280",
    fontSize: 15,
    textAlign: "center",
  },
  signupLink: {
    color: "#2563eb",
    fontWeight: "bold",
  },
  footer: {
    alignItems: "center",
    marginTop: 32,
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    textAlign: "center",
  },
});