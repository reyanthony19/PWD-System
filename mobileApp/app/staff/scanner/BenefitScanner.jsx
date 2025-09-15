import React, { useState, useEffect } from "react";
import { CameraView } from "expo-camera";
import { Stack, useLocalSearchParams } from "expo-router";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  Alert,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native"; // 👈 important
import api from "../../../services/api"; // Axios instance

const { width, height } = Dimensions.get("window");
const cutoutSize = 250;
const borderWidth = 4;
const cornerLength = 30;

// Overlay with cutout for scanning
function Overlay() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={[styles.overlay, { height: (height - cutoutSize) / 2 }]} />
      <View style={{ flexDirection: "row" }}>
        <View style={[styles.overlay, { width: (width - cutoutSize) / 2 }]} />
        <View style={{ width: cutoutSize, height: cutoutSize }}>
          {/* Four corners */}
          <View
            style={[
              styles.corner,
              { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
            ]}
          />
          <View
            style={[
              styles.corner,
              { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
            ]}
          />
          <View
            style={[
              styles.corner,
              { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
            ]}
          />
          <View
            style={[
              styles.corner,
              { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
            ]}
          />
        </View>
        <View style={[styles.overlay, { width: (width - cutoutSize) / 2 }]} />
      </View>
      <View style={[styles.overlay, { flex: 1 }]} />
    </View>
  );
}

export default function BenefitScanner() {
  const { benefitId } = useLocalSearchParams();
  const [memberData, setMemberData] = useState(null);
  const [error, setError] = useState("");
  const [scanned, setScanned] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const isFocused = useIsFocused(); // 👈 check if screen is active

  // Animated error banner
  const [errorAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (error) {
      Animated.timing(errorAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(errorAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [error]);

  // Load logged-in user from storage
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to load user:", e);
      }
    };
    fetchUser();
  }, []);

  const handleBarcodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);
    setError("");

    const memberId = data.trim();

    try {
      // 1. Fetch member info
      const response = await api.get(`/scanMember`, {
        params: { id_number: memberId },
      });
      const member = response.data.member;
      setMemberData(member);

      // 2. Attempt to claim benefit
      await api.post(`/benefits/${benefitId}/claims`, {
        user_id: member.id,
      });

      Alert.alert("✅ Success", "Benefit claimed successfully!");
    } catch (err) {
      if (err.response) {
        if (err.response.status === 409) {
          setError(
            err.response.data.message ||
              "This member already claimed the benefit."
          );
        } else if (err.response.status === 403) {
          setError(
            err.response.data.message ||
              "Member is not eligible for this benefit."
          );
        } else {
          setError("Could not claim benefit. Please try again.");
        }
      } else {
        setError("Network error. Please try again.");
      }

      // Reset scanned state after error
      setTimeout(() => setScanned(false), 1500);
    }
  };

  const profile = memberData?.member_profile || {};
  const fullName = [profile.first_name, profile.middle_name, profile.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Benefit Scanner", headerShown: false }} />
      <StatusBar barStyle="light-content" />

      {/* 👇 Only render Camera when screen is focused */}
      {isFocused && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={handleBarcodeScanned}
        />
      )}

      <Overlay />

      <View style={styles.infoContainer}>
        {memberData ? (
          <>
            <Text style={styles.nameText}>
              {fullName || memberData.username}
            </Text>
            <Text style={styles.idText}>ID: {profile.id_number || "-"}</Text>

            {error ? (
              <Animated.View
                style={[
                  styles.errorBanner,
                  {
                    opacity: errorAnim,
                    transform: [
                      {
                        translateY: errorAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [10, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.errorBannerText}>⚠️ {error}</Text>
              </Animated.View>
            ) : null}
          </>
        ) : (
          <Text style={styles.placeholderText}>
            Scan a member QR code to claim benefit
          </Text>
        )}

        {scanned && (
          <TouchableOpacity
            style={styles.scanAgainButton}
            onPress={() => {
              setScanned(false);
              setMemberData(null);
              setError("");
            }}
          >
            <Text style={styles.scanAgainText}>Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  overlay: { backgroundColor: "rgba(0,0,0,0.5)" },
  corner: {
    position: "absolute",
    width: cornerLength,
    height: cornerLength,
    borderColor: "#fff",
    borderTopWidth: borderWidth,
    borderLeftWidth: borderWidth,
    borderRightWidth: borderWidth,
    borderBottomWidth: borderWidth,
  },
  infoContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  placeholderText: { color: "#fff", fontSize: 16 },
  nameText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  idText: { color: "#fff", fontSize: 16, marginTop: 4 },
  errorBanner: {
    backgroundColor: "rgba(255, 0, 0, 0.85)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    maxWidth: "90%",
    alignItems: "center",
  },
  errorBannerText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  scanAgainButton: {
    marginTop: 20,
    backgroundColor: "#00BFFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  scanAgainText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
