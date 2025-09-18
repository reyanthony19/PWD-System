import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";

import { useRouter } from "@react-navigation/native"; // ✅ instead of expo-router
import { useCameraPermissions } from "expo-camera";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import api from "@/services/api";


export default function BenefitAttendance({ route }) {
  const { benefitId } = route.params; // ✅ react-navigation gives params like this
  const router = useRouter();

  const [permission, requestPermission] = useCameraPermissions();
  const [benefit, setBenefit] = useState(null);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  // sort state
  const [sortBy, setSortBy] = useState("nameAsc");

  const isPermissionGranted = Boolean(permission?.granted);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const benefitRes = await api.get(`/benefits/${benefitId}`);
        setBenefit(benefitRes.data);

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
      const interval = setInterval(fetchData, 5000);
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

  // -------------------------
  // Budget & Remaining logic
  // -------------------------
  const lockedCount = Number(benefit?.locked_member_count ?? 0);

  const perUnit =
    benefit?.type === "cash"
      ? Number(benefit?.budget_amount ?? benefit?.amount ?? 0)
      : Number(benefit?.budget_quantity ?? benefit?.amount ?? 0);

  // Count claimed members
  const claimedMembers = Array.isArray(claims)
    ? claims.filter((c) => c.claimed_at || c.status === "claimed").length
    : 0;

  const claimedFromClaims = claimedMembers;
  const recordsCountFromBenefit = Number(benefit?.records_count ?? 0);

  const effectiveClaimed = Math.min(
    Math.max(claimedFromClaims, recordsCountFromBenefit),
    lockedCount
  );

  const totalBudget = perUnit * lockedCount;
  let remaining = totalBudget - effectiveClaimed * perUnit;
  remaining = Math.max(0, remaining);

  // -------------------------
  // Sorting Logic
  // -------------------------
  const sortedClaims = [...claims].sort((a, b) => {
    const nameA = `${a.user?.member_profile?.last_name || ""} ${a.user?.member_profile?.first_name || ""}`.toLowerCase();
    const nameB = `${b.user?.member_profile?.last_name || ""} ${b.user?.member_profile?.first_name || ""}`.toLowerCase();

    const brgyA = a.user?.member_profile?.barangay || "";
    const brgyB = b.user?.member_profile?.barangay || "";

    switch (sortBy) {
      case "nameAsc":
        return nameA.localeCompare(nameB);
      case "nameDesc":
        return nameB.localeCompare(nameA);
      case "barangayAsc":
        return brgyA.localeCompare(brgyB);
      case "barangayDesc":
        return brgyB.localeCompare(brgyA);
      default:
        return 0;
    }
  });

  const sortOptions = [
    { label: "Name (A → Z)", value: "nameAsc" },
    { label: "Name (Z → A)", value: "nameDesc" },
    { label: "Barangay (A → Z)", value: "barangayAsc" },
    { label: "Barangay (Z → A)", value: "barangayDesc" },
  ];

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedClaims}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <View>
            {/* Header */}
            {benefit && (
              <View style={styles.card}>
                <View style={styles.headerRow}>
                  <Ionicons name="gift" size={32} color="#2563eb" />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.title}>{benefit.name}</Text>

                    <Text style={styles.subtitle}>
                      <MaterialCommunityIcons name="tag" size={16} color="#2563eb" />{" "}
                      {benefit.type}{" "}
                      {benefit.amount
                        ? `${Number(benefit.amount).toLocaleString()} ${
                            benefit.type === "cash" ? "₱" : benefit.unit || ""
                          }`
                        : ""}
                    </Text>

                    <Text style={styles.subtitle}>
                      <Ionicons name="cash" size={14} color="#2563eb" /> Budget:{" "}
                      {benefit.type === "cash"
                        ? `₱${Number(totalBudget).toLocaleString()}`
                        : `${totalBudget} ${benefit.unit || ""}`}
                    </Text>

                    {/* Amount per Member */}
                    {benefit.type === "cash" ? (
                      <Text style={styles.subtitle}>
                        <Ionicons name="cash" size={14} color="#2563eb" /> Amount
                        per Member: ₱{Number(perUnit).toLocaleString()}
                      </Text>
                    ) : (
                      <Text style={styles.subtitle}>
                        <Ionicons name="cube" size={14} color="#2563eb" /> Pack per
                        Member : {Number(perUnit).toLocaleString()}{" "}
                        {benefit.unit || ""}
                      </Text>
                    )}

                    <Text style={styles.subtitle}>
                      <Ionicons name="layers" size={14} color="#2563eb" /> Remaining:{" "}
                      {benefit.type === "cash"
                        ? `₱${Number(remaining).toLocaleString()}`
                        : `${remaining} ${benefit.unit || ""}`}
                    </Text>

                    <Text style={styles.subtitle}>
                      <Ionicons name="people" size={14} color="#2563eb" /> Target
                      Members: {benefit.locked_member_count || 0}
                    </Text>

                    {/* Claimed Members */}
                    <Text style={styles.subtitle}>
                      <Ionicons name="checkmark-done" size={14} color="#2563eb" />{" "}
                      Claimed Members: {claimedMembers}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* QR Scan Button */}
            <View style={{ marginVertical: 20 }}>
              <Pressable
                style={[
                  styles.scanButton,
                  (!isPermissionGranted || effectiveClaimed >= lockedCount) &&
                    styles.disabled,
                ]}
                disabled={!isPermissionGranted || effectiveClaimed >= lockedCount}
                onPress={() =>
                  router.push("BenefitScanner", { benefitId }) // ✅ react-navigation push
                }
              >
                <Ionicons
                  name="camera"
                  size={20}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.scanButtonText}>
                  {effectiveClaimed >= lockedCount
                    ? "All Members Claimed"
                    : isPermissionGranted
                    ? "Scan QR Code"
                    : "Grant Camera Permission"}
                </Text>
              </Pressable>
            </View>

            {/* Sort Options */}
            <View style={styles.sortRow}>
              <Text style={styles.sortLabel}>Sort By:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {sortOptions.map((opt) => (
                  <Pressable
                    key={opt.value}
                    style={[
                      styles.sortButton,
                      sortBy === opt.value && styles.sortButtonActive,
                    ]}
                    onPress={() => setSortBy(opt.value)}
                  >
                    <Text
                      style={[
                        styles.sortButtonText,
                        sortBy === opt.value && styles.sortButtonTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text
            style={{ textAlign: "center", marginTop: 20, color: "#6b7280" }}
          >
            No claimants yet.
          </Text>
        }
        renderItem={({ item }) => {
          const fullName = item.user?.member_profile
            ? `${item.user.member_profile.first_name || ""} ${
                item.user.member_profile.middle_name || ""
              } ${item.user.member_profile.last_name || ""}`.trim()
            : item.user?.name || "—";

          const scannedBy = item.scanned_by?.staff_profile
            ? `${item.scanned_by.staff_profile.first_name || ""} ${
                item.scanned_by.staff_profile.middle_name || ""
              } ${item.scanned_by.staff_profile.last_name || ""}`.trim()
            : item.scanned_by?.name || "—";

          return (
            <View style={styles.listItem}>
              <Text style={styles.name}>{fullName}</Text>
              <Text style={styles.details}>
                <Ionicons name="location" size={14} color="#6b7280" /> Barangay:{" "}
                {item.user?.member_profile?.barangay || "—"}
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
        contentContainerStyle={{ paddingBottom: 40 }}
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

  // sorting
  sortRow: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  sortLabel: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  sortButton: {
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  sortButtonActive: { backgroundColor: "#2563eb" },
  sortButtonText: { color: "#111827", fontSize: 14 },
  sortButtonTextActive: { color: "#fff" },

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
