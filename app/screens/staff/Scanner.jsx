import React, { useState, useEffect } from "react";
import {
  StatusBar,
  StyleSheet,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { CameraView } from "expo-camera";
import { useIsFocused } from "@react-navigation/native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from '@react-native-community/netinfo';
import api from "@/services/api";

const { width, height } = Dimensions.get("window");
const cutoutSize = 250;
const borderWidth = 3;
const cornerLength = 28;

// Offline storage keys
const OFFLINE_KEYS = {
  PENDING_ATTENDANCE: 'pending_attendance_records',
  ALL_MEMBERS_CACHE: 'all_members_cache',
  MEMBERS_LAST_SYNC: 'members_last_sync',
  EVENTS_CACHE: 'events_cache',
  SYNC_STATUS: 'sync_status'
};

// Cache duration - refresh data every 24 hours
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function Overlay() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={[styles.overlay, { height: (height - cutoutSize) / 2 }]} />
      <View style={{ flexDirection: "row" }}>
        <View style={[styles.overlay, { width: (width - cutoutSize) / 2 }]} />
        <View style={{ width: cutoutSize, height: cutoutSize }}>
          <View style={[styles.corner, { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 }]} />
          <View style={[styles.corner, { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 }]} />
          <View style={[styles.corner, { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 }]} />
          <View style={[styles.corner, { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 }]} />
        </View>
        <View style={[styles.overlay, { width: (width - cutoutSize) / 2 }]} />
      </View>
      <View style={[styles.overlay, { flex: 1 }]} />
    </View>
  );
}

export default function Scanner({ navigation, route }) {
  const eventId = route?.params?.eventId ?? null;
  const insets = useSafeAreaInsets();
  const [memberData, setMemberData] = useState(null);
  const [error, setError] = useState("");
  const [scanned, setScanned] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [membersCache, setMembersCache] = useState({});
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const isFocused = useIsFocused();

  // Check network status and load data cache
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
      if (state.isConnected) {
        syncPendingRecords();
        // Refresh cache when online
        fetchAndCacheMembers();
        if (eventId) {
          fetchAndCacheEvent();
        }
      }
    });

    loadMembersCache();
    loadPendingCount();
    if (eventId) {
      loadEventCache();
    }

    return unsubscribe;
  }, [eventId]);

  // Load all members from cache
  const loadMembersCache = async () => {
    try {
      const cachedMembers = await AsyncStorage.getItem(OFFLINE_KEYS.ALL_MEMBERS_CACHE);
      if (cachedMembers) {
        const members = JSON.parse(cachedMembers);
        setMembersCache(members);
        console.log(`📚 Loaded ${Object.keys(members).length} members from cache`);
      }
    } catch (error) {
      console.error('Error loading members cache:', error);
    }
  };

  // Load event from cache
  const loadEventCache = async () => {
    try {
      const cachedEvents = await AsyncStorage.getItem(OFFLINE_KEYS.EVENTS_CACHE);
      if (cachedEvents) {
        const events = JSON.parse(cachedEvents);
        const event = events[eventId];
        if (event) {
          setCurrentEvent(event);
          console.log('📅 Loaded event from cache:', event.title);
        }
      }
    } catch (error) {
      console.error('Error loading event cache:', error);
    }
  };

  // Fetch all members and cache them
  const fetchAndCacheMembers = async () => {
    if (!isOnline || isLoadingMembers) return;

    try {
      setIsLoadingMembers(true);
      
      // Check if cache is still valid
      const lastSync = await AsyncStorage.getItem(OFFLINE_KEYS.MEMBERS_LAST_SYNC);
      const now = Date.now();
      
      if (lastSync && (now - parseInt(lastSync)) < CACHE_DURATION) {
        console.log('✅ Members cache is still fresh');
        return;
      }

      console.log('🔄 Fetching all members from API...');
      
      const token = await AsyncStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await api.get("/users?role=member", { headers });
      const members = response.data || [];

      // Create a cache object with ID number as key for quick lookup
      const membersCacheObj = {};
      let cachedCount = 0;

      members.forEach(member => {
        const idNumber = member.member_profile?.id_number;
        if (idNumber) {
          membersCacheObj[idNumber] = member;
          cachedCount++;
        }
      });

      // Save to cache
      await AsyncStorage.setItem(OFFLINE_KEYS.ALL_MEMBERS_CACHE, JSON.stringify(membersCacheObj));
      await AsyncStorage.setItem(OFFLINE_KEYS.MEMBERS_LAST_SYNC, now.toString());
      
      setMembersCache(membersCacheObj);
      console.log(`✅ Cached ${cachedCount} members for offline use`);

    } catch (error) {
      console.error('Error fetching members:', error);
      // Don't show error to user - we'll use cached data
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // Fetch and cache event data
  const fetchAndCacheEvent = async () => {
    if (!isOnline || !eventId) return;

    try {
      console.log('🔄 Fetching event data...');
      
      const response = await api.get(`/events/${eventId}`);
      const eventData = response.data;

      // Cache the event
      const cachedEvents = await AsyncStorage.getItem(OFFLINE_KEYS.EVENTS_CACHE);
      const events = cachedEvents ? JSON.parse(cachedEvents) : {};
      events[eventId] = {
        ...eventData,
        cached_at: new Date().toISOString()
      };
      
      await AsyncStorage.setItem(OFFLINE_KEYS.EVENTS_CACHE, JSON.stringify(events));
      setCurrentEvent(eventData);
      
      console.log('✅ Cached event:', eventData.title);

    } catch (error) {
      console.error('Error fetching event:', error);
      // Don't show error - we'll use cached data if available
    }
  };

  // Load count of pending records
  const loadPendingCount = async () => {
    try {
      const records = await AsyncStorage.getItem(OFFLINE_KEYS.PENDING_ATTENDANCE);
      const allRecords = records ? JSON.parse(records) : [];
      const eventPending = eventId ? allRecords.filter(record => record.event_id === eventId) : allRecords;
      setPendingCount(eventPending.length);
    } catch (error) {
      console.error('Error loading pending count:', error);
    }
  };

  // Save record to offline storage
  const saveOfflineRecord = async (memberId, memberInfo) => {
    try {
      const record = {
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        member_id: memberId,
        member_info: memberInfo,
        event_id: eventId,
        scanned_at: new Date().toISOString(),
        status: 'pending',
        created_at: new Date().toISOString(),
        is_offline: true
      };

      const existingRecords = await AsyncStorage.getItem(OFFLINE_KEYS.PENDING_ATTENDANCE);
      const allRecords = existingRecords ? JSON.parse(existingRecords) : [];
      allRecords.push(record);

      await AsyncStorage.setItem(OFFLINE_KEYS.PENDING_ATTENDANCE, JSON.stringify(allRecords));
      setPendingCount(prev => prev + 1);

      return record;
    } catch (error) {
      console.error('Error saving offline record:', error);
      throw error;
    }
  };

  // Sync pending records when online
  const syncPendingRecords = async () => {
    if (!isOnline) return;

    try {
      const records = await AsyncStorage.getItem(OFFLINE_KEYS.PENDING_ATTENDANCE);
      const allRecords = records ? JSON.parse(records) : [];
      
      if (allRecords.length === 0) return;

      const eventRecords = eventId ? allRecords.filter(record => record.event_id === eventId) : allRecords;
      let successCount = 0;

      for (const record of eventRecords) {
        try {
          await api.post(`/events/${record.event_id}/attendances`, { 
            user_id: record.member_id 
          });
          successCount++;
        } catch (error) {
          console.error('Failed to sync record:', record.id, error);
        }
      }

      // Remove successfully synced records
      if (successCount > 0) {
        const updatedRecords = allRecords.filter(record => 
          !eventRecords.slice(0, successCount).includes(record)
        );
        await AsyncStorage.setItem(OFFLINE_KEYS.PENDING_ATTENDANCE, JSON.stringify(updatedRecords));
        setPendingCount(prev => Math.max(0, prev - successCount));
        
        if (successCount === eventRecords.length) {
          Alert.alert("✅ Sync Complete", `Successfully synced ${successCount} record(s)`);
        }
      }
    } catch (error) {
      console.error('Error during sync:', error);
    }
  };

  // Find member in cache by ID number
  const findMemberInCache = (memberId) => {
    // Try exact match first
    let member = membersCache[memberId];
    
    if (!member) {
      // Try case-insensitive search
      const lowerCaseId = memberId.toLowerCase();
      member = Object.values(membersCache).find(m => 
        m.member_profile?.id_number?.toLowerCase() === lowerCaseId
      );
    }
    
    return member;
  };

  const handleBarcodeScanned = async ({ data }) => {
    if (scanned || isProcessing) return;
    
    setScanned(true);
    setIsProcessing(true);
    setError("");
    setMemberData(null);

    const memberId = data.trim();

    try {
      let memberInfo;
      
      if (isOnline) {
        // Online: Try API first, fallback to cache
        try {
          const response = await api.get(`/scanMember`, { params: { id_number: memberId } });
          memberInfo = response.data.member;
        } catch (apiError) {
          console.log('API failed, trying cache...');
          memberInfo = findMemberInCache(memberId);
          if (!memberInfo) {
            throw apiError;
          }
        }
      } else {
        // Offline: Use cached member data only
        memberInfo = findMemberInCache(memberId);
        if (!memberInfo) {
          throw new Error("Member not found in cached list.");
        }
      }

      setMemberData(memberInfo);

      if (eventId) {
        if (isOnline) {
          // Online: Submit directly
          try {
            await api.post(`/events/${eventId}/attendances`, { user_id: memberInfo.id });
            Alert.alert("✅ Success", "Attendance recorded online!");
          } catch (postError) {
            // If online submission fails, save offline instead
            console.log('Online submission failed, saving offline...');
            await saveOfflineRecord(memberInfo.id, memberInfo);
            Alert.alert(
              "📱 Saved Offline", 
              "Network issue - attendance saved locally. It will sync when back online.",
              [{ text: "OK", style: "default" }]
            );
          }
        } else {
          // Offline: Save locally
          await saveOfflineRecord(memberInfo.id, memberInfo);
          Alert.alert(
            "📱 Saved Offline", 
            "Attendance saved locally. It will sync automatically when you're back online.",
            [
              { 
                text: "View Pending", 
                onPress: () => navigation.navigate("PendingAttendance", { eventId }) 
              },
              { text: "Continue Scanning", style: "default" }
            ]
          );
        }
      } else {
        // No event ID - just show member info
        Alert.alert("✅ Member Found", `Scanned: ${memberInfo.member_profile?.first_name} ${memberInfo.member_profile?.last_name}`);
      }
    } catch (err) {
      console.error("Scan error:", err);
      
      // Handle different error types gracefully
      if (err.message === "Member not found in cached list.") {
        setError("Member not found in cached list. Connect to internet to refresh member database.");
      } else if (err.response?.status === 404) {
        setError("Member not found in system.");
      } else if (err.message?.includes('Network Error')) {
        setError("Network unavailable. Using offline mode with cached data.");
      } else {
        setError(err.response?.data?.message || "Scan failed. Please try again.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScanAgain = () => {
    setScanned(false);
    setMemberData(null);
    setError("");
  };

  const handleRefreshMembers = async () => {
    if (!isOnline) {
      Alert.alert("Offline", "Cannot refresh members while offline.");
      return;
    }
    await fetchAndCacheMembers();
  };

  const profile = memberData?.member_profile || {};
  const fullName = [profile.first_name, profile.middle_name, profile.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" />

      {isFocused && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr", "code128"],
          }}
        />
      )}

      <Overlay />

      {/* Status Indicators */}
      <View style={styles.statusBar}>
        {!isOnline && (
          <View style={styles.offlineIndicator}>
            <Ionicons name="cloud-offline" size={14} color="#fff" />
            <Text style={styles.offlineText}>OFFLINE</Text>
          </View>
        )}
        
        {pendingCount > 0 && (
          <TouchableOpacity 
            style={styles.pendingIndicator}
            onPress={() => navigation.navigate("PendingAttendance", { eventId })}
          >
            <Ionicons name="time" size={14} color="#fff" />
            <Text style={styles.pendingText}>{pendingCount}</Text>
          </TouchableOpacity>
        )}

        {/* Members Cache Info */}
        <TouchableOpacity 
          style={styles.membersIndicator}
          onPress={handleRefreshMembers}
        >
          <Ionicons name="people" size={14} color="#fff" />
          <Text style={styles.membersText}>{Object.keys(membersCache).length}</Text>
        </TouchableOpacity>
      </View>

      {/* Event Info */}
      {currentEvent && (
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{currentEvent.title}</Text>
          <Text style={styles.eventDate}>
            {new Date(currentEvent.event_date).toLocaleDateString()}
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={[styles.backButton, { top: insets.top + 10 }]}
      >
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </TouchableOpacity>

      {/* Manual Sync Button */}
      {pendingCount > 0 && isOnline && (
        <TouchableOpacity
          onPress={syncPendingRecords}
          style={[styles.syncButton, { top: insets.top + 10 }]}
        >
          <Ionicons name="cloud-upload" size={20} color="#fff" />
        </TouchableOpacity>
      )}

      <View style={[styles.infoContainer, { paddingBottom: insets.bottom + 80 }]}>
        <View style={styles.infoCard}>
          {isLoadingMembers ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.processingText}>Refreshing member list...</Text>
            </View>
          ) : isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="warning" size={24} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
              {!isOnline && (
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={() => navigation.navigate("Attendance", { eventId })}
                >
                  <Text style={styles.refreshButtonText}>Go Back to Refresh</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : memberData ? (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
              <Text style={styles.nameText}>{fullName || memberData.username}</Text>
              <Text style={styles.idText}>ID: {profile.id_number || "-"}</Text>
              {!isOnline && (
                <Text style={styles.offlineSavedText}>📱 Saved offline</Text>
              )}
            </View>
          ) : (
            <View style={styles.readyContainer}>
              <Ionicons name="scan" size={24} color="#64748b" />
              <Text style={styles.placeholderText}>Scan a member QR code</Text>
              <Text style={styles.cacheInfoText}>
                {Object.keys(membersCache).length} members cached
              </Text>
              {!isOnline && (
                <Text style={styles.offlineModeText}>Offline mode active</Text>
              )}
            </View>
          )}

          {scanned && !isProcessing && (
            <TouchableOpacity
              style={styles.scanAgainButton}
              onPress={handleScanAgain}
            >
              <Ionicons name="scan" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.scanAgainText}>Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  overlay: { backgroundColor: "rgba(0,0,0,0.55)" },
  corner: {
    position: "absolute",
    width: cornerLength,
    height: cornerLength,
    borderColor: "#4ade80",
    borderTopWidth: borderWidth,
    borderLeftWidth: borderWidth,
    borderRightWidth: borderWidth,
    borderBottomWidth: borderWidth,
    borderRadius: 4,
  },
  
  // Status Bar
  statusBar: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    zIndex: 5,
  },
  offlineIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  offlineText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  pendingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59, 130, 246, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pendingText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  membersIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  membersText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },

  // Event Info
  eventInfo: {
    position: "absolute",
    top: 100,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 5,
  },
  eventTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  eventDate: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },

  // Buttons
  backButton: {
    position: "absolute",
    left: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 50,
    padding: 10,
    zIndex: 10,
  },
  syncButton: {
    position: "absolute",
    right: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 50,
    padding: 10,
    zIndex: 10,
  },

  // Info Container
  infoContainer: { 
    position: "absolute", 
    bottom: 0, 
    left: 0, 
    right: 0, 
    alignItems: "center" 
  },
  infoCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
    width: width * 0.85,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  // Processing State
  processingContainer: {
    alignItems: "center",
  },
  processingText: {
    color: "#64748b",
    fontSize: 14,
    marginTop: 8,
  },

  // Ready State
  readyContainer: {
    alignItems: "center",
  },
  placeholderText: { 
    color: "#64748b", 
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
  },
  cacheInfoText: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  offlineModeText: {
    color: "#f59e0b",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },

  // Success State
  successContainer: {
    alignItems: "center",
  },
  nameText: { 
    color: "#0f172a", 
    fontSize: 18, 
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
  },
  idText: { 
    color: "#334155", 
    fontSize: 14, 
    marginTop: 4,
    textAlign: "center",
  },
  offlineSavedText: {
    color: "#f59e0b",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "500",
  },

  // Error State
  errorContainer: {
    alignItems: "center",
  },
  errorText: { 
    color: "#dc2626", 
    fontSize: 14, 
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
  refreshButton: {
    marginTop: 12,
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  // Scan Again Button
  scanAgainButton: {
    marginTop: 16,
    backgroundColor: "#2563eb",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  scanAgainText: { 
    color: "#fff", 
    fontSize: 14, 
    fontWeight: "600" 
  },
});

