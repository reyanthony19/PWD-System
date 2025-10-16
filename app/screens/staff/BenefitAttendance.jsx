import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";

import { useNavigation } from "@react-navigation/native"; 
import { useCameraPermissions } from "expo-camera";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import api from "@/services/api";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BenefitAttendance({ route }) {
  const { benefitId, title } = route.params;
  const navigation = useNavigation();

  const [permission, requestPermission] = useCameraPermissions();
  const [benefit, setBenefit] = useState(null);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState("nameAsc");

  const isPermissionGranted = Boolean(permission?.granted);

  const fetchData = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const benefitRes = await api.get(`/benefits/${benefitId}`);
      setBenefit(benefitRes.data);

      const claimsRes = await api.get(`/benefits/${benefitId}/claims`);
      const data = claimsRes.data?.data || claimsRes.data || [];
      setClaims(data);
    } catch (err) {
      console.error("Fetch error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (benefitId) {
      fetchData();
      const interval = setInterval(fetchData, 100000);
      return () => clearInterval(interval);
    }
  }, [benefitId]);

  const onRefresh = () => {
    fetchData(true);
  };

  // Budget & Remaining logic
  const lockedCount = Number(benefit?.locked_member_count ?? 0);
  const perUnit = benefit?.type === "cash"
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

  // Sorting Logic
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

  const renderClaimItem = ({ item }) => {
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
        <View style={styles.claimHeader}>
          <Text style={styles.name}>{fullName}</Text>
          <View style={[
            styles.statusBadge,
            item.claimed_at ? styles.claimedBadge : styles.pendingBadge
          ]}>
            <Text style={styles.statusText}>
              {item.claimed_at ? "Claimed" : "Pending"}
            </Text>
          </View>
        </View>
        
        <View style={styles.claimDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={14} color="#6b7280" />
            <Text style={styles.details}>
              Barangay: {item.user?.member_profile?.barangay || "—"}
            </Text>
          </View>
          
          {item.claimed_at && (
            <>
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="clock-outline" size={14} color="#6b7280" />
                <Text style={styles.details}>
                  Claimed: {new Date(item.claimed_at).toLocaleString([], {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Ionicons name="person" size={14} color="#6b7280" />
                <Text style={styles.details}>
                  Scanned By: {scannedBy}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
        <SafeAreaView style={styles.loader}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading Claims...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={sortedClaims}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderClaimItem}
          ListHeaderComponent={
            <View style={styles.headerContainer}>
              {/* Benefit Header Card */}
              {benefit && (
                <View style={styles.card}>
                  <View style={styles.headerRow}>
                    <View style={styles.benefitIcon}>
                      <Ionicons name="gift" size={32} color="#fff" />
                    </View>
                    <View style={styles.headerContent}>
                      <Text style={styles.title}>{benefit.name}</Text>
                      
                      <View style={styles.benefitMeta}>
                        <View style={styles.metaItem}>
                          <MaterialCommunityIcons name="tag" size={16} color="#2563eb" />
                          <Text style={styles.metaText}>{benefit.type}</Text>
                        </View>
                        {benefit.amount && (
                          <View style={styles.metaItem}>
                            <Ionicons name="cash" size={16} color="#2563eb" />
                            <Text style={styles.metaText}>
                              {Number(benefit.amount).toLocaleString()} 
                              {benefit.type === "cash" ? "₱" : benefit.unit || ""}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Budget Stats */}
                  <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>
                        {benefit.type === "cash" 
                          ? `₱${Number(totalBudget).toLocaleString()}`
                          : `${totalBudget} ${benefit.unit || ""}`
                        }
                      </Text>
                      <Text style={styles.statLabel}>Total Budget</Text>
                    </View>
                    
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>
                        {benefit.type === "cash" 
                          ? `₱${Number(perUnit).toLocaleString()}`
                          : `${perUnit} ${benefit.unit || ""}`
                        }
                      </Text>
                      <Text style={styles.statLabel}>Per Member</Text>
                    </View>
                    
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: remaining > 0 ? '#10b981' : '#ef4444' }]}>
                        {benefit.type === "cash" 
                          ? `₱${Number(remaining).toLocaleString()}`
                          : `${remaining} ${benefit.unit || ""}`
                        }
                      </Text>
                      <Text style={styles.statLabel}>Remaining</Text>
                    </View>
                    
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{lockedCount}</Text>
                      <Text style={styles.statLabel}>Target</Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressLabels}>
                      <Text style={styles.progressText}>
                        Claimed: {claimedMembers} / {lockedCount}
                      </Text>
                      <Text style={styles.progressText}>
                        {Math.round((claimedMembers / lockedCount) * 100)}%
                      </Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill,
                          { 
                            width: `${Math.min((claimedMembers / lockedCount) * 100, 100)}%`,
                            backgroundColor: claimedMembers >= lockedCount ? '#10b981' : '#2563eb'
                          }
                        ]} 
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* QR Scan Button */}
              <Pressable
                style={[
                  styles.scanButton,
                  (!isPermissionGranted || effectiveClaimed >= lockedCount) &&
                    styles.disabled,
                ]}
                disabled={!isPermissionGranted || effectiveClaimed >= lockedCount}
                onPress={() =>
                  navigation.navigate("BenefitScanner", { benefitId })
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

              {/* Sort Options */}
              <View style={styles.sortRow}>
                <Text style={styles.sortLabel}>Sort By:</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.sortScroll}
                >
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

              {/* Claims Header */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Claims ({sortedClaims.length})
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No Claims Yet</Text>
              <Text style={styles.emptyText}>
                Scan QR codes to start recording claims
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#fff"]}
              tintColor="#fff"
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#fff",
    fontSize: 16,
    fontWeight: '600'
  },
  headerContainer: {
    padding: 16,
  },
  listContent: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  benefitIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  benefitMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  scanButton: {
    flexDirection: "row",
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  disabled: {
    backgroundColor: "#9ca3af"
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  },
  sortRow: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: '#111827'
  },
  sortScroll: {
    flexGrow: 0,
  },
  sortButton: {
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  sortButtonActive: {
    backgroundColor: "#2563eb"
  },
  sortButtonText: {
    color: "#111827",
    fontSize: 14,
  },
  sortButtonTextActive: {
    color: "#fff"
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  listItem: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  claimedBadge: {
    backgroundColor: '#dcfce7',
  },
  pendingBadge: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  claimDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  details: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
});