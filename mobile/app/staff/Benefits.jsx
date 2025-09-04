import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import api from "../../services/api";

export default function Benefits() {
  const router = useRouter();
  const [benefits, setBenefits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBenefits = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await api.get("/benefits-lists", { headers });
        setBenefits(res.data.data || res.data || []);
      } catch (err) {
        console.error(
          "Benefits fetch error:",
          err.response?.data || err.message
        );
        setError("Failed to load benefits.");
      } finally {
        setLoading(false);
      }
    };

    fetchBenefits();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text>Loading Benefits...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {benefits.length === 0 ? (
        <Text style={styles.empty}>No benefits available</Text>
      ) : (
        <FlatList
          data={benefits}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const remainingAmount =
              item.type === "cash" && item.budget_amount != null
                ? item.budget_amount - (item.records_count || 0) * (item.amount || 0)
                : null;

            const remainingQty =
              item.type !== "cash" && item.budget_quantity != null
                ? item.budget_quantity - (item.records_count || 0)
                : null;

            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  router.push({
                    pathname: "/staff/BenefitAttendance",
                    params: { benefitId: item.id, title: item.name }, // ✅ updated param
                  })
                }
              >
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.subtitle}>📌 Type: {item.type}</Text>

                {/* Budget */}
                <Text style={styles.subtitle}>
                  💰 Budget:{" "}
                  {item.type === "cash"
                    ? item.budget_amount
                      ? `₱${Number(item.budget_amount).toLocaleString()}`
                      : "-"
                    : item.budget_quantity
                    ? `${item.budget_quantity} ${item.unit || ""}`
                    : "-"}
                </Text>

                {/* Remaining */}
                <Text style={styles.subtitle}>
                  🔄 Remaining:{" "}
                  {item.type === "cash"
                    ? remainingAmount != null
                      ? `₱${Number(remainingAmount).toLocaleString()}`
                      : "-"
                    : remainingQty != null
                    ? `${remainingQty} ${item.unit || ""}`
                    : "-"}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f9fafb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { textAlign: "center", fontSize: 16, color: "#6b7280" },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#6b7280", marginTop: 2 },
});
