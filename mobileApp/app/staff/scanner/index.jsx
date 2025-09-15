import { useState } from "react";
import { CameraView } from "expo-camera";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "../../../services/api";

const { width, height } = Dimensions.get("window");
const cutoutSize = 250;
const borderWidth = 3;
const cornerLength = 28;

function Overlay() {
  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Dimmed outside area */}
      <View style={[styles.overlay, { height: (height - cutoutSize) / 2 }]} />
      <View style={{ flexDirection: "row" }}>
        <View style={[styles.overlay, { width: (width - cutoutSize) / 2 }]} />
        <View style={{ width: cutoutSize, height: cutoutSize }}>
          {/* four scanning corners */}
          <View
            style={[styles.corner, { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 }]}
          />
          <View
            style={[styles.corner, { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 }]}
          />
          <View
            style={[styles.corner, { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 }]}
          />
          <View
            style={[styles.corner, { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 }]}
          />
        </View>
        <View style={[styles.overlay, { width: (width - cutoutSize) / 2 }]} />
      </View>
      <View style={[styles.overlay, { flex: 1 }]} />
    </View>
  );
}

export default function Scanner() {
  const { eventId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [memberData, setMemberData] = useState(null);
  const [error, setError] = useState("");
  const [scanned, setScanned] = useState(false);
  const isFocused = useIsFocused();

  const handleBarcodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);
    setError("");

    const memberId = data.trim();

    try {
      const response = await api.get(`/scanMember`, { params: { id_number: memberId } });
      const dataResult = response.data;
      setMemberData(dataResult.member);

      await api.post(`/events/${eventId}/attendances`, {
        user_id: dataResult.member.id,
      });

      Alert.alert("✅ Success", "Attendance recorded!");
    } catch (err) {
      console.error("Error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Member not eligible or network error.");
      setMemberData(null);
    }
  };

  const profile = memberData?.member_profile || {};
  const fullName = [profile.first_name, profile.middle_name, profile.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      {isFocused && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={handleBarcodeScanned}
        />
      )}

      <Overlay />

      {/* Modern back button */}
      <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { top: insets.top + 10 }]}>
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </TouchableOpacity>

      {/* Floating info container */}
      <View
        style={[
          styles.infoContainer,
          { paddingBottom: insets.bottom + 80 }, // leave room above modern tab bar
        ]}
      >
        <View style={styles.infoCard}>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : memberData ? (
            <>
              <Text style={styles.nameText}>{fullName || memberData.username}</Text>
              <Text style={styles.idText}>ID: {profile.id_number || "-"}</Text>
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },

  overlay: { backgroundColor: "rgba(0,0,0,0.55)" },

  corner: {
    position: "absolute",
    width: cornerLength,
    height: cornerLength,
    borderColor: "#4ade80", // lime-400 modern accent
    borderTopWidth: borderWidth,
    borderLeftWidth: borderWidth,
    borderRightWidth: borderWidth,
    borderBottomWidth: borderWidth,
    borderRadius: 4,
  },

  infoContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  infoCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
    width: width * 0.85,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  placeholderText: { color: "#64748b", fontSize: 16 },
  nameText: { color: "#0f172a", fontSize: 20, fontWeight: "700" },
  idText: { color: "#334155", fontSize: 15, marginTop: 4 },
  errorText: { color: "#dc2626", fontSize: 16, fontWeight: "600" },

  scanAgainButton: {
    marginTop: 18,
    backgroundColor: "#2563eb",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  scanAgainText: { color: "#fff", fontSize: 15, fontWeight: "600" },

  backButton: {
    position: "absolute",
    left: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 50,
    padding: 10,
    zIndex: 10,
  },
});
