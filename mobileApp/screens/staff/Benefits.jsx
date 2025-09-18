import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { Text, Card, Avatar } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "@/services/api";


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
        console.error("Benefits fetch error:", err.response?.data || err.message);
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
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 10, color: "#2563eb" }}>Loading Benefits...</Text>
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

  const typeIcon = (type) => {
    switch (type.toLowerCase()) {
      case "cash":
        return "cash";
      case "relief":
        return "gift";
      default:
        return "information";
    }
  };

  const renderBenefit = ({ item }) => {
    // ✅ Calculate total budget
    let totalBudget = 0;
    if (item.type.toLowerCase() === "cash") {
      totalBudget = (item.budget_amount || 0) * (item.locked_member_count || 0);
    } else {
      totalBudget = (item.budget_quantity || 0) * (item.locked_member_count || 0);
    }

    // ✅ Calculate remaining
    let remaining = 0;
    if (item.type.toLowerCase() === "cash") {
      remaining = totalBudget - (item.records_count || 0) * (item.budget_amount || 0);
    } else {
      remaining = totalBudget - (item.records_count || 0) * (item.budget_quantity || 0);
    }

    return (
      <Card
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: "/staff/BenefitAttendance", // ✅ route stays the same
            params: { benefitId: item.id, title: item.name },
          })
        }
      >
        <Card.Title
          title={item.name}
          titleStyle={styles.cardTitle}
          subtitle={`📌 Type: ${item.type}`}
          left={(props) => (
            <Avatar.Icon
              {...props}
              icon={typeIcon(item.type)}
              style={{ backgroundColor: "#2563eb" }}
            />
          )}
        />
        <Card.Content>
          <Text style={styles.detail}>
            💰 Budget:{" "}
            {item.type.toLowerCase() === "cash"
              ? `₱${Number(totalBudget).toLocaleString()}`
              : `${totalBudget} ${item.unit || ""}`}
          </Text>
          <Text style={styles.detail}>
            🔄 Remaining:{" "}
            {item.type.toLowerCase() === "cash"
              ? `₱${Number(remaining).toLocaleString()}`
              : `${remaining} ${item.unit || ""}`}
          </Text>
          <Text style={styles.detail}>👥 Target Members: {item.locked_member_count || 0}</Text>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {benefits.length === 0 ? (
        <Text style={styles.empty}>No benefits available</Text>
      ) : (
        <FlatList
          data={benefits}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBenefit}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { textAlign: "center", fontSize: 16, color: "#6b7280", marginTop: 20 },
  card: { borderRadius: 16, marginBottom: 16, backgroundColor: "#fff", elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  detail: { fontSize: 14, marginTop: 4, color: "#374151" },
});
