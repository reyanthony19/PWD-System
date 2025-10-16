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
  Alert
} from "react-native";
import { Card, Avatar, Badge } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import api from "@/services/api";
import { LinearGradient } from "expo-linear-gradient";
import NetInfo from '@react-native-community/netinfo';

const { width } = Dimensions.get("window");

// Cache keys for benefits
const CACHE_KEYS = {
  BENEFITS: 'cached_benefits_all',
  LAST_UPDATED: 'cache_benefits_last_updated',
  APP_STATE: 'cached_app_state_benefits_all'
};

// Cache expiration time (24 hours for offline)
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000;
// Background refresh interval (5 minutes)
const BACKGROUND_REFRESH_INTERVAL = 5 * 60 * 1000;

export default function Benefits() {
  const navigation = useNavigation();

  const [benefits, setBenefits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [stats, setStats] = useState({
    totalBenefits: 0,
    active: 0,
    completed: 0,
    cash: 0,
    relief: 0
  });

  const lastFetchRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // Subscribe to network state updates
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });

    return () => {
      isMountedRef.current = false;
      unsubscribeNetInfo();
    };
  }, []);

  // Cache management functions
  const saveToCache = async (key, data) => {
    try {
      const cacheData = {
        data: data,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.log('Error saving to cache:', error);
    }
  };

  const getFromCache = async (key) => {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const cacheData = JSON.parse(cached);
        const isExpired = Date.now() - cacheData.timestamp > CACHE_EXPIRY_TIME;
        return {
          data: cacheData.data,
          isExpired,
          timestamp: cacheData.timestamp
        };
      }
      return null;
    } catch (error) {
      console.log('Error reading from cache:', error);
      return null;
    }
  };

  const clearCache = async () => {
    try {
      await AsyncStorage.multiRemove(Object.values(CACHE_KEYS));
    } catch (error) {
      console.log('Error clearing cache:', error);
    }
  };

  // Save complete app state for offline use
  const saveAppState = async (state) => {
    try {
      await saveToCache(CACHE_KEYS.APP_STATE, state);
      await saveToCache(CACHE_KEYS.LAST_UPDATED, { timestamp: Date.now() });
      setLastSync(new Date().toLocaleString());
    } catch (error) {
      console.log('Error saving app state:', error);
    }
  };

  // Load complete app state for offline use
  const loadAppState = async () => {
    try {
      const appState = await getFromCache(CACHE_KEYS.APP_STATE);
      const syncInfo = await getFromCache(CACHE_KEYS.LAST_UPDATED);

      if (appState && appState.data) {
        const { benefits, stats } = appState.data;

        setBenefits(benefits || []);
        setStats(stats || {
          totalBenefits: 0,
          active: 0,
          completed: 0,
          cash: 0,
          relief: 0
        });

        if (syncInfo && syncInfo.data) {
          setLastSync(new Date(syncInfo.data.timestamp).toLocaleString());
        }

        return true;
      }
      return false;
    } catch (error) {
      console.log('Error loading app state:', error);
      return false;
    }
  };

  const loadCachedData = async () => {
    try {
      const hasAppState = await loadAppState();
      if (hasAppState) {
        setUsingCachedData(true);
        return true;
      }
      return false;
    } catch (error) {
      console.log('Error loading cached data:', error);
      return false;
    }
  };

  // Calculate benefit statistics
  const calculateStats = (benefitsData) => {
    if (!benefitsData || !Array.isArray(benefitsData)) {
      return {
        totalBenefits: 0,
        active: 0,
        completed: 0,
        cash: 0,
        relief: 0
      };
    }

    const stats = {
      totalBenefits: benefitsData.length,
      active: benefitsData.filter(benefit => 
        benefit.status === 'available' || benefit.status === 'active'
      ).length,
      completed: benefitsData.filter(benefit => 
        benefit.status === 'completed' || benefit.status === 'expired'
      ).length,
      cash: benefitsData.filter(benefit => 
        benefit.type?.toLowerCase() === 'cash'
      ).length,
      relief: benefitsData.filter(benefit => 
        benefit.type?.toLowerCase() === 'relief'
      ).length
    };

    return stats;
  };

  // Sort benefits: active first, then by date
  const sortBenefits = (benefits) => {
    if (!benefits || !Array.isArray(benefits)) return [];

    return benefits.sort((a, b) => {
      const isAActive = a.status === 'available' || a.status === 'active';
      const isBActive = b.status === 'available' || b.status === 'active';

      // Prioritize active benefits
      if (isAActive && !isBActive) return -1;
      if (!isAActive && isBActive) return 1;

      // If both are active or both are completed, sort by date (newest first)
      const dateA = new Date(a.start_date || a.created_at);
      const dateB = new Date(b.start_date || b.created_at);
      return dateB - dateA;
    });
  };

  // Check if benefit is new (within last 7 days)
  const isBenefitNew = (benefitDate) => {
    if (!benefitDate) return false;

    const currentDate = new Date();
    const benefitDateObj = new Date(benefitDate);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(currentDate.getDate() - 7);

    return benefitDateObj >= sevenDaysAgo;
  };

  // Check if benefit is active
  const isBenefitActive = (benefit) => {
    return benefit && (benefit.status === 'available' || benefit.status === 'active');
  };

  // Fetch ALL benefits (not filtered by user participation)
  const fetchBenefits = async (forceRefresh = false, silentRefresh = false) => {
    // Prevent multiple simultaneous fetches
    const now = Date.now();
    if (!forceRefresh && now - lastFetchRef.current < 2000) {
      console.log('Skipping benefits fetch - too recent');
      return;
    }
    lastFetchRef.current = now;

    try {
      if (forceRefresh && !silentRefresh) {
        setRefreshing(true);
      } else if (!silentRefresh) {
        setLoading(true);
      }

      setError("");

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.replace("Login");
        return;
      }

      // Try to load from cache first if not forcing refresh
      if (!forceRefresh && !silentRefresh) {
        const hasCachedData = await loadCachedData();
        if (hasCachedData) {
          if (!silentRefresh) {
            setLoading(false);
            setRefreshing(false);
          }
          // Even if we have cache, do a background refresh if online and cache is stale
          if (isOnline) {
            const cachedAppState = await getFromCache(CACHE_KEYS.APP_STATE);
            const isCacheStale = cachedAppState &&
              (Date.now() - cachedAppState.timestamp > BACKGROUND_REFRESH_INTERVAL);

            if (isCacheStale) {
              console.log('Benefits cache is stale, performing background refresh');
              fetchBenefits(false, true); // Silent background refresh
            }
          }
          return;
        }
      }

      // If offline and no cache, show error
      if (!isOnline && !forceRefresh && !silentRefresh) {
        const hasCachedData = await loadCachedData();
        if (!hasCachedData) {
          setError("No internet connection and no cached data available.");
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }

      let benefitsData = [];
      
      // Fetch benefits if online
      if (isOnline) {
        try {
          const res = await api.get("/benefits-lists", {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          // Handle different response formats
          benefitsData = res.data.data || res.data || [];
          
          await saveToCache(CACHE_KEYS.BENEFITS, benefitsData);
          console.log(`Fetched ${benefitsData.length} benefits`);
        } catch (err) {
          console.error("Benefits fetch error:", err);
          // If online fetch fails, try to use cached benefits
          const cachedBenefits = await getFromCache(CACHE_KEYS.BENEFITS);
          if (cachedBenefits && cachedBenefits.data) {
            benefitsData = cachedBenefits.data;
            console.log('Using cached benefits due to API error');
          } else {
            throw new Error("Failed to fetch benefits");
          }
        }
      } else {
        // Offline - use cached benefits
        const cachedBenefits = await getFromCache(CACHE_KEYS.BENEFITS);
        if (cachedBenefits && cachedBenefits.data) {
          benefitsData = cachedBenefits.data;
        } else {
          throw new Error("OFFLINE_NO_CACHE");
        }
      }

      // SORT BENEFITS: ACTIVE FIRST
      const sortedBenefits = sortBenefits(benefitsData);

      // Calculate statistics
      const newStats = calculateStats(sortedBenefits);

      // Update state
      if (isMountedRef.current) {
        setBenefits(sortedBenefits);
        setStats(newStats);
        setUsingCachedData(!isOnline && !forceRefresh);

        // Save complete app state for offline use
        await saveAppState({
          benefits: sortedBenefits,
          stats: newStats
        });

        if (silentRefresh) {
          console.log('Benefits background refresh completed');
        }
      }

    } catch (err) {
      console.error("Benefits fetch error:", err);

      if (isMountedRef.current && !silentRefresh) {
        if (err.message === 'OFFLINE_NO_CACHE') {
          setError("You're offline and no cached data is available.");
        } else if (err.response?.status === 401) {
          await AsyncStorage.removeItem("token");
          navigation.replace("Login");
          return;
        } else {
          setError("Failed to load benefits. " + (err.message || ""));

          // Try to load cached data as fallback
          const hasCachedData = await loadCachedData();
          if (!hasCachedData && !isOnline) {
            setError("No internet connection and no cached data available.");
          }
        }
      }
    } finally {
      if (isMountedRef.current && !silentRefresh) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  // Focus effect with automatic refetch
  useFocusEffect(
    React.useCallback(() => {
      if (!isMountedRef.current) return;

      const initializeData = async () => {
        console.log('Benefits screen focused - initializing data');

        // First try to load from cache immediately for fast startup
        const cachedLoaded = await loadCachedData();

        if (cachedLoaded) {
          setLoading(false);
          // Always try to refresh in background if online (even if we have cache)
          if (isOnline) {
            // Check if cache is stale or we should force refresh
            const cachedAppState = await getFromCache(CACHE_KEYS.APP_STATE);
            const shouldRefresh = !cachedAppState ||
              (Date.now() - cachedAppState.timestamp > BACKGROUND_REFRESH_INTERVAL);

            if (shouldRefresh) {
              console.log('Auto-refreshing benefits on screen focus');
              fetchBenefits(false, true); // Silent background refresh
            }
          }
        } else {
          // No cache exists, do initial load
          console.log('No benefits cache found - performing initial load');
          fetchBenefits(false, false);
        }
      };

      initializeData();

      // Cleanup function
      return () => {
        console.log('Benefits screen unfocused');
      };
    }, [isOnline])
  );

  const handleManualRefresh = () => {
    if (isOnline) {
      console.log('Manual benefits refresh triggered');
      fetchBenefits(true, false);
    } else {
      setRefreshing(false);
      Alert.alert(
        "Offline",
        "Cannot refresh while offline. Connect to internet and try again.",
        [{ text: "OK" }]
      );
    }
  };

  const forceRefresh = async () => {
    await clearCache();
    fetchBenefits(true, false);
  };

  // Benefit status calculation
  const getBenefitStatus = (benefit) => {
    if (!benefit) return { status: "Unknown", color: "#6b7280", icon: "help-circle" };

    if (benefit.status === 'available' || benefit.status === 'active') {
      return { status: "Active", color: "#10b981", icon: "check-circle" };
    } else if (benefit.status === 'completed') {
      return { status: "Completed", color: "#3b82f6", icon: "archive-check" };
    } else if (benefit.status === 'expired') {
      return { status: "Expired", color: "#ef4444", icon: "clock-alert" };
    } else {
      return { status: "Unknown", color: "#6b7280", icon: "help-circle" };
    }
  };

  const getBenefitTypeIcon = (benefitType) => {
    switch (benefitType?.toLowerCase()) {
      case "cash":
        return "cash";
      case "relief":
        return "package-variant";
      case "financial":
        return "cash";
      case "food":
        return "food";
      case "medical":
        return "hospital";
      case "educational":
        return "school";
      case "housing":
        return "home";
      default:
        return "gift";
    }
  };

  // Calculate budget and remaining for benefit card
  const calculateBenefitBudget = (item) => {
    // Calculate total budget
    let totalBudget = 0;
    if (item.type?.toLowerCase() === "cash") {
      totalBudget = (item.budget_amount || 0) * (item.locked_member_count || 0);
    } else {
      totalBudget = (item.budget_quantity || 0) * (item.locked_member_count || 0);
    }

    // Calculate remaining
    let remaining = 0;
    if (item.type?.toLowerCase() === "cash") {
      remaining = totalBudget - (item.records_count || 0) * (item.budget_amount || 0);
    } else {
      remaining = totalBudget - (item.records_count || 0) * (item.budget_quantity || 0);
    }

    return { totalBudget, remaining };
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
        <Text style={styles.statNumber}>{stats.active}</Text>
        <Text style={styles.statLabel}>Active</Text>
      </View>

      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
          <Ionicons name="archive" size={24} color="#3b82f6" />
        </View>
        <Text style={styles.statNumber}>{stats.completed}</Text>
        <Text style={styles.statLabel}>Completed</Text>
      </View>

      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
          <MaterialCommunityIcons name="cash" size={24} color="#a855f7" />
        </View>
        <Text style={styles.statNumber}>{stats.cash}</Text>
        <Text style={styles.statLabel}>Cash</Text>
      </View>
    </View>
  );

  const renderBenefitItem = ({ item, index }) => {
    if (!item) return null;

    const benefitStatus = getBenefitStatus(item);
    const benefitTypeIcon = getBenefitTypeIcon(item.type);
    const isNew = isBenefitNew(item.start_date || item.created_at);
    const isActive = isBenefitActive(item);
    const { totalBudget, remaining } = calculateBenefitBudget(item);

    return (
      <TouchableOpacity
        style={[
          styles.benefitCard,
          index === 0 && styles.firstCard,
          isActive && styles.activeCard,
          isNew && styles.newCard
        ]}
        onPress={() =>
          navigation.navigate("BenefitAttendance", { 
            benefitId: item.id, 
            title: item.name || item.title 
          })
        }
      >
        {/* Benefit Banner */}
        {(isNew || isActive) && (
          <View style={[
            styles.benefitBanner,
            isNew ? styles.newBanner : styles.activeBanner
          ]}>
            <Ionicons
              name={isNew ? "flash" : "gift"}
              size={14}
              color="#fff"
            />
            <Text style={styles.bannerText}>
              {isNew ? "New" : "Active"}
            </Text>
          </View>
        )}

        <View style={styles.benefitHeader}>
          <View style={styles.benefitIconContainer}>
            <View style={[styles.benefitIcon, { backgroundColor: '#10b981' }]}>
              <MaterialCommunityIcons
                name={benefitTypeIcon}
                size={24}
                color="#fff"
              />
            </View>
          </View>

          <View style={styles.benefitInfo}>
            <Text style={styles.benefitTitle} numberOfLines={2}>
              {item.name || item.title || "Untitled Benefit"}
            </Text>
            <View style={styles.benefitMeta}>
              <View style={styles.type}>
                <Ionicons name="pricetag" size={14} color="#6b7280" />
                <Text style={styles.typeText}>
                  {item.type || "General Benefit"}
                </Text>
              </View>
              <View style={styles.memberCount}>
                <Ionicons name="people" size={14} color="#6b7280" />
                <Text style={styles.memberCountText}>
                  {item.locked_member_count || 0} members
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statusContainer}>
            <Badge
              style={[styles.statusBadge, { backgroundColor: benefitStatus.color }]}
              size={24}
            >
              <MaterialCommunityIcons
                name={benefitStatus.icon}
                size={14}
                color="#fff"
              />
            </Badge>
          </View>
        </View>

        <View style={styles.benefitDetails}>
          <View style={styles.budgetRow}>
            <View style={styles.budgetItem}>
              <Ionicons name="wallet" size={16} color="#6b7280" />
              <Text style={styles.budgetLabel}>Total Budget:</Text>
              <Text style={styles.budgetValue}>
                {item.type?.toLowerCase() === "cash" 
                  ? `₱${Number(totalBudget).toLocaleString()}`
                  : `${totalBudget} ${item.unit || ""}`
                }
              </Text>
            </View>
            
            <View style={styles.budgetItem}>
              <Ionicons name="trending-down" size={16} color="#6b7280" />
              <Text style={styles.budgetLabel}>Remaining:</Text>
              <Text style={[
                styles.budgetValue,
                { color: remaining > 0 ? '#10b981' : '#ef4444' }
              ]}>
                {item.type?.toLowerCase() === "cash" 
                  ? `₱${Number(remaining).toLocaleString()}`
                  : `${remaining} ${item.unit || ""}`
                }
              </Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <View style={styles.recordsInfo}>
              <Text style={styles.recordsLabel}>
                Records: {item.records_count || 0} / {item.locked_member_count || 0}
              </Text>
            </View>

            <Text style={styles.viewDetails}>
              View Attendance →
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
        <SafeAreaView style={styles.loader}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading Benefits...</Text>
          {!isOnline && (
            <Text style={styles.offlineHint}>You're offline - using cached data</Text>
          )}
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error && (!benefits || benefits.length === 0)) {
    return (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
        <SafeAreaView style={styles.center}>
          <Ionicons name="alert-circle" size={64} color="#fff" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={forceRefresh}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
          {!isOnline && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.secondaryButtonText}>Go Back</Text>
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleManualRefresh}
              colors={["#fff"]}
              tintColor="#fff"
              enabled={isOnline}
            />
          }
        >
          {/* Header with connection status */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>All Benefits</Text>
              <Text style={styles.headerSubtitle}>
                Manage and track all benefits
                {!isOnline && " • Offline"}
                {usingCachedData && " • Using Cached Data"}
              </Text>
            </View>
            <View style={styles.headerRight}>
              {!isOnline && (
                <Ionicons name="cloud-offline" size={20} color="#f59e0b" style={styles.offlineIcon} />
              )}
              <Avatar.Icon
                size={50}
                icon="gift"
                style={styles.headerIcon}
              />
            </View>
          </View>

          {/* Connection Status Banner */}
          {!isOnline && (
            <View style={styles.offlineBanner}>
              <Ionicons name="cloud-offline" size={16} color="#fff" />
              <Text style={styles.offlineText}>
                You're offline. Showing cached data.
              </Text>
            </View>
          )}

          {/* Last Sync Info */}
          {lastSync && (
            <View style={styles.syncInfo}>
              <Text style={styles.syncInfoText}>
                Last synced: {lastSync}
              </Text>
            </View>
          )}

          {/* Statistics */}
          {renderStatsCard()}

          {/* Benefits List */}
          <View style={styles.benefitsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                All Benefits ({benefits ? benefits.length : 0})
              </Text>
              <Text style={styles.sectionSubtitle}>
                {stats.active} active benefits • Prioritized by status
                {usingCachedData && " • Cached"}
              </Text>
            </View>

            {!benefits || benefits.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="gift-outline" size={64} color="#9ca3af" />
                <Text style={styles.emptyTitle}>
                  {isOnline ? 'No Benefits Available' : 'No Cached Data'}
                </Text>
                <Text style={styles.emptyText}>
                  {isOnline
                    ? 'There are no benefits available at the moment'
                    : 'Connect to internet to load benefits'
                  }
                </Text>
                {!isOnline && (
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={handleManualRefresh}
                  >
                    <Text style={styles.retryText}>Try Again</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <FlatList
                data={benefits}
                keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
                renderItem={renderBenefitItem}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  safeArea: {
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
  offlineHint: {
    marginTop: 8,
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    textAlign: 'center'
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
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
    borderRadius: 12,
    marginBottom: 8
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  secondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff'
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4
  },
  headerIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },

  // Offline Banner
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  offlineText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },

  // Sync Info
  syncInfo: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: -8
  },
  syncInfoText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center'
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

  // Benefit Cards with Banners
  benefitCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    position: 'relative',
    overflow: 'hidden'
  },
  firstCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b'
  },
  activeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981'
  },
  newCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6'
  },
  // Benefit Banner
  benefitBanner: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 12,
    zIndex: 1
  },
  newBanner: {
    backgroundColor: '#3b82f6'
  },
  activeBanner: {
    backgroundColor: '#10b981'
  },
  bannerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4
  },
  benefitHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    marginTop: 4
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
    flexWrap: 'wrap'
  },
  type: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12
  },
  typeText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  memberCountText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
    marginLeft: 4
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
  budgetRow: {
    marginBottom: 12
  },
  budgetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  budgetLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
    marginRight: 8,
    fontWeight: '500'
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827'
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  recordsInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  recordsLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500'
  },
  viewDetails: {
    fontSize: 14,
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
    marginBottom: 8,
    textAlign: 'center'
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16
  },

  bottomSpacing: {
    height: 20
  }
});