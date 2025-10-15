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
  RefreshControl
} from "react-native";
import { Button, Avatar, Card } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import api from "@/services/api"; // Your centralized API
import NetInfo from '@react-native-community/netinfo';

const { width } = Dimensions.get("window");

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
  const [documents, setDocuments] = useState({});
  const [loading, setLoading] = useState(true);
  const [incompleteFields, setIncompleteFields] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  // FIXED: Get base URL from your centralized API config
  const BASE_URL = api.defaults.baseURL?.replace('/api', '') || "http://192.168.1.101:8000";

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

  // Extract incomplete fields calculation to reusable function
  const calculateIncompleteFields = (profile) => {
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
    return missing;
  };

  // Enhanced error handling without cache fallback
  const handleFetchError = async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.clear();
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      return;
    }

    if (isOnline) {
      Alert.alert("Error", "Failed to load profile. Please try again.");
    } else {
      Alert.alert("Offline", "No internet connection. Please check your connection and try again.");
    }
  };

  // FIXED: Use centralized API for all requests
  const getMemberDocuments = async (user_id) => {
    try {
      const res = await api.get(`/user/documents/${user_id}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        params: {
          _t: Date.now() // Add timestamp to bust cache
        }
      });
      console.log('Documents API Response:', res.data);

      // Handle different response formats
      if (res.data && typeof res.data === 'object') {
        return {
          picture_2x2: res.data.picture_2x2 || null,
          barangay_indigency: res.data.barangay_indigency || null,
          medical_certificate: res.data.medical_certificate || null,
          birth_certificate: res.data.birth_certificate || null
        };
      } else {
        console.warn("Documents response format unexpected, using defaults");
        return {
          picture_2x2: null,
          barangay_indigency: null,
          medical_certificate: null,
          birth_certificate: null
        };
      }
    } catch (error) {
      console.error("Error fetching member documents:", error);
      // Return default documents structure
      return {
        picture_2x2: null,
        barangay_indigency: null,
        medical_certificate: null,
        birth_certificate: null
      };
    }
  };

  // FIXED: Improved URL construction for images using centralized base URL
  const getImageUrl = (filePath) => {
    if (!filePath) return null;

    // If it's already a full URL, use it directly
    if (filePath.startsWith('http')) {
      return filePath;
    }

    // Remove leading slash if present to avoid double slashes
    const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;

    // Construct the full URL using centralized base URL
    return `${BASE_URL}/storage/${cleanPath}`;
  };

  // Enhanced fetch function without cache
  const fetchUserProfile = async (forceRefresh = false) => {
    try {
      setRefreshing(true);
      setImageErrors({});

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Session Expired", "Please log in again.");
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      // STRATEGY: Always fetch fresh data from API with cache-busting
      console.log('🌐 Fetching fresh data from API');
      const res = await api.get("/user", {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        params: {
          _t: Date.now() // Add timestamp to bust cache
        }
      });
      const userData = res.data;
      setUser(userData);

      // Calculate incomplete fields for fresh data
      const profile = userData?.member_profile || {};
      const missing = calculateIncompleteFields(profile);
      setIncompleteFields(missing);

      // Fetch documents
      try {
        const userDocuments = await getMemberDocuments(userData.id);
        console.log('📄 Fetched documents:', userDocuments);
        setDocuments(userDocuments);
      } catch (docError) {
        console.error("Documents fetch failed:", docError);
        const emptyDocuments = {
          picture_2x2: null,
          barangay_indigency: null,
          medical_certificate: null,
          birth_certificate: null
        };
        setDocuments(emptyDocuments);
      }

    } catch (err) {
      console.error("Profile fetch error:", err.response?.data || err.message);
      await handleFetchError(err);
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
              setLoading(true);

              // Clear all authentication data
              const keysToRemove = [
                "token",
                "user"
              ];

              await AsyncStorage.multiRemove(keysToRemove);

              console.log("Logout successful, redirecting to login...");

              // Use navigation.reset instead of replace
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });

            } catch (err) {
              console.error("Logout error:", err);
              Alert.alert("Error", "Failed to logout. Please try again.");
            } finally {
              setLoading(false);
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

  const handleImageError = (documentKey) => {
    console.log(`Image load failed for: ${documentKey}`);
    setImageErrors(prev => ({
      ...prev,
      [documentKey]: true
    }));
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

      {/* FIXED: Improved image display with error handling */}
      {(field.key.includes("picture") || field.type === "image") && field.value ? (
        <TouchableOpacity onPress={() => openImageModal(getImageUrl(field.value))}>
          {!imageErrors[field.key] ? (
            <Image
              source={{ uri: getImageUrl(field.value) }}
              style={styles.documentImage}
              onError={() => handleImageError(field.key)}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imageErrorContainer}>
              <Icon name="image-off" size={32} color="#9ca3af" />
              <Text style={styles.imageErrorText}>Failed to load image</Text>
            </View>
          )}
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

  // FIXED: Improved document item rendering with better image handling
  const renderDocumentItem = (field, idx) => {
    const hasDocument = !!field.value;
    const isImage = field.type === "image" || (field.value && isImageFile(field.value));
    const imageUrl = hasDocument ? getImageUrl(field.value) : null;
    const hasImageError = imageErrors[field.key];

    return (
      <TouchableOpacity
        key={idx}
        style={styles.documentItem}
        onPress={() => hasDocument && isImage && !hasImageError && openImageModal(imageUrl)}
        disabled={!hasDocument || !isImage || hasImageError}
      >
        <View style={styles.documentContent}>
          {hasDocument && isImage ? (
            <View style={styles.documentImageContainer}>
              {!hasImageError ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.documentThumbnail}
                  resizeMode="cover"
                  onError={() => handleImageError(field.key)}
                />
              ) : (
                <View style={styles.documentErrorThumbnail}>
                  <Icon name="image-off" size={24} color="#9ca3af" />
                </View>
              )}
              {!hasImageError && (
                <View style={styles.imageOverlay}>
                  <Icon name="eye" size={16} color="#fff" />
                </View>
              )}
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
              { color: hasImageError ? "#f59e0b" : getDocumentColor(hasDocument) }
            ]}>
              {hasDocument ? (
                hasImageError ? "Load Failed" :
                  isImage ? "View Image" : "Document Uploaded"
              ) : "Missing"}
            </Text>
          </View>
        </View>

        {hasDocument && !isImage && !hasImageError && (
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
          <RefreshControl
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
              You're offline. Please connect to the internet to load data.
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
                <Text style={styles.memberId}>{profile.id_number}</Text>
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
              <View style={styles.documentsHeader}>
                <Text style={styles.sectionTitle}>Documents</Text>
              </View>
              <Text style={styles.documentsSubtitle}>
                Uploaded Files
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
                onError={() => Alert.alert("Error", "Failed to load image")}
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
  sectionCard: {
    borderRadius: 12,
    backgroundColor: "#ffffff",
    elevation: 1,
    marginBottom: 16,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  documentsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  editDocumentsButton: {
    backgroundColor: "#10b981",
    borderRadius: 8,
  },
  editDocumentsButtonContent: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    height: 32,
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
    width: 120,
    height: 120,
    borderRadius: 8,
    marginTop: 4,
  },
  imageErrorContainer: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  imageErrorText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  viewImageText: {
    fontSize: 12,
    color: "#2563eb",
    marginTop: 4,
    textAlign: "center",
  },
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
  documentErrorThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
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