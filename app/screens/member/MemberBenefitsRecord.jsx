import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native"; 
import { useCameraPermissions } from "expo-camera";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import api from "@/services/api";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function MemberBenefitRecord() {
  const navigation = useNavigation();
  const route = useRoute();
  const { benefitId, title } = route.params;

  const [permission, requestPermission] = useCameraPermissions();
  const [benefit, setBenefit] = useState(null);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState("nameAsc");

  const isPermissionGranted = Boolean(permission?.granted);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [benefitId]);

  const fetchData = async () => {
    try {
      setRefreshing(true);
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

  // Budget & Remaining logic
  const lockedCount = Number(benefit?.locked_member_count ?? 0);
  const perUnit = benefit?.type === "cash"
    ? Number(benefit?.budget_amount ?? benefit?.amount ?? 0)
    : Number(benefit?.budget_quantity ?? benefit?.amount ?? 0);

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

  const completionPercentage = lockedCount > 0 ? (effectiveClaimed / lockedCount) * 100 : 0;

  // Sorting Logic
  const sortedClaims = [...claims].sort((a, b) => {
    const nameA = `${a.user?.member_profile?.last_name || ""} ${a.user?.member_profile?.first_name || ""}`.toLowerCase();
    const nameB = `${b.user?.member_profile?.last_name || ""} ${b.user?.member_profile?.first_name || ""}`.toLowerCase();
    const brgyA = a.user?.member_profile?.barangay || "";
    const brgyB = b.user?.member_profile?.barangay || "";

    switch (sortBy) {
      case "nameAsc": return nameA.localeCompare(nameB);
      case "nameDesc": return nameB.localeCompare(nameA);
      case "barangayAsc": return brgyA.localeCompare(brgyB);
      case "barangayDesc": return brgyB.localeCompare(brgyA);
      default: return 0;
    }
  });

  const sortOptions = [
    { label: "Name (A → Z)", value: "nameAsc", icon: "sort-alphabetical-ascending" },
    { label: "Name (Z → A)", value: "nameDesc", icon: "sort-alphabetical-descending" },
    { label: "Barangay (A → Z)", value: "barangayAsc", icon: "sort-alphabetical-ascending" },
    { label: "Barangay (Z → A)", value: "barangayDesc", icon: "sort-alphabetical-descending" },
  ];

  const getBenefitColor = (type) => {
    switch (type?.toLowerCase()) {
      case "cash": return "#10b981";
      case "relief": return "#f59e0b";
      case "medical": return "#ef4444";
      case "education": return "#3b82f6";
      default: return "#6b7280";
    }
  };

  const getBenefitIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "cash": return "cash";
      case "relief": return "gift";
      case "medical": return "medical-bag";
      case "education": return "school";
      default: return "help-circle";
    }
  };

  const renderStatsCard = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}>
          <Ionicons name="people" size={20} color="#2563eb" />
        </View>
        <Text style={styles.statNumber}>{lockedCount}</Text>
        <Text style={styles.statLabel}>Target</Text>
      </View>
      
      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
          <Ionicons name="checkmark-done" size={20} color="#22c55e" />
        </View>
        <Text style={styles.statNumber}>{effectiveClaimed}</Text>
        <Text style={styles.statLabel}>Claimed</Text>
      </View>
      
      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
          <Ionicons name="time" size={20} color="#3b82f6" />
        </View>
        <Text style={styles.statNumber}>{lockedCount - effectiveClaimed}</Text>
        <Text style={styles.statLabel}>Remaining</Text>
      </View>
      
      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
          <Ionicons name="trending-up" size={20} color="#a855f7" />
        </View>
        <Text style={styles.statNumber}>{Math.round(completionPercentage)}%</Text>
        <Text style={styles.statLabel}>Progress</Text>
      </View>
    </View>
  );

  const renderBudgetInfo = () => (
    <View style={styles.budgetCard}>
      <View style={styles.budgetHeader}>
        <Ionicons name="wallet" size={24} color="#2563eb" />
        <Text style={styles.budgetTitle}>Budget Overview</Text>
      </View>
      
      <View style={styles.budgetRow}>
        <View style={styles.budgetItem}>
          <Text style={styles.budgetLabel}>Total Budget</Text>
          <Text style={styles.budgetValue}>
            {benefit?.type === "cash" ? `₱${totalBudget.toLocaleString()}` : `${totalBudget} ${benefit?.unit || ""}`}
          </Text>
        </View>
        
        <View style={styles.budgetItem}>
          <Text style={styles.budgetLabel}>Per Member</Text>
          <Text style={styles.budgetValue}>
            {benefit?.type === "cash" ? `₱${perUnit.toLocaleString()}` : `${perUnit} ${benefit?.unit || ""}`}
          </Text>
        </View>
      </View>
      
      <View style={styles.budgetRow}>
        <View style={styles.budgetItem}>
          <Text style={styles.budgetLabel}>Remaining</Text>
          <Text style={[styles.budgetValue, { color: '#10b981' }]}>
            {benefit?.type === "cash" ? `₱${remaining.toLocaleString()}` : `${remaining} ${benefit?.unit || ""}`}
          </Text>
        </View>
        
        <View style={styles.budgetItem}>
          <Text style={styles.budgetLabel}>Used</Text>
          <Text style={[styles.budgetValue, { color: '#ef4444' }]}>
            {benefit?.type === "cash" ? `₱${(totalBudget - remaining).toLocaleString()}` : `${totalBudget - remaining} ${benefit?.unit || ""}`}
          </Text>
        </View>
      </View>
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${completionPercentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {effectiveClaimed} of {lockedCount} members claimed ({Math.round(completionPercentage)}%)
        </Text>
      </View>
    </View>
  );

  const renderClaimItem = ({ item, index }) => {
    const fullName = item.user?.member_profile
      ? `${item.user.member_profile.first_name || ""} ${item.user.member_profile.middle_name || ""} ${item.user.member_profile.last_name || ""}`.trim()
      : item.user?.name || "—";

    const scannedBy = item.scanned_by?.staff_profile
      ? `${item.scanned_by.staff_profile.first_name || ""} ${item.scanned_by.staff_profile.middle_name || ""} ${item.scanned_by.staff_profile.last_name || ""}`.trim()
      : item.scanned_by?.name || "—";

    const getTimeAgo = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      
      if (diffInMinutes < 1) return "Just now";
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    return (
      <View style={[
        styles.claimItem,
        index === 0 && styles.firstItem
      ]}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </Text>
          </View>
          {index < 3 && (
            <View style={styles.rankBadge}>
              <Ionicons name="trophy" size={12} color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.claimInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.claimName} numberOfLines={1}>
              {fullName}
            </Text>
            <Text style={styles.timeAgo}>
              {item.claimed_at ? getTimeAgo(item.claimed_at) : "Not claimed"}
            </Text>
          </View>
          
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="location" size={14} color="#6b7280" />
              <Text style={styles.detailText}>
                {item.user?.member_profile?.barangay || "—"}
              </Text>
            </View>
            
            {item.claimed_at && (
              <View style={styles.detailItem}>
                <Ionicons name="calendar" size={14} color="#6b7280" />
                <Text style={styles.detailText}>
                  {new Date(item.claimed_at).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>

          {item.claimed_at && (
            <View style={styles.scanInfo}>
              <Ionicons name="person" size={12} color="#9ca3af" />
              <Text style={styles.scanInfoText}>
                Scanned by {scannedBy}
              </Text>
              <Text style={styles.scanTime}>
                {new Date(item.claimed_at).toLocaleTimeString()}
              </Text>
            </View>
          )}
        </View>

        {item.claimed_at && (
          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading Benefit Details...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={fetchData}
            colors={["#fff"]}
            tintColor="#fff"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Benefit Details</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Benefit Card */}
        {benefit && (
          <View style={styles.benefitCard}>
            <View style={styles.benefitHeader}>
              <View style={[
                styles.benefitIcon,
                { backgroundColor: getBenefitColor(benefit.type) }
              ]}>
                <MaterialCommunityIcons 
                  name={getBenefitIcon(benefit.type)} 
                  size={28} 
                  color="#fff" 
                />
              </View>
              <View style={styles.benefitInfo}>
                <Text style={styles.benefitTitle}>{benefit.name}</Text>
                <View style={styles.benefitType}>
                  <Text style={[
                    styles.typeText,
                    { color: getBenefitColor(benefit.type) }
                  ]}>
                    {benefit.type}
                  </Text>
                  {benefit.amount && (
                    <Text style={styles.amountText}>
                      • {benefit.type === "cash" ? `₱${Number(benefit.amount).toLocaleString()}` : `${Number(benefit.amount).toLocaleString()} ${benefit.unit || ""}`}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Scan Button */}
        <TouchableOpacity 
          style={[
            styles.scanButton,
            (!isPermissionGranted || effectiveClaimed >= lockedCount) && styles.scanButtonDisabled
          ]}
          disabled={!isPermissionGranted || effectiveClaimed >= lockedCount}
          onPress={() => navigation.navigate("BenefitScanner", { benefitId, title: benefit?.name })}
        >
          <LinearGradient
            colors={(!isPermissionGranted || effectiveClaimed >= lockedCount) ? ["#9ca3af", "#6b7280"] : ["#2563eb", "#1d4ed8"]}
            style={styles.scanButtonGradient}
          >
            <Ionicons name="qr-code" size={24} color="#fff" />
            <Text style={styles.scanButtonText}>
              {effectiveClaimed >= lockedCount
                ? "All Members Claimed"
                : !isPermissionGranted
                ? "Grant Camera Permission"
                : "Scan QR Code"}
            </Text>
            {isPermissionGranted && effectiveClaimed < lockedCount && (
              <View style={styles.scanBadge}>
                <Ionicons name="scan" size={16} color="#fff" />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Statistics */}
        {renderStatsCard()}

        {/* Budget Information */}
        {renderBudgetInfo()}

        {/* Sort Options */}
        <View style={styles.sortSection}>
          <Text style={styles.sortLabel}>Sort By:</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.sortContainer}
          >
            {sortOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.sortButton,
                  sortBy === opt.value && styles.sortButtonActive
                ]}
                onPress={() => setSortBy(opt.value)}
              >
                <MaterialCommunityIcons 
                  name={opt.icon} 
                  size={16} 
                  color={sortBy === opt.value ? "#fff" : "#6b7280"} 
                />
                <Text style={[
                  styles.sortButtonText,
                  sortBy === opt.value && styles.sortButtonTextActive
                ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Claims List */}
        <View style={styles.claimsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Claimants ({claims.length})
            </Text>
            <Text style={styles.sectionSubtitle}>
              {effectiveClaimed} successfully claimed
            </Text>
          </View>

          {sortedClaims.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No Claimants Yet</Text>
              <Text style={styles.emptyText}>
                Claimants will appear here once they scan the QR code
              </Text>
            </View>
          ) : (
            <FlatList
              data={sortedClaims}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderClaimItem}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  scrollView: {
    flex: 1,
    padding: 16
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 10
  },
  backButton: {
    padding: 8
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
  },
  headerRight: {
    width: 40
  },

  // Benefit Card
  benefitCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12
  },
  benefitHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  benefitIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  benefitInfo: {
    flex: 1
  },
  benefitTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8
  },
  benefitType: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  amountText: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '600',
    marginLeft: 8
  },

  // Scan Button
  scanButton: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden'
  },
  scanButtonDisabled: {
    opacity: 0.7
  },
  scanButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12
  },
  scanBadge: {
    position: 'absolute',
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 4
  },

  // Statistics
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap'
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    backdropFilter: 'blur(10px)'
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center'
  },

  // Budget Card
  budgetCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  budgetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 12
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  budgetItem: {
    flex: 1
  },
  budgetLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4
  },
  budgetValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827'
  },
  progressContainer: {
    marginTop: 8
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center'
  },

  // Sort Section
  sortSection: {
    marginBottom: 20
  },
  sortLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12
  },
  sortContainer: {
    flexDirection: 'row'
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8
  },
  sortButtonActive: {
    backgroundColor: '#2563eb'
  },
  sortButtonText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6
  },
  sortButtonTextActive: {
    color: '#fff'
  },

  // Claims Section
  claimsSection: {
    marginBottom: 20
  },
  sectionHeader: {
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)'
  },

  // Claim Items
  claimItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8
  },
  firstItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b'
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14
  },
  rankBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#f59e0b',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  claimInfo: {
    flex: 1
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  claimName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1
  },
  timeAgo: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500'
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 12
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  detailText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4
  },
  scanInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  scanInfoText: {
    fontSize: 11,
    color: '#9ca3af',
    marginLeft: 4,
    marginRight: 8
  },
  scanTime: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500'
  },
  statusBadge: {
    alignSelf: 'center'
  },

  // Empty State
  emptyState: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center'
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20
  },

  bottomSpacing: {
    height: 20
  }
});