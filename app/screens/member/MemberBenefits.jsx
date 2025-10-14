import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Card, Avatar, Badge } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import api from "@/services/api";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function MemberBenefits() {
  const navigation = useNavigation();
  const [benefits, setBenefits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [claimStatus, setClaimStatus] = useState({});
  const [stats, setStats] = useState({
    totalBenefits: 0,
    claimed: 0,
    available: 0,
    totalValue: 0
  });

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetchBenefits();

    const intervalId = setInterval(() => {
      fetchBenefits();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [navigation]);

  const fetchBenefits = async () => {
    try {
      setRefreshing(true);
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        navigation.replace("Login");
        return;
      }

      // Fetch benefits list
      const res = await api.get("/benefits-lists", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const benefitsData = res.data || [];
      setBenefits(benefitsData);

      // Get current user info
      const userRes = await api.get("/user", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch claim status for each benefit
      const claimStatuses = {};
      let claimedCount = 0;
      let totalValue = 0;

      for (const benefit of benefitsData) {
        try {
          const claimRes = await api.get(`/benefits/${benefit.id}/${userRes.data.id}/claims`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          claimStatuses[benefit.id] = claimRes.data.claimed ? "Claimed" : "Available";
          if (claimRes.data.claimed) {
            claimedCount++;
          }
          
          // Calculate total value (assuming benefit has amount field)
          if (benefit.amount) {
            totalValue += parseFloat(benefit.amount) || 0;
          }
        } catch (err) {
          console.error(`Error fetching claim status for benefit ${benefit.id}:`, err);
          claimStatuses[benefit.id] = "Unknown";
        }
      }

      setClaimStatus(claimStatuses);
      
      // Update stats
      setStats({
        totalBenefits: benefitsData.length,
        claimed: claimedCount,
        available: benefitsData.length - claimedCount,
        totalValue: totalValue
      });

    } catch (err) {
      console.error("Benefits fetch error:", err.response?.data || err.message);
      setError("Failed to load benefits.");

      if (err.response?.status === 401) {
        await AsyncStorage.removeItem("token");
        navigation.replace("Login");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getBenefitIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "cash":
        return "cash";
      case "relief":
        return "gift";
      case "medical":
        return "medical-bag";
      case "education":
        return "school";
      case "food":
        return "food";
      case "housing":
        return "home";
      default:
        return "help-circle";
    }
  };

  const getBenefitColor = (type) => {
    switch (type?.toLowerCase()) {
      case "cash":
        return "#10b981";
      case "relief":
        return "#f59e0b";
      case "medical":
        return "#ef4444";
      case "education":
        return "#3b82f6";
      case "food":
        return "#8b5cf6";
      case "housing":
        return "#06b6d4";
      default:
        return "#6b7280";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Claimed":
        return "#10b981";
      case "Available":
        return "#3b82f6";
      case "Pending":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Claimed":
        return "checkmark-circle";
      case "Available":
        return "time";
      case "Pending":
        return "hourglass";
      default:
        return "help-circle";
    }
  };

  const renderStatsCard = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}>
          <Ionicons name="gift" size={24} color="#2563eb" />
        </View>
        <Text style={styles.statNumber}>{stats.totalBenefits}</Text>
        <Text style={styles.statLabel}>Total Benefits</Text>
      </View>
      
      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
          <Ionicons name="checkmark-done" size={24} color="#22c55e" />
        </View>
        <Text style={styles.statNumber}>{stats.claimed}</Text>
        <Text style={styles.statLabel}>Claimed</Text>
      </View>
      
      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
          <Ionicons name="time" size={24} color="#3b82f6" />
        </View>
        <Text style={styles.statNumber}>{stats.available}</Text>
        <Text style={styles.statLabel}>Available</Text>
      </View>
      
      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
          <Ionicons name="cash" size={24} color="#a855f7" />
        </View>
        <Text style={styles.statNumber}>₱{stats.totalValue.toLocaleString()}</Text>
        <Text style={styles.statLabel}>Total Value</Text>
      </View>
    </View>
  );

  const renderBenefitItem = ({ item, index }) => {
    const status = claimStatus[item.id] || "Checking...";
    const benefitColor = getBenefitColor(item.type);
    const statusColor = getStatusColor(status);
    
    return (
      <TouchableOpacity
        style={[
          styles.benefitCard,
          index === 0 && styles.firstCard
        ]}
        onPress={() =>
          navigation.navigate("MemberBenefitRecord", { 
            benefitId: item.id, 
            title: item.name 
          })
        }
      >
        <View style={styles.benefitHeader}>
          <View style={styles.benefitIconContainer}>
            <View style={[styles.benefitIcon, { backgroundColor: benefitColor }]}>
              <MaterialCommunityIcons 
                name={getBenefitIcon(item.type)} 
                size={24} 
                color="#fff" 
              />
            </View>
          </View>
          
          <View style={styles.benefitInfo}>
            <Text style={styles.benefitTitle} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={styles.benefitMeta}>
              <View style={[styles.typeBadge, { backgroundColor: `${benefitColor}20` }]}>
                <Text style={[styles.typeText, { color: benefitColor }]}>
                  {item.type || "General"}
                </Text>
              </View>
              {item.amount && (
                <Text style={styles.amountText}>
                  ₱{parseFloat(item.amount).toLocaleString()}
                </Text>
              )}
            </View>
          </View>
          
          <View style={styles.statusContainer}>
            <Badge 
              style={[styles.statusBadge, { backgroundColor: statusColor }]}
              size={24}
            >
              <Ionicons 
                name={getStatusIcon(status)} 
                size={14} 
                color="#fff" 
              />
            </Badge>
          </View>
        </View>

        <View style={styles.benefitDetails}>
          <View style={styles.statusRow}>
            <Ionicons name="information-circle" size={16} color="#6b7280" />
            <Text style={styles.statusText}>
              Status: <Text style={{ color: statusColor, fontWeight: '600' }}>
                {status}
              </Text>
            </Text>
          </View>
          
          {item.description && (
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          
          <View style={styles.footer}>
            <Text style={styles.viewDetails}>
              Tap to view details →
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading Benefits...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={64} color="#fff" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchBenefits}
          >
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
            onRefresh={fetchBenefits}
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
          <Text style={styles.headerTitle}>My Benefits</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Statistics */}
        {renderStatsCard()}

        {/* Benefits List */}
        <View style={styles.benefitsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Available Benefits ({benefits.length})
            </Text>
            <Text style={styles.sectionSubtitle}>
              {stats.available} benefits ready to claim
            </Text>
          </View>

          {benefits.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="gift-outline" size={64} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No Benefits Available</Text>
              <Text style={styles.emptyText}>
                Check back later for new benefits and support programs
              </Text>
            </View>
          ) : (
            <FlatList
              data={benefits}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderBenefitItem}
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
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

  // Statistics
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
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
    width: 48,
    height: 48,
    borderRadius: 24,
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

  // Benefits Section
  benefitsSection: {
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

  // Benefit Cards
  benefitCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8
  },
  firstCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b'
  },
  benefitHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  benefitIconContainer: {
    marginRight: 12
  },
  benefitIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center'
  },
  benefitInfo: {
    flex: 1,
    marginRight: 8
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 20
  },
  benefitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500'
  },
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669'
  },
  statusContainer: {
    alignSelf: 'flex-start'
  },
  statusBadge: {
    borderRadius: 12
  },

  // Benefit Details
  benefitDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  statusText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6
  },
  description: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 8
  },
  footer: {
    alignItems: 'flex-end'
  },
  viewDetails: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500'
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

  // Error State
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },

  bottomSpacing: {
    height: 20
  }
});