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
    { key: "all", label: "All", icon: "ios-person", color: "#2563eb" },
    { key: "approved", label: "Approved", icon: "checkmark-circle", color: "#34D399" },
    { key: "pending", label: "Pending", icon: "clock", color: "#F59E0B" },
    { key: "rejected", label: "Rejected", icon: "close-circle", color: "#EF4444" },
    { key: "inactive", label: "Inactive", icon: "pause-circle", color: "#F97316" },
    { key: "deceased", label: "Deceased", icon: "skull", color: "#9CA3AF" },
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
            style={[styles.filterButton, statusFilter === key && styles.selectedFilter]}
          >
            <Ionicons name={icon} size={18} color={statusFilter === key ? "#fff" : color} />
            <Text style={[styles.filterText, statusFilter === key && styles.selectedFilterText]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          placeholder="Search by username or email"
          value={searchTerm}
          onChangeText={(text) => setSearchTerm(text)}
          style={styles.searchInput}
        />
      </View>

      {/* Sorting */}
      <View style={styles.sorting}>
        <Text style={styles.sortLabel}>Sort By:</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity 
            onPress={() => setSortOption("firstname-asc")}
            style={[styles.sortButton, sortOption === "firstname-asc" && styles.activeSortButton]}
          >
            <Text style={[styles.sortButtonText, sortOption === "firstname-asc" && styles.activeSortButtonText]}>
              Name Asc
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setSortOption("firstname-desc")}
            style={[styles.sortButton, sortOption === "firstname-desc" && styles.activeSortButton]}
          >
            <Text style={[styles.sortButtonText, sortOption === "firstname-desc" && styles.activeSortButtonText]}>
              Name Desc
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setSortOption("date-newest")}
            style={[styles.sortButton, sortOption === "date-newest" && styles.activeSortButton]}
          >
            <Text style={[styles.sortButtonText, sortOption === "date-newest" && styles.activeSortButtonText]}>
              Newest
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setSortOption("date-oldest")}
            style={[styles.sortButton, sortOption === "date-oldest" && styles.activeSortButton]}
          >
            <Text style={[styles.sortButtonText, sortOption === "date-oldest" && styles.activeSortButtonText]}>
              Oldest
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Error Message */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Member List */}
      <FlatList
        data={filteredMembers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const profile = item.member_profile || {};
          const fullName = `${profile.first_name || ""} ${profile.middle_name || ""} ${profile.last_name || ""}`.trim();

          return (
            <View style={styles.memberCard}>
              <Text style={styles.memberName}>{fullName || "Unknown Member"}</Text>
              <Text style={styles.memberInfo}>{item.email}</Text>
              <Text style={styles.memberInfo}>{profile.contact_number || "No contact number"}</Text>
              <Text style={styles.memberInfo}>{profile.address || "No address"}</Text>
              
              <View style={styles.statusContainer}>
                <Text style={[styles.statusText, styles[`status${item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}`]]}>
                  Status: {item.status || "unknown"}
                </Text>
                <TouchableOpacity
                  style={styles.statusButton}
                  onPress={() => handleStatusChange(item.id, item.status === "approved" ? "inactive" : "approved")}
                >
                  <Text style={styles.statusButtonText}>
                    {item.status === "approved" ? "Deactivate" : "Activate"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No members found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", color: "#2563eb", marginBottom: 8 },
  subtitle: { color: "#6b7280", marginBottom: 16, fontSize: 14 },
  filters: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    justifyContent: "space-between", 
    marginBottom: 16,
    gap: 8,
  },
  filterButton: { 
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e5e7eb", 
    paddingHorizontal: 12,
    paddingVertical: 8, 
    borderRadius: 8,
    flex: 1,
    minWidth: "30%",
    margin: 2,
    justifyContent: "center",
  },
  selectedFilter: { backgroundColor: "#2563eb" },
  filterText: { marginLeft: 4, fontSize: 12, color: "#374151" },
  selectedFilterText: { color: "#fff" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  sorting: { 
    marginBottom: 16,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  sortLabel: { 
    fontWeight: "bold", 
    marginBottom: 8, 
    color: "#374151" 
  },
  sortButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  activeSortButton: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  sortButtonText: {
    fontSize: 12,
    color: "#374151",
  },
  activeSortButtonText: {
    color: "#fff",
  },
  memberCard: { 
    padding: 16, 
    backgroundColor: "#fff", 
    marginBottom: 12, 
    borderRadius: 8, 
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  memberName: { fontSize: 18, fontWeight: "bold", color: "#111827", marginBottom: 4 },
  memberInfo: { color: "#6b7280", marginBottom: 4, fontSize: 14 },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  statusApproved: { color: "#34D399" },
  statusPending: { color: "#F59E0B" },
  statusRejected: { color: "#EF4444" },
  statusInactive: { color: "#F97316" },
  statusDeceased: { color: "#9CA3AF" },
  statusButton: { 
    backgroundColor: "#2563eb", 
    paddingHorizontal: 12,
    paddingVertical: 6, 
    borderRadius: 6,
  },
  statusButtonText: { 
    color: "#fff", 
    fontSize: 12,
    fontWeight: "500",
  },
  errorContainer: {
    backgroundColor: "#fee2e2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 16,
  },
});