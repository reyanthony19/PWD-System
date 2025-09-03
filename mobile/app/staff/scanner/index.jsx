import React, { useState } from "react";
import { CameraView } from "expo-camera";
import { Stack } from "expo-router";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
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

export default function Index() {
  const [memberData, setMemberData] = useState(null);
  const [error, setError] = useState("");
  const [scanned, setScanned] = useState(false); // Track if already scanned

  const handleBarcodeScanned = async ({ data }) => {
    if (scanned) return; // Prevent multiple scans
    setScanned(true); // Mark as scanned
    try {
      setError("");
      const memberId = data.trim();

      const response = await api.get(`/scanMember`, { params: { id_number: memberId } });
      const dataResult = response.data;

      setMemberData(dataResult.member);
    } catch (err) {
      console.error("Error fetching member:", err.response?.data || err.message);
      setError("Could not retrieve member data.");
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
      <Stack.Screen options={{ title: "Overview", headerShown: false }} />
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
            <Text style={styles.nameText}>{fullName || memberData.username}</Text>
            <Text style={styles.idText}>ID: {profile.id_number || "-"}</Text>
            {!scanned && null}
          </>
        ) : (
          <Text style={styles.placeholderText}>Scan a member QR code</Text>
        )}

        {/* Button to scan again */}
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
