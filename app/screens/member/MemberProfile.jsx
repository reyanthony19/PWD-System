import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Image,
  TouchableOpacity,
  Modal,
  RefreshControl // ADDED: Import RefreshControl
} from "react-native";
import { Button, Avatar, Card } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import api from "@/services/api";
import NetInfo from '@react-native-community/netinfo';

const { width } = Dimensions.get("window");

// Cache keys
const CACHE_KEYS = {
  USER_PROFILE: 'cached_user_profile',
  USER_DOCUMENTS: 'cached_user_documents',
  LAST_UPDATED: 'cache_last_updated'
};

// Cache expiration time (10 minutes)
const CACHE_EXPIRY_TIME = 10 * 60 * 1000;

const defaultValues = {
  contact_number: "No contact yet",
  address: "Address not provided",
  barangay: "Barangay not provided",
  blood_type: "Unknown",
  sss_number: "N/A",
  philhealth_number: "N/A",
  disability_type: "Not declared",
  guardian_full_name: "Guardian name missing",
  guardian_relationship: "Relationship not specified",
  guardian_contact_number: "No contact yet",
  guardian_address: "Guardian address missing",
  sex: "unspecified",
  first_name: "First name not set",
  middle_name: "Middle name not set",
  last_name: "Last name not set",
  birthdate: new Date().toISOString().split("T")[0],
};

export default function MemberProfile() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState({}); // FIXED: Initialize as empty object
  const [loading, setLoading] = useState(true);
  const [incompleteFields, setIncompleteFields] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Get base URL from api instance - FIXED: Handle case where baseURL might not be set
  const BASE_URL = api.defaults.baseURL || "http://192.168.1.101:8000";

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });

    return () => unsubscribeNetInfo();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchUserProfile();
    }, [])
  );

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
        // Check if cache is still valid
        if (Date.now() - cacheData.timestamp < CACHE_EXPIRY_TIME) {
          return cacheData.data;
        } else {
          // Clear expired cache
          await AsyncStorage.removeItem(key);
        }
      }
      return null;
    } catch (error) {
      console.log('Error reading from cache:', error);
      return null;
    }
  };

  const loadCachedData = async () => {
    try {
      const [cachedProfile, cachedDocuments] = await Promise.all([
        getFromCache(CACHE_KEYS.USER_PROFILE),
        getFromCache(CACHE_KEYS.USER_DOCUMENTS)
      ]);

      if (cachedProfile) {
        setUser(cachedProfile);

        // Use cached documents or empty object if none
        const documentsData = cachedDocuments || {};
        setDocuments(documentsData);

        // Calculate incomplete fields for cached data
        const profile = cachedProfile?.member_profile || {};
        const missing = [];
        Object.entries(defaultValues).forEach(([key, defValue]) => {
          if (
            profile[key] === defValue ||
            profile[key]?.toString().trim() === "" ||
            profile[key] == null
          ) {
            missing.push(key);
          }
        });
        setIncompleteFields(missing);

        setUsingCachedData(true);
        return true;
      }
      return false;
    } catch (error) {
      console.log('Error loading cached data:', error);
      return false;
    }
  };

  // FIXED: Improved document fetching with better error handling
  // FIXED: Improved document fetching with better error handling
  const getMemberDocuments = async (user_id) => {
    try {
      const res = await api.get(`/user/documents/${user_id}`);

      // Check if response has data and it's in expected format
      if (res.data && typeof res.data === 'object') {
        return res.data;
      } else {
        console.warn("Documents response format unexpected:", res.data);
        // Return default documents directly
        return {
          picture_2x2: null,
          barangay_indigency: null,
          medical_certificate: null,
          birth_certificate: null
        };
      }
    } catch (error) {
      console.error("Error fetching member documents:", error);

      // Return default documents structure if endpoint doesn't exist or fails
      return {
        picture_2x2: null,
        barangay_indigency: null,
        medical_certificate: null,
        birth_certificate: null
      };
    }
  };

  const fetchUserProfile = async (forceRefresh = false) => {
    try {
      setRefreshing(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Session Expired", "Please log in again.");
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      // Try to load from cache first if not forcing refresh and offline
      if (!forceRefresh && !isOnline) {
        const hasCachedData = await loadCachedData();
        if (hasCachedData) {
          setLoading(false);
          setRefreshing(false);
          return;
        } else {
          Alert.alert("Offline", "No internet connection and no cached data available.");
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }

      // If online or force refresh, fetch fresh data
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Fetch user profile
      const res = await api.get("/user");
      const userData = res.data;
      setUser(userData);
      await saveToCache(CACHE_KEYS.USER_PROFILE, userData);

      // Calculate incomplete fields
      const profile = userData?.member_profile || {};
      const missing = [];
      Object.entries(defaultValues).forEach(([key, defValue]) => {
        if (
          profile[key] === defValue ||
          profile[key]?.toString().trim() === "" ||
          profile[key] == null
        ) {
          missing.push(key);
        }
      });
      setIncompleteFields(missing);

      // Fetch documents - FIXED: Better error handling
      try {
        const userDocuments = await getMemberDocuments(userData.id);
        setDocuments(userDocuments);
        await saveToCache(CACHE_KEYS.USER_DOCUMENTS, userDocuments);
      } catch (docError) {
        console.error("Documents fetch failed, using empty documents:", docError);
        const emptyDocuments = {
          picture_2x2: null,
          barangay_indigency: null,
          medical_certificate: null,
          birth_certificate: null
        };
        setDocuments(emptyDocuments);
        await saveToCache(CACHE_KEYS.USER_DOCUMENTS, emptyDocuments);
      }

      setUsingCachedData(false);

    } catch (err) {
      console.error("Profile fetch error:", err.response?.data || err.message);

      // If online fetch fails, try to load cached data
      if (isOnline) {
        const hasCachedData = await loadCachedData();
        if (!hasCachedData) {
          Alert.alert("Error", "Failed to load profile. Please try again.");
        }
      } else {
        Alert.alert("Offline", "No internet connection. Using cached data if available.");
        await loadCachedData();
      }

      if (err.response?.status === 401) {
        await AsyncStorage.clear();
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchUserProfile(true); // Force refresh
  };

  const handleLogout = async () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear cache on logout
              await AsyncStorage.multiRemove([
                "token",
                "user",
                ...Object.values(CACHE_KEYS)
              ]);
              delete api.defaults.headers.common["Authorization"];
              navigation.reset({ index: 0, routes: [{ name: "Login" }] });
            } catch (err) {
              console.error("Logout error:", err);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          }
        }
      ]
    );
  };

  const getCompletionPercentage = () => {
    const totalFields = Object.keys(defaultValues).length;
    const completedFields = totalFields - incompleteFields.length;
    return Math.round((completedFields / totalFields) * 100);
  };

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setModalVisible(true);
  };

  const closeImageModal = () => {
    setModalVisible(false);
    setSelectedImage(null);
  };

  const isImageFile = (filename) => {
    if (!filename) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    return imageExtensions.some(ext =>
      filename.toLowerCase().includes(ext)
    );
  };

  const getDocumentIcon = (documentType, hasDocument) => {
    if (!hasDocument) {
      return "alert-circle";
    }

    switch (documentType) {
      case 'picture_2x2':
        return 'image';
      case 'barangay_indigency':
        return 'file-document';
      case 'medical_certificate':
        return 'hospital-box';
      case 'birth_certificate':
        return 'certificate';
      default:
        return 'file-document';
    }
  };

  const getDocumentColor = (hasDocument) => {
    return hasDocument ? "#10b981" : "#dc2626";
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  const profile = user?.member_profile || {};
  const docs = documents || {};
  const fullName = `${profile.first_name || ""} ${profile.middle_name || ""} ${profile.last_name || ""}`.trim();
  const completionPercentage = getCompletionPercentage();

  const personalInfoFields = [
    { label: "Username", value: user?.username, icon: "account", key: "username" },
    { label: "Email", value: user?.email, icon: "email", key: "email" },
    { label: "Contact Number", value: profile.contact_number, icon: "phone", key: "contact_number" },
    { label: "Birthdate", value: profile.birthdate ? profile.birthdate.split("T")[0] : null, icon: "calendar", key: "birthdate" },
  ];

  const addressFields = [
    { label: "Address", value: profile.address, icon: "home-map-marker", key: "address" },
    { label: "Barangay", value: profile.barangay, icon: "map-marker", key: "barangay" },
  ];

  const medicalFields = [
    { label: "Blood Type", value: profile.blood_type, icon: "blood-bag", key: "blood_type" },
    { label: "SSS Number", value: profile.sss_number, icon: "card-account-details", key: "sss_number" },
    { label: "PhilHealth Number", value: profile.philhealth_number, icon: "hospital-box", key: "philhealth_number" },
    { label: "Disability Type", value: profile.disability_type, icon: "wheelchair-accessibility", key: "disability_type" },
  ];

  const guardianFields = [
    { label: "Guardian Name", value: profile.guardian_full_name, icon: "account-group", key: "guardian_full_name" },
    { label: "Relationship", value: profile.guardian_relationship, icon: "heart", key: "guardian_relationship" },
    { label: "Guardian Contact", value: profile.guardian_contact_number, icon: "phone", key: "guardian_contact_number" },
    { label: "Guardian Address", value: profile.guardian_address, icon: "home", key: "guardian_address" },
  ];

  const documentFields = [
    {
      label: "2x2 Picture",
      value: docs.picture_2x2,
      icon: "image",
      key: "picture_2x2",
      type: "image"
    },
    {
      label: "Barangay Indigency",
      value: docs.barangay_indigency,
      icon: "file-document",
      key: "barangay_indigency",
      type: "document"
    },
    {
      label: "Medical Certificate",
      value: docs.medical_certificate,
      icon: "file-document",
      key: "medical_certificate",
      type: "document"
    },
    {
      label: "Birth Certificate",
      value: docs.birth_certificate,
      icon: "file-document",
      key: "birth_certificate",
      type: "document"
    },
  ];

  const renderField = (field, idx) => (
    <View key={idx} style={[
      styles.fieldContainer,
      incompleteFields.includes(field.key) && styles.incompleteField
    ]}>
      <View style={styles.fieldHeader}>
        <Icon name={field.icon} size={18} color="#4b5563" />
        <Text style={styles.fieldLabel}>{field.label}</Text>
        {incompleteFields.includes(field.key) && (
          <Icon name="alert-circle" size={16} color="#dc2626" style={styles.warningIcon} />
        )}
      </View>

      {field.key.includes("picture") && field.value ? (
        <TouchableOpacity onPress={() => openImageModal(`${BASE_URL}/storage/${field.value}`)}>
          <Image
            source={{ uri: `${BASE_URL}/storage/${field.value}` }}
            style={styles.documentImage}
          />
          <Text style={styles.viewImageText}>Tap to view</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.fieldValue}>
          {field.value || (
            <Text style={styles.missingText}>
              Not provided {incompleteFields.includes(field.key) && "• Required"}
            </Text>
          )}
        </Text>
      )}
    </View>
  );

  const renderDocumentCard = (title, fields) => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {fields.some(field => incompleteFields.includes(field.key)) && (
            <View style={styles.incompleteBadge}>
              <Text style={styles.incompleteBadgeText}>Needs Update</Text>
            </View>
          )}
        </View>
        {fields.map(renderField)}
      </Card.Content>
    </Card>
  );

  const renderDocumentItem = (field, idx) => {
    const hasDocument = !!field.value;
    const isImage = field.type === "image" || (field.value && isImageFile(field.value));

    return (
      <TouchableOpacity
        key={idx}
        style={styles.documentItem}
        onPress={() => hasDocument && isImage && openImageModal(`${BASE_URL}/storage/${field.value}`)}
        disabled={!hasDocument || !isImage}
      >
        <View style={styles.documentContent}>
          {hasDocument && isImage ? (
            <View style={styles.documentImageContainer}>
              <Image
                source={{ uri: `${BASE_URL}/storage/${field.value}` }}
                style={styles.documentThumbnail}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay}>
                <Icon name="eye" size={16} color="#fff" />
              </View>
            </View>
          ) : (
            <View style={styles.documentIconContainer}>
              <Icon
                name={getDocumentIcon(field.key, hasDocument)}
                size={24}
                color={getDocumentColor(hasDocument)}
              />
            </View>
          )}

          <View style={styles.documentTextContainer}>
            <Text style={styles.documentLabel}>{field.label}</Text>
            <Text style={[
              styles.documentStatus,
              { color: getDocumentColor(hasDocument) }
            ]}>
              {hasDocument ? (
                isImage ? "View Image" : "Document Uploaded"
              ) : "Missing"}
            </Text>
          </View>
        </View>

        {hasDocument && !isImage && (
          <View style={styles.documentBadge}>
            <Icon name="file-document" size={12} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl // FIXED: Now properly imported and used
            refreshing={refreshing}
            onRefresh={handleManualRefresh}
            colors={["#2563eb"]}
            tintColor="#2563eb"
            enabled={isOnline}
          />
        }
      >
        {/* Connection Status Banner */}
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Icon name="cloud-offline" size={16} color="#fff" />
            <Text style={styles.offlineText}>
              You're offline. Showing cached data.
            </Text>
          </View>
        )}

        {/* Profile Completion Banner */}
        {incompleteFields.length > 0 && (
          <TouchableOpacity
            style={styles.completionBanner}
            onPress={() => navigation.navigate("MemberEditProfile")}
          >
            <View style={styles.completionHeader}>
              <Icon name="alert-circle" size={20} color="#ffffff" />
              <Text style={styles.completionTitle}>Profile Incomplete</Text>
              {usingCachedData && (
                <Text style={styles.cachedIndicator}> • Cached</Text>
              )}
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${completionPercentage}%` }
                  ]}
                />
              </View>
              <Text style={styles.completionText}>
                {completionPercentage}% Complete • {incompleteFields.length} fields missing
              </Text>
            </View>
            <Text style={styles.completionSubtext}>
              Tap to complete your profile
            </Text>
          </TouchableOpacity>
        )}

        {/* Profile Header Card */}
        <Card style={styles.profileHeaderCard}>
          <Card.Content style={styles.profileHeader}>
            <Avatar.Icon size={80} icon="account" style={styles.avatar} />
            <View style={styles.profileInfo}>
              <Text style={styles.fullName}>{fullName || "Member"}</Text>
              <Text style={styles.email}>{user?.email}</Text>
              <View style={styles.memberIdContainer}>
                <Icon name="identifier" size={14} color="#6b7280" />
                <Text style={styles.memberId}>ID: {user?.id}</Text>
                {usingCachedData && (
                  <Text style={styles.cachedBadge}> • Cached</Text>
                )}
              </View>
            </View>
            <View style={styles.profileStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{completionPercentage}%</Text>
                <Text style={styles.statLabel}>Complete</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Personal Information */}
        {renderDocumentCard("Personal Information", personalInfoFields)}

        {/* Address Information */}
        {renderDocumentCard("Address Information", addressFields)}

        {/* Medical Information */}
        {renderDocumentCard("Medical Information", medicalFields)}

        {/* Guardian Information */}
        {renderDocumentCard("Guardian Information", guardianFields)}

        {/* Documents */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Documents</Text>
              <Text style={styles.documentsSubtitle}>
                Uploaded Files {usingCachedData && "• Cached"}
              </Text>
            </View>
            <View style={styles.documentsGrid}>
              {documentFields.map(renderDocumentItem)}
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate("MemberEditProfile")}
            style={styles.editButton}
            contentStyle={styles.buttonContent}
            icon="account-edit"
          >
            Edit Profile
          </Button>

          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.logoutButton}
            contentStyle={styles.buttonContent}
            textColor="#dc2626"
            icon="logout"
          >
            Logout
          </Button>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeImageModal}
            >
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.fullSizeImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc"
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  loadingText: {
    marginTop: 12,
    color: "#2563eb",
    fontSize: 16
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

  // Completion Banner
  completionBanner: {
    backgroundColor: "#f59e0b",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  completionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  completionTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  cachedIndicator: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontStyle: "italic",
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 3,
    marginBottom: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 3,
  },
  completionText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  completionSubtext: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
    fontStyle: "italic",
  },

  // Profile Header
  profileHeaderCard: {
    borderRadius: 16,
    backgroundColor: "#ffffff",
    elevation: 2,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    backgroundColor: "#2563eb",
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  fullName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  memberIdContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberId: {
    fontSize: 12,
    color: "#9ca3af",
    marginLeft: 4,
  },
  cachedBadge: {
    fontSize: 10,
    color: "#f59e0b",
    fontStyle: "italic",
  },
  profileStats: {
    alignItems: "flex-end",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#059669",
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
  },

  // Section Cards
  sectionCard: {
    borderRadius: 12,
    backgroundColor: "#ffffff",
    elevation: 1,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  incompleteBadge: {
    backgroundColor: "#fef2f2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  incompleteBadgeText: {
    fontSize: 12,
    color: "#dc2626",
    fontWeight: "500",
  },
  documentsSubtitle: {
    fontSize: 12,
    color: "#6b7280",
  },

  // Fields
  fieldContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
  },
  incompleteField: {
    backgroundColor: "#fef2f2",
    borderLeftWidth: 3,
    borderLeftColor: "#dc2626",
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 8,
    flex: 1,
  },
  warningIcon: {
    marginLeft: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },
  missingText: {
    color: "#6b7280",
    fontStyle: "italic",
  },
  documentImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginTop: 4,
  },
  viewImageText: {
    fontSize: 12,
    color: "#2563eb",
    marginTop: 4,
    textAlign: "center",
  },

  // Documents Grid
  documentsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  documentItem: {
    width: "48%",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    position: "relative",
  },
  documentContent: {
    alignItems: "center",
  },
  documentImageContainer: {
    position: "relative",
    marginBottom: 8,
  },
  documentThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  documentIconContainer: {
    marginBottom: 8,
  },
  documentTextContainer: {
    alignItems: "center",
  },
  documentLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
    textAlign: "center",
    marginBottom: 2,
  },
  documentStatus: {
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
  },
  documentBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#2563eb",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  // Actions
  actionsContainer: {
    gap: 12,
    marginTop: 8,
  },
  editButton: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
  },
  logoutButton: {
    borderColor: "#dc2626",
    borderRadius: 10,
  },
  buttonContent: {
    paddingVertical: 6,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    height: "80%",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: -40,
    right: 0,
    zIndex: 1,
    padding: 8,
  },
  fullSizeImage: {
    width: "100%",
    height: "100%",
  },

  bottomSpacing: {
    height: 20,
  },
});