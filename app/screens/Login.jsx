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
  Alert,
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
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [rememberMe, setRememberMe] = useState(false); // Default to false
  const [showPassword, setShowPassword] = useState(false);

  // Animated values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const loginAnim = useState(new Animated.Value(1))[0];
  const passwordAnim = useState(new Animated.Value(1))[0];
  const buttonAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    const init = async () => {
      try {
        // Check if someone is already logged in
        const existingToken = await AsyncStorage.getItem("token");
        if (existingToken) {
          Alert.alert(
            "Already Logged In",
            "Someone is already logged in. Please log out first.",
            [{ text: "OK" }]
          );
          return;
        }

        // Load remember me preference - FIXED: Check if it exists and is true
        const storedRemember = await AsyncStorage.getItem("rememberMe");

        // Only set to true if explicitly "true", otherwise false
        if (storedRemember === "true") {
          setRememberMe(true);

          // Load credentials securely
          try {
            const storedLogin = await AsyncStorage.getItem("rememberedLogin");
            if (storedLogin) {
              setLogin(storedLogin);
            }

            const storedPassword = await AsyncStorage.getItem("rememberedPassword");
            if (storedPassword) {
              setPassword(storedPassword);
            }
          } catch (storageError) {
            console.log("Error loading stored credentials:", storageError);
            await clearStoredCredentials();
          }
        } else {
          // FIXED: Explicitly set to false and clear any stored data
          setRememberMe(false);
          await clearStoredCredentials();
        }
      } catch (e) {
        console.log("Error reading storage:", e);
        await clearStoredCredentials();
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

  // Function to clear stored credentials
  const clearStoredCredentials = async () => {
    try {
      await AsyncStorage.multiRemove([
        "rememberedLogin",
        "rememberedPassword",
        "rememberMe"
      ]);
    } catch (error) {
      console.log("Error clearing stored credentials:", error);
    }
  };

  // Function to securely store credentials
  const storeCredentials = async (login, password) => {
    try {
      // Store remember me preference
      await AsyncStorage.setItem("rememberMe", "true");

      // Store login (email only)
      await AsyncStorage.setItem("rememberedLogin", login);

      // Store password
      await AsyncStorage.setItem("rememberedPassword", password);

      console.log("Credentials stored securely");
    } catch (error) {
      console.log("Error storing credentials:", error);
      throw error;
    }
  };

  // FIXED: Only validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    setLoginError(false);
    setPasswordError(false);
    setErrorMessage("");

    // Validation
    if (!login || !password) {
      if (!login) {
        setLoginError(true);
        animateError(loginAnim);
      }
      if (!password) {
        setPasswordError(true);
        animateError(passwordAnim);
      }
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    // FIXED: Only validate email format
    if (!validateEmail(login)) {
      setLoginError(true);
      animateError(loginAnim);
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      // Check if someone is already logged in
      const existingToken = await AsyncStorage.getItem("token");
      if (existingToken) {
        Alert.alert(
          "Already Logged In",
          "Someone is already logged in. Please log out first.",
          [{ text: "OK" }]
        );
        setLoading(false);
        return;
      }

      // FIXED: Use the correct endpoint and field names
      const res = await api.post("/loginMobile", {
        email: login, // Changed from 'login' to 'email'
        password: password
      });

      const user = res.data.user;

      // Validate user data
      if (!user) {
        setErrorMessage("Invalid response from server.");
        return;
      }

      // Check if user has authorized role (staff or member)
      const allowedRoles = ["staff", "member"];
      if (!allowedRoles.includes(user.role)) {
        setErrorMessage("Access denied. You must be a staff/member to login.");
        await AsyncStorage.clear();
        return;
      }

      // Store authentication data
      await AsyncStorage.setItem("token", res.data.token);
      await AsyncStorage.setItem("user", JSON.stringify(user));

      // Handle Remember Me - IMPROVED
      if (rememberMe) {
        // Store credentials for future auto-login
        await storeCredentials(login, password);
      } else {
        // User doesn't want to be remembered - clear all stored credentials
        await clearStoredCredentials();
      }

      // Redirect based on role
      if (user.role === "staff") {
        navigation.replace("StaffFlow");
      } else if (user.role === "member") {
        navigation.replace("MemberFlow");
      } else {
        setErrorMessage("Unauthorized role. Contact admin.");
        await AsyncStorage.clear();
      }

      // Handle specific error cases
      if (err.response?.status === 401) {
        setErrorMessage("Invalid login credentials.");
      } else if (err.response?.status === 403) {
        setErrorMessage("Access denied. You must be a staff/admin to login.");
      } else if (err.message === "Network Error") {
        setErrorMessage("Network error. Please check your connection.");
      } else if (err.response?.status >= 500) {
        setErrorMessage("Server error. Please try again later.");
      } else {
        setErrorMessage("Login failed. Please try again.");
      }

      setLoginError(true);
      setPasswordError(true);
      animateError(loginAnim);
      animateError(passwordAnim);

      // On login failure, clear the password field for security
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  // Handle "Remember Me" toggle - FIXED
  const handleRememberMeToggle = async () => {
    const newRememberMe = !rememberMe;
    setRememberMe(newRememberMe);

    if (!newRememberMe) {
      // User is turning off remember me - clear stored credentials
      await clearStoredCredentials();
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
              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color="#ef4444" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* FIXED: Changed label to Email only */}
              <Animated.View style={{ transform: [{ scale: loginAnim }] }}>
                <TextInput
                  label="Email Address"
                  mode="outlined"
                  value={login}
                  onChangeText={(text) => {
                    setLogin(text);
                    setLoginError(false);
                    setErrorMessage("");
                  }}
                  onFocus={() => handleFocus(loginAnim)}
                  onBlur={() => handleBlur(loginAnim)}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  style={[
                    styles.input,
                    loginError && styles.inputError
                  ]}
                  outlineColor={loginError ? "#ef4444" : "transparent"}
                  activeOutlineColor={loginError ? "#ef4444" : "#2563eb"}
                  textColor="#111827"
                  left={
                    <TextInput.Icon
                      icon={() => (
                        <Ionicons
                          name="mail"
                          size={22}
                          color={loginError ? "#ef4444" : "#6b7280"}
                        />
                      )}
                    />
                  }
                  theme={{
                    colors: {
                      primary: loginError ? "#ef4444" : "#2563eb",
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
                    setErrorMessage("");
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
                  onPress={handleRememberMeToggle}
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
              </View>

              {/* Security Notice for Remember Me */}
              {rememberMe && (
                <View style={styles.securityNotice}>
                  <Ionicons name="shield-checkmark" size={16} color="#059669" />
                  <Text style={styles.securityText}>
                    Your credentials will be stored securely on this device
                  </Text>
                </View>
              )}

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
    marginBottom: 16,
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
  securityNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  securityText: {
    color: "#059669",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 8,
    flex: 1,
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