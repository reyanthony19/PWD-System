import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import api from "@/services/api";
import { LinearGradient } from "expo-linear-gradient";

export default function MemberBenefitRecord() {
  const navigation = useNavigation();
  const route = useRoute();
  const { benefitId, title } = route.params || {};

  const [benefit, setBenefit] = useState(null);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [userClaim, setUserClaim] = useState(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser && benefitId) {
      fetchData();
    }
  }, [benefitId, currentUser]);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      setError("");

      // Fetch benefit details and claims in parallel
      await Promise.all([
        fetchBenefitDetails(),
        fetchBenefitClaims()
      ]);

    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load benefit data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchBenefitDetails = async () => {
    try {
      const benefitRes = await api.get(`/benefits/${benefitId}`);
      setBenefit(benefitRes.data);
    } catch (err) {
      console.error("Benefit fetch error:", err);
      throw new Error("Failed to load benefit details");
    }
  };

  const fetchBenefitClaims = async () => {
    try {
      const claimsRes = await api.get(`/benefits/${benefitId}/claims`);
      const data = claimsRes.data?.data || claimsRes.data || [];
      setClaims(data);

      // Check if current user has claimed this benefit
      if (currentUser?.id) {
        const userClaimRecord = data.find(claim =>
          claim.user_id === currentUser.id ||
          claim.user?.id === currentUser.id
        );
        setUserClaim(userClaimRecord || null);
      }
    } catch (err) {
      console.error("Claims fetch error:", err);
      throw new Error("Failed to load claims data");
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const userRes = await api.get("/user");
      setCurrentUser(userRes.data);
    } catch (error) {
      console.error("Error fetching current user:", error);
      setError("Failed to load user information");
    }
  };

  const getUserClaimStatus = () => {
    if (!currentUser) {
      return {
        status: "unknown",
        message: "User information not available",
        color: "#6b7280",
        icon: "help-circle"
      };
    }

    if (userClaim) {
      return {
        status: "received",
        message: "You have successfully received this benefit",
        color: "#10b981",
        icon: "checkmark-circle",
        claimDate: userClaim.claimed_at || userClaim.created_at
      };
    } else {
      return {
        status: "not_received",
        message: "You have not yet received this benefit",
        color: "#ef4444",
        icon: "close-circle"
      };
    }
  };

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

  const formatAmount = (amount, type, unit = "") => {
    if (type === "cash") {
      return `₱${Number(amount).toLocaleString()}`;
    } else {
      return `${Number(amount).toLocaleString()} ${unit}`.trim();
    }
  };

  const renderUserClaimStatus = () => {
    const claimStatus = getUserClaimStatus();

    return (
      <View style={styles.attendanceCard}>
        <Text style={styles.attendanceTitle}>Your Benefit Status</Text>

        <View style={styles.attendanceStatus}>
          <View style={[styles.statusBadge, { backgroundColor: `${claimStatus.color}20` }]}>
            <Ionicons name={claimStatus.icon} size={24} color={claimStatus.color} />
            <Text style={[styles.statusText, { color: claimStatus.color }]}>
              {claimStatus.status === "received" ? "Received" :
                claimStatus.status === "not_received" ? "Not Received" : "Unknown"}
            </Text>
          </View>

          <Text style={styles.statusMessage}>{claimStatus.message}</Text>
        </View>

        {userClaim && (
          <View style={styles.attendanceDetails}>
            <Text style={styles.detailsTitle}>Claim Details</Text>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="time" size={16} color="#6b7280" />
                <Text style={styles.detailLabel}>Received on:</Text>
                <Text style={styles.detailValue}>
                  {claimStatus.claimDate
                    ? new Date(claimStatus.claimDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                    : "Date not recorded"
                  }
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="time" size={16} color="#6b7280" />
                <Text style={styles.detailLabel}>Time:</Text>
                <Text style={styles.detailValue}>
                  {claimStatus.claimDate
                    ? new Date(claimStatus.claimDate).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                    : "Time not recorded"
                  }
                </Text>
              </View>
            </View>

            {userClaim.scanned_by && (
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="person" size={16} color="#6b7280" />
                  <Text style={styles.detailLabel}>Distributed by:</Text>
                  <Text style={styles.detailValue}>
                    {userClaim.scanned_by?.staff_profile
                      ? `${userClaim.scanned_by.staff_profile.first_name || ""} ${userClaim.scanned_by.staff_profile.last_name || ""}`.trim()
                      : userClaim.scanned_by?.username || "Staff member"
                    }
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {claimStatus.status === "not_received" && (
          <View style={styles.infoNotice}>
            <Ionicons name="information-circle" size={20} color="#3b82f6" />
            <Text style={styles.infoText}>
              If this is marked as "Received" but you haven't actually received the benefit, please contact your local barangay office for assistance.
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderBenefitDetails = () => {
    if (!benefit) return null;

    const benefitColor = getBenefitColor(benefit.type);
    const isCash = benefit?.type === "cash";
    const perUnit = isCash
      ? Number(benefit?.budget_amount ?? 0)
      : Number(benefit?.budget_quantity ?? 0);

    return (
      <View style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <View style={[styles.eventIcon, { backgroundColor: `${benefitColor}20` }]}>
            <MaterialCommunityIcons
              name={getBenefitIcon(benefit.type)}
              size={28}
              color={benefitColor}
            />
          </View>
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>{benefit.name}</Text>
            <Text style={styles.eventStatus}>
              {benefit.type?.charAt(0).toUpperCase() + benefit.type?.slice(1)} Benefit
            </Text>
          </View>
        </View>

        <View style={styles.eventDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="gift" size={20} color="#6b7280" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Benefit Value</Text>
                <Text style={styles.detailValue}>
                  {formatAmount(perUnit, benefit.type, benefit.unit)}
                </Text>
              </View>
            </View>
          </View>

          {benefit.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionLabel}>Description</Text>
              <Text style={styles.descriptionText}>{benefit.description}</Text>
            </View>
          )}



        </View>
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

  if (error) {
    return (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#fff" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
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
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Benefit Status</Text>
          <View style={styles.headerRight} />
        </View>

        {/* User Claim Status Card */}
        {renderUserClaimStatus()}

        {/* Benefit Details Card */}
        {renderBenefitDetails()}

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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  retryText: {
    color: '#fff',
    fontWeight: '600'
  },
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
  eventCard: {
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
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  eventIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  eventInfo: {
    flex: 1
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4
  },
  eventStatus: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic'
  },
  eventDetails: {
    gap: 16
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1
  },
  detailTextContainer: {
    marginLeft: 12,
    flex: 1
  },
  detailLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500'
  },
  descriptionContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6'
  },
  descriptionLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4
  },
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6'
  },
  statusLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginRight: 8
  },
  statusBadgeSmall: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusTextSmall: {
    fontSize: 12,
    fontWeight: '600'
  },
  attendanceCard: {
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
  attendanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16
  },
  attendanceStatus: {
    alignItems: 'center',
    marginBottom: 20
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 12
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8
  },
  statusMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20
  },
  attendanceDetails: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6'
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12
  },
  detailRow: {
    marginBottom: 12
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    marginRight: 4
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500'
  },
  infoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 12
  },
  infoText: {
    fontSize: 12,
    color: '#1e40af',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16
  },
  bottomSpacing: {
    height: 20
  }
});