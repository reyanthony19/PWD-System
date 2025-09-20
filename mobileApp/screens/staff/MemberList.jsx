import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import api from "@/services/api"; // Assuming api service is already set up

export default function MemberList({ navigation }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("firstname-asc");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem("token");

        if (!token) {
          Alert.alert("Session Expired", "Please log in again.");
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
          return;
        }

        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await api.get("/users?role=member", { headers });
        setMembers(response.data || []);
      } catch (err) {
        setError("Failed to load members.");
        console.error("Error fetching members:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    const originalMembers = [...members];
    try {
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
      );
      await api.patch(`/user/${id}/status`, { status: newStatus });
    } catch (err) {
      console.error("Failed to update status", err);
      setMembers(originalMembers);
    }
  };

  const filteredMembers = members
    .filter((m) =>
      statusFilter === "all" ? true : m.status?.toLowerCase() === statusFilter.toLowerCase()
    )
    .filter((m) => {
      const term = searchTerm.toLowerCase();
      return (
        m.username?.toLowerCase().includes(term) ||
        m.email?.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      const profileA = a.member_profile || {};
      const profileB = b.member_profile || {};

      if (sortOption === "firstname-asc") {
        return (profileA.first_name || "").localeCompare(profileB.first_name || "");
      }
      if (sortOption === "firstname-desc") {
        return (profileB.first_name || "").localeCompare(profileA.first_name || "");
      }
      if (sortOption === "date-newest") {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      if (sortOption === "date-oldest") {
        return new Date(a.created_at) - new Date(b.created_at);
      }
      return 0;
    });

  const statusOptions = [
    { key: "all", label: "All", icon: <Ionicons name="ios-person" size={18} color="#2563eb" />, color: "bg-gray-100 text-gray-700" },
    { key: "approved", label: "Approved", icon: <Ionicons name="checkmark-circle" size={18} color="#34D399" />, color: "bg-green-100 text-green-700" },
    { key: "pending", label: "Pending", icon: <Ionicons name="clock" size={18} color="#F59E0B" />, color: "bg-yellow-100 text-yellow-700" },
    { key: "rejected", label: "Rejected", icon: <Ionicons name="close-circle" size={18} color="#EF4444" />, color: "bg-red-100 text-red-700" },
    { key: "inactive", label: "Inactive", icon: <Ionicons name="pause-circle" size={18} color="#F97316" />, color: "bg-orange-100 text-orange-700" },
    { key: "deceased", label: "Deceased", icon: <Ionicons name="skull" size={18} color="#9CA3AF" />, color: "bg-gray-200 text-gray-700" },
  ];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 10, color: "#2563eb" }}>Loading Members...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.title}>Member List</Text>
      <Text style={styles.subtitle}>Manage and review all registered members in the system.</Text>

      {/* Status Filter */}
      <View style={styles.filters}>
        {statusOptions.map(({ key, label, icon, color }) => (
          <TouchableOpacity
            key={key}
            onPress={() => setStatusFilter(key)}
            style={[styles.filterButton, statusFilter === key ? styles.selectedFilter : null]}
          >
            {icon} <Text>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <TextInput
        placeholder="🔍 Search by username or email"
        value={searchTerm}
        onChangeText={(text) => setSearchTerm(text)}
        style={styles.searchInput}
      />

      {/* Sorting */}
      <View style={styles.sorting}>
        <Text>Sort By:</Text>
        <TouchableOpacity onPress={() => setSortOption("firstname-asc")}>
          <Text style={styles.sortButton}>Name Ascending</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSortOption("firstname-desc")}>
          <Text style={styles.sortButton}>Name Descending</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSortOption("date-newest")}>
          <Text style={styles.sortButton}>Date Newest</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSortOption("date-oldest")}>
          <Text style={styles.sortButton}>Date Oldest</Text>
        </TouchableOpacity>
      </View>

      {/* Member List */}
      <FlatList
        data={filteredMembers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const profile = item.member_profile || {};
          const fullName = `${profile.first_name || ""} ${profile.middle_name || ""} ${profile.last_name || ""}`.trim();

          return (
            <View style={styles.memberCard}>
              <Text style={styles.memberName}>{fullName}</Text>
              <Text style={styles.memberInfo}>{item.email}</Text>
              <Text style={styles.memberInfo}>{profile.contact_number}</Text>
              <Text style={styles.memberInfo}>{profile.address}</Text>

              <TouchableOpacity
                style={styles.statusButton}
                onPress={() => handleStatusChange(item.id, item.status === "approved" ? "inactive" : "approved")}
              >
                <Text style={styles.statusText}>Change Status</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 16 },
  title: { fontSize: 24, fontWeight: "bold", color: "#2563eb", marginBottom: 16 },
  subtitle: { color: "#6b7280", marginBottom: 16 },
  filters: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  filterButton: { backgroundColor: "#e5e7eb", padding: 8, borderRadius: 8 },
  selectedFilter: { backgroundColor: "#2563eb", color: "#fff" },
  searchInput: { padding: 8, backgroundColor: "#fff", borderRadius: 8, marginBottom: 16 },
  sorting: { marginBottom: 16 },
  sortButton: { color: "#2563eb", marginBottom: 8 },
  memberCard: { padding: 16, backgroundColor: "#fff", marginBottom: 12, borderRadius: 8, elevation: 2 },
  memberName: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  memberInfo: { color: "#6b7280", marginBottom: 8 },
  statusButton: { backgroundColor: "#2563eb", padding: 8, borderRadius: 8 },
  statusText: { color: "#fff" },
});
