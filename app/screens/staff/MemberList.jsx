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
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import api from "@/services/api";

// Cache key constant
const MEMBERS_CACHE_KEY = "approved_members_cache";

// Barangay options
const barangayOptions = [
  "Awang", "Bagocboc", "Barra", "Bonbon", "Cauyonan", "Igpit",
  "Limonda", "Luyong Bonbon", "Malanang", "Nangcaon", "Patag",
  "Poblacion", "Taboc", "Tingalan"
];

export default function MemberList({ navigation }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("all");
  const [showBarangayFilter, setShowBarangayFilter] = useState(false);
  const [staffBarangay, setStaffBarangay] = useState("");

  useEffect(() => {
    fetchMembers();
    getStaffBarangay();
  }, []);

  const getStaffBarangay = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        // Get staff profile to know their assigned barangay
        const staffProfile = await AsyncStorage.getItem("userProfile");
        if (staffProfile) {
          const profile = JSON.parse(staffProfile);
          setStaffBarangay(profile.assigned_barangay || "");
        }
      }
    } catch (error) {
      console.error("Error getting staff barangay:", error);
    }
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);

      // Check cache first
      const cachedData = await AsyncStorage.getItem(MEMBERS_CACHE_KEY);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const cacheAge = Date.now() - timestamp;
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

        if (cacheAge < CACHE_DURATION) {
          setMembers(data);
          setLastUpdated(new Date(timestamp).toLocaleTimeString());
          setLoading(false);
          return;
        }
      }

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

      // Filter only approved members
      const approvedMembers = (response.data || []).filter(
        member => member.status?.toLowerCase() === "approved"
      );

      setMembers(approvedMembers);

      // Cache the approved members
      const cacheData = {
        data: approvedMembers,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(MEMBERS_CACHE_KEY, JSON.stringify(cacheData));
      setLastUpdated(new Date().toLocaleTimeString());

    } catch (err) {
      setError("Failed to load members.");
      console.error("Error fetching members:", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      // Clear cache to force fresh data
      await AsyncStorage.removeItem(MEMBERS_CACHE_KEY);

      const token = await AsyncStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await api.get("/users?role=member", { headers });

      // Filter only approved members
      const approvedMembers = (response.data || []).filter(
        member => member.status?.toLowerCase() === "approved"
      );

      setMembers(approvedMembers);

      // Update cache
      const cacheData = {
        data: approvedMembers,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(MEMBERS_CACHE_KEY, JSON.stringify(cacheData));
      setLastUpdated(new Date().toLocaleTimeString());

    } catch (err) {
      setError("Failed to refresh members.");
      console.error("Error refreshing members:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const originalMembers = [...members];
    try {
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
      );
      await api.patch(`/user/${id}/status`, { status: newStatus });

      // Update cache after status change
      const updatedMembers = members.map(m => m.id === id ? { ...m, status: newStatus } : m);
      const cacheData = {
        data: updatedMembers,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(MEMBERS_CACHE_KEY, JSON.stringify(cacheData));
      setLastUpdated(new Date().toLocaleTimeString());

    } catch (err) {
      console.error("Failed to update status", err);
      setMembers(originalMembers);
    }
  };

  const filteredMembers = members
    .filter((m) => {
      const term = searchTerm.toLowerCase();
      const profile = m.member_profile || {};
      const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.toLowerCase();

      // Barangay filter
      if (selectedBarangay !== "all" && profile.barangay !== selectedBarangay) {
        return false;
      }

      return (
        m.username?.toLowerCase().includes(term) ||
        m.email?.toLowerCase().includes(term) ||
        fullName.includes(term) ||
        profile.barangay?.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      const profileA = a.member_profile || {};
      const profileB = b.member_profile || {};
      const barangayA = profileA.barangay || "";
      const barangayB = profileB.barangay || "";

      // Always prioritize staff's assigned barangay at the top
      if (staffBarangay) {
        if (barangayA === staffBarangay && barangayB !== staffBarangay) {
          return -1; // A comes first
        }
        if (barangayA !== staffBarangay && barangayB === staffBarangay) {
          return 1; // B comes first
        }
        // If both are in staff's barangay or neither, sort alphabetically
        if (barangayA === staffBarangay && barangayB === staffBarangay) {
          return (profileA.first_name || "").localeCompare(profileB.first_name || "");
        }
      }

      // Default alphabetical sort by barangay, then by first name
      const barangayCompare = barangayA.localeCompare(barangayB);
      if (barangayCompare !== 0) return barangayCompare;

      return (profileA.first_name || "").localeCompare(profileB.first_name || "");
    });

  // Get member count by barangay
  const getBarangayStats = () => {
    const stats = {};
    barangayOptions.forEach(barangay => {
      stats[barangay] = members.filter(m =>
        (m.member_profile?.barangay || "") === barangay
      ).length;
    });
    stats.all = members.length;

    // Add staff barangay count if it exists
    if (staffBarangay && !barangayOptions.includes(staffBarangay)) {
      stats[staffBarangay] = members.filter(m =>
        (m.member_profile?.barangay || "") === staffBarangay
      ).length;
    }

    return stats;
  };

  const barangayStats = getBarangayStats();

  const BarangayFilterModal = () => (
    <Modal
      visible={showBarangayFilter}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowBarangayFilter(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter by Barangay</Text>
            <TouchableOpacity
              onPress={() => setShowBarangayFilter(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={[{ barangay: "all", label: "All Barangays" }, ...barangayOptions.map(b => ({ barangay: b, label: b }))]}
            keyExtractor={(item) => item.barangay}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.barangayOption,
                  selectedBarangay === item.barangay && styles.selectedBarangayOption,
                  item.barangay === staffBarangay && styles.staffBarangayOption
                ]}
                onPress={() => {
                  setSelectedBarangay(item.barangay);
                  setShowBarangayFilter(false);
                }}
              >
                <View style={styles.barangayOptionContent}>
                  <Text style={[
                    styles.barangayOptionText,
                    selectedBarangay === item.barangay && styles.selectedBarangayOptionText,
                    item.barangay === staffBarangay && styles.staffBarangayOptionText
                  ]}>
                    {item.label}
                  </Text>
                  {item.barangay === staffBarangay && (
                    <View style={styles.staffBadge}>
                      <Text style={styles.staffBadgeText}>Your Area</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.memberCount}>
                  ({barangayStats[item.barangay] || 0})
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

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
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Approved Members</Text>
          <Text style={styles.subtitle}>Manage all approved members in the system.</Text>
          {staffBarangay ? (
            <Text style={styles.staffAreaText}>Your assigned area: {staffBarangay}</Text>
          ) : null}
          {lastUpdated ? (
            <Text style={styles.cacheInfo}>Last updated: {lastUpdated}</Text>
          ) : null}
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={refreshData}>
          <Ionicons name="refresh" size={20} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* Search and Filter Row */}
      <View style={styles.filterRow}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            placeholder="Search members..."
            value={searchTerm}
            onChangeText={(text) => setSearchTerm(text)}
            style={styles.searchInput}
          />
        </View>

        {/* Barangay Filter Button */}
        <TouchableOpacity
          style={styles.barangayFilterButton}
          onPress={() => setShowBarangayFilter(true)}
        >
          <Ionicons name="filter" size={20} color="#2563eb" />
          <Text style={styles.barangayFilterText}>
            {selectedBarangay === "all" ? "All" : selectedBarangay}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active Filters */}
      {selectedBarangay !== "all" && (
        <View style={styles.activeFilterContainer}>
          <Text style={styles.activeFilterText}>
            Filtered by: {selectedBarangay}
            {selectedBarangay === staffBarangay && " (Your Area)"}
          </Text>
          <TouchableOpacity
            onPress={() => setSelectedBarangay("all")}
            style={styles.clearFilterButton}
          >
            <Ionicons name="close-circle" size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>
      )}

      {/* Barangay Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Members by Barangay</Text>
        <View style={styles.statsGrid}>
          {/* Show staff barangay first if it exists */}
          {staffBarangay && (
            <View key={staffBarangay} style={[styles.statItem, styles.staffStatItem]}>
              <Text style={[styles.statNumber, styles.staffStatNumber]}>{barangayStats[staffBarangay] || 0}</Text>
              <Text style={[styles.statLabel, styles.staffStatLabel]}>{staffBarangay}</Text>
              <Text style={styles.yourAreaLabel}>Your Area</Text>
            </View>
          )}
          {/* Show other barangays */}
          {barangayOptions
            .filter(barangay => barangay !== staffBarangay)
            .slice(0, staffBarangay ? 3 : 4)
            .map(barangay => (
              <View key={barangay} style={styles.statItem}>
                <Text style={styles.statNumber}>{barangayStats[barangay] || 0}</Text>
                <Text style={styles.statLabel}>{barangay}</Text>
              </View>
            ))}
          {(barangayOptions.length > (staffBarangay ? 4 : 4)) && (
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => setShowBarangayFilter(true)}
            >
              <Text style={styles.statNumber}>+{barangayOptions.length - (staffBarangay ? 4 : 4)}</Text>
              <Text style={styles.statLabel}>More</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Error Message */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Member Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} found
          {selectedBarangay !== "all" ? ` in ${selectedBarangay}` : ''}
          {staffBarangay && selectedBarangay === "all" && ` • ${barangayStats[staffBarangay] || 0} in your area`}
        </Text>
      </View>

      {/* Member List */}
      <FlatList
        data={filteredMembers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const profile = item.member_profile || {};
          const fullName = `${profile.first_name || ""} ${profile.middle_name || ""} ${profile.last_name || ""}`.trim();
          const isStaffBarangay = profile.barangay === staffBarangay;

          return (
            <View style={[
              styles.memberCard,
              isStaffBarangay && styles.staffBarangayMemberCard
            ]}>
              <View style={styles.memberHeader}>
                <View style={styles.nameContainer}>
                  <Text style={styles.memberName}>{fullName || "Unknown Member"}</Text>
                  {isStaffBarangay && (
                    <View style={styles.staffAreaIndicator}>
                      <Ionicons name="location" size={12} color="#dc2626" />
                      <Text style={styles.staffAreaIndicatorText}>Your Area</Text>
                    </View>
                  )}
                </View>
                <View style={styles.barangayBadge}>
                  <Text style={styles.barangayBadgeText}>
                    {profile.barangay || "No barangay"}
                  </Text>
                </View>
              </View>

              <Text style={styles.memberInfo}>{item.email}</Text>
              <Text style={styles.memberInfo}>{profile.contact_number || "No contact number"}</Text>
              <Text style={styles.memberInfo}>{profile.address || "No address"}</Text>


            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No approved members found</Text>
            {selectedBarangay !== "all" && (
              <TouchableOpacity
                style={styles.clearFilterFullButton}
                onPress={() => setSelectedBarangay("all")}
              >
                <Text style={styles.clearFilterFullButtonText}>
                  Clear barangay filter
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <BarangayFilterModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#2563eb", marginBottom: 8 },
  subtitle: { color: "#6b7280", marginBottom: 4, fontSize: 14 },
  staffAreaText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  cacheInfo: { color: "#9CA3AF", fontSize: 12, fontStyle: "italic" },
  refreshButton: {
    padding: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
  },
  filterRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
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
  barangayFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    gap: 6,
  },
  barangayFilterText: {
    color: "#2563eb",
    fontWeight: "500",
    fontSize: 14,
  },
  activeFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dbeafe",
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  activeFilterText: {
    color: "#1e40af",
    fontSize: 12,
    fontWeight: "500",
    marginRight: 8,
  },
  clearFilterButton: {
    padding: 2,
  },
  statsContainer: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  statsTitle: {
    fontWeight: "bold",
    marginBottom: 8,
    color: "#374151",
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statItem: {
    alignItems: "center",
    minWidth: 60,
  },
  staffStatItem: {
    backgroundColor: "#fef2f2",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2563eb",
  },
  staffStatNumber: {
    color: "#dc2626",
  },
  statLabel: {
    fontSize: 10,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 2,
  },
  staffStatLabel: {
    color: "#dc2626",
    fontWeight: "500",
  },
  yourAreaLabel: {
    fontSize: 8,
    color: "#dc2626",
    fontWeight: "bold",
    marginTop: 2,
  },
  resultsContainer: {
    marginBottom: 12,
  },
  resultsText: {
    color: "#6b7280",
    fontSize: 14,
    fontStyle: "italic",
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
  staffBarangayMemberCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#dc2626",
    backgroundColor: "#fef2f2",
  },
  memberHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  nameContainer: {
    flex: 1,
    marginRight: 8,
  },
  memberName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  staffAreaIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fecaca",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  staffAreaIndicatorText: {
    color: "#dc2626",
    fontSize: 10,
    fontWeight: "500",
    marginLeft: 2,
  },
  barangayBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  barangayBadgeText: {
    color: "#1e40af",
    fontSize: 12,
    fontWeight: "500",
  },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 0,
    width: "80%",
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  closeButton: {
    padding: 4,
  },
  barangayOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  selectedBarangayOption: {
    backgroundColor: "#dbeafe",
  },
  staffBarangayOption: {
    backgroundColor: "#fef2f2",
    borderLeftWidth: 4,
    borderLeftColor: "#dc2626",
  },
  barangayOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  barangayOptionText: {
    fontSize: 16,
    color: "#374151",
  },
  selectedBarangayOptionText: {
    color: "#1e40af",
    fontWeight: "500",
  },
  staffBarangayOptionText: {
    color: "#dc2626",
    fontWeight: "500",
  },
  staffBadge: {
    backgroundColor: "#fecaca",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  staffBadgeText: {
    color: "#dc2626",
    fontSize: 10,
    fontWeight: "500",
  },
  memberCount: {
    fontSize: 14,
    color: "#6b7280",
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
    marginBottom: 12,
  },
  clearFilterFullButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  clearFilterFullButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});