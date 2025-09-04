import React, { useState } from "react";
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
} from "react-native";
import api from "../../../services/api"; // Axios instance

const { width, height } = Dimensions.get("window");
const cutoutSize = 250;
const borderWidth = 4;
const cornerLength = 30;

// Modern QR Scanner Overlay
function Overlay() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={[styles.overlay, { height: (height - cutoutSize) / 2 }]} />
      <View style={{ flexDirection: "row" }}>
        <View style={[styles.overlay, { width: (width - cutoutSize) / 2 }]} />
        <View style={{ width: cutoutSize, height: cutoutSize }}>
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

export default function Scanner() {
  const { eventId } = useLocalSearchParams(); // <-- get eventId from route params
  const [memberData, setMemberData] = useState(null);
  const [error, setError] = useState("");
  const [scanned, setScanned] = useState(false);

  const handleBarcodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);

    try {
      setError("");
      const memberId = data.trim();

      // 1. Get member info by QR id_number
      const response = await api.get(`/scanMember`, {
        params: { id_number: memberId },
      });
      const dataResult = response.data;
      setMemberData(dataResult.member);

      // 2. Save attendance (proper route)
      await api.post(`/events/${eventId}/attendances`, {
        user_id: dataResult.member.id,
      });

      Alert.alert("✅ Success", "Attendance recorded!");
    } catch (err) {
      console.error("Error:", err.response?.data || err.message);
      setError("Could not record attendance.");
      setMemberData(null);
    }
  };

  const profile = memberData?.member_profile || {};
  const fullName = [profile.first_name, profile.middle_name, profile.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Scanner", headerShown: false }} />
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={handleBarcodeScanned}
      />
      <Overlay />
      <StatusBar barStyle="light-content" />

      <View style={styles.infoContainer}>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : memberData ? (
          <>
            <Text style={styles.nameText}>
              {fullName || memberData.username}
            </Text>
            <Text style={styles.idText}>
              ID: {profile.id_number || "-"}
            </Text>
          </>
        ) : (
          <Text style={styles.placeholderText}>Scan a member QR code</Text>
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
  container: { flex: 1 },
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
  errorText: { color: "red", fontSize: 16 },
  scanAgainButton: {
    marginTop: 20,
    backgroundColor: "#00BFFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  scanAgainText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
