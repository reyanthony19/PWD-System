import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCameraPermissions } from "expo-camera";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import api from "../../services/api";

export default function BenefitAttendance() {
  const { benefitId } = useLocalSearchParams();
  const router = useRouter();

  const [permission, requestPermission] = useCameraPermissions();
  const [benefit, setBenefit] = useState(null);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  const isPermissionGranted = Boolean(permission?.granted);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch benefit details
        const benefitRes = await api.get(`/benefits/${benefitId}`);
        setBenefit(benefitRes.data);

        // Fetch claims and eager load relationships
        const claimsRes = await api.get(`/benefits/${benefitId}/claims`);
        const data = claimsRes.data?.data || claimsRes.data || [];
        setClaims(data);
      } catch (err) {
        console.error("Fetch error:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    if (benefitId) {
      fetchData();
      const interval = setInterval(fetchData, 5000); // auto-refresh
      return () => clearInterval(interval);
    }
  }, [benefitId]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 8, color: "#2563eb", fontWeight: "600" }}>
          Loading Claims...
        </Text>
      </View>
    );
  }

  // Calculate remaining budget or quantity
  const remainingAmount =
    benefit?.type === "cash" && benefit.budget_amount != null
      ? benefit.budget_amount - (benefit.records_count || 0) * (benefit.amount || 0)
      : null;

  const remainingQty =
    benefit?.type !== "cash" && benefit.budget_quantity != null
      ? benefit.budget_quantity - (benefit.records_count || 0)
      : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      {benefit && (
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Ionicons name="gift" size={32} color="#2563eb" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.title}>{benefit.name}</Text>
              <Text style={styles.subtitle}>
                <MaterialCommunityIcons name="tag" size={16} color="#2563eb" />{" "}
                {benefit.type} ·{" "}
                {benefit.amount
                  ? `${Number(benefit.amount).toLocaleString()} ${
                      benefit.type === "cash" ? "₱" : benefit.unit || ""
                    }`
                  : ""}
              </Text>
              {/* Budget & Remaining */}
              <Text style={styles.subtitle}>
                <Ionicons name="cash" size={14} color="#2563eb" /> Budget:{" "}
                {benefit.type === "cash"
                  ? benefit.budget_amount != null
                    ? `₱${Number(benefit.budget_amount).toLocaleString()}`
                    : "-"
                  : benefit.budget_quantity != null
                  ? `${benefit.budget_quantity} ${benefit.unit || ""}`
                  : "-"}
              </Text>
              <Text style={styles.subtitle}>
                <Ionicons name="layers" size={14} color="#2563eb" /> Remaining:{" "}
                {benefit.type === "cash"
                  ? remainingAmount != null
                    ? `₱${Number(remainingAmount).toLocaleString()}`
                    : "-"
                  : remainingQty != null
                  ? `${remainingQty} ${benefit.unit || ""}`
                  : "-"}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* QR Scan Button */}
      <View style={{ marginVertical: 20 }}>
        <Pressable
          style={[styles.scanButton, !isPermissionGranted && styles.disabled]}
          onPress={
            isPermissionGranted
              ? () =>
                  router.push(
                    `/staff/scanner/BenefitScanner?benefitId=${benefitId}`
                  )
              : requestPermission
          }
        >
          <Ionicons
            name="camera"
            size={20}
            color="#fff"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.scanButtonText}>
            {isPermissionGranted ? "Scan QR Code" : "Grant Camera Permission"}
          </Text>
        </Pressable>
      </View>

      {/* Claims List */}
      <FlatList
        data={claims}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20, color: "#6b7280" }}>
            No claimants yet.
          </Text>
        }
        renderItem={({ item }) => {
          const profile = item.member || {};
          const fullName = [profile.first_name, profile.middle_name, profile.last_name]
            .filter(Boolean)
            .join(" ")
            .trim() || "—";

          const scannedByProfile = item.scannedBy || {};
          const scannedBy = scannedByProfile.name || "—";

          return (
            <View style={styles.listItem}>
              <Text style={styles.name}>{fullName}</Text>
              <Text style={styles.details}>
                <Ionicons name="location" size={14} color="#6b7280" /> Barangay:{" "}
                {profile.barangay || "—"}
              </Text>
              <Text style={styles.details}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={14}
                  color="#6b7280"
                />{" "}
                Claimed:{" "}
                {item.claimed_at
                  ? new Date(item.claimed_at).toLocaleString([], {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })
                  : "—"}
              </Text>
              <Text style={styles.details}>
                <Ionicons name="person" size={14} color="#6b7280" /> Scanned By:{" "}
                {scannedBy}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 16 },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 10,
  },
  headerRow: { flexDirection: "row", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "bold", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6b7280", marginTop: 2 },
  scanButton: {
    flexDirection: "row",
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  disabled: { backgroundColor: "#9ca3af" },
  scanButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  listItem: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  name: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  details: { fontSize: 14, color: "#6b7280", marginTop: 2 },
});
