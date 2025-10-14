import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Image,
} from "react-native";
import { Button, Avatar, Card } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import api from "@/services/api";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker'; // Added DocumentPicker import

const { width, height } = Dimensions.get("window");

export default function MemberEditProfile() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState({});
  const [documents, setDocuments] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const BASE_URL = "http://192.168.0.101:8000/storage/";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          Alert.alert("Session Expired", "Please log in again.");
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
          return;
        }

        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const res = await api.get("/user");
        setUser(res.data);

        const profile = res.data?.member_profile || {};
        setProfileData(profile);

        const userDocuments = await getMemberDocuments(res.data.id);
        setDocuments(userDocuments);
      } catch (err) {
        console.error("Profile fetch error:", err.response?.data || err.message);
        Alert.alert("Error", "Failed to load profile. Please log in again.");
        await AsyncStorage.clear();
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const getMemberDocuments = async (user_id) => {
    try {
      const res = await api.get(`/user/documents/${user_id}`);
      return res.data;
    } catch (error) {
      console.error("Error fetching member documents:", error);
      throw new Error("Failed to fetch documents.");
    }
  };

  const handleSubmit = async () => {
    setUpdating(true);
    const formData = new FormData();
    
    // Append basic profile data
    formData.append("username", profileData.username || '');
    formData.append("email", profileData.email || '');
    formData.append("first_name", profileData.first_name || '');
    formData.append("last_name", profileData.last_name || '');
    formData.append("contact_number", profileData.contact_number || '');
    formData.append("address", profileData.address || '');
    formData.append("barangay", profileData.barangay || '');
    formData.append("blood_type", profileData.blood_type || '');
    formData.append("disability_type", profileData.disability_type || '');

    // Handle image upload (picture_2x2)
    if (profileData.picture_2x2 && !profileData.picture_2x2.startsWith(BASE_URL)) {
      formData.append("picture_2x2", {
        uri: profileData.picture_2x2,
        type: "image/jpeg",
        name: "profile_picture.jpg",
      });
    }

    // Handle document uploads
    const documentTypes = ['barangay_indigency', 'medical_certificate', 'birth_certificate'];
    documentTypes.forEach(type => {
      if (documents[type] && !documents[type].startsWith(BASE_URL)) {
        formData.append(type, {
          uri: documents[type],
          type: "application/pdf",
          name: `${type}.pdf`,
        });
      }
    });

    try {
      const response = await api.put(`/user/update/${user.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Alert.alert("Success", response.data.message);
      navigation.goBack();
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setUpdating(false);
    }
  };

  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'You need to grant access to the media library');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileData((prevData) => ({
        ...prevData,
        picture_2x2: result.assets[0].uri,
      }));
    }
  };

  const handleCameraPicker = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'You need to grant access to the camera');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileData((prevData) => ({
        ...prevData,
        picture_2x2: result.assets[0].uri,
      }));
    }
  };

  const handleDocumentPicker = async (type) => {
    try {
      let result = await DocumentPicker.getDocumentAsync({ 
        type: "application/pdf",
        copyToCacheDirectory: true
      });

      if (result.assets && result.assets.length > 0) {
        setDocuments((prevDocs) => ({
          ...prevDocs,
          [type]: result.assets[0].uri,
        }));
      }
    } catch (error) {
      console.error("Document picker error:", error);
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const renderImagePreview = (uri, isDocument = false) => {
    if (!uri) return null;
    
    if (isDocument) {
      return (
        <View style={styles.documentPreview}>
          <Icon name="file-pdf-box" size={40} color="#e74c3c" />
          <Text style={styles.documentText}>PDF Document Selected</Text>
        </View>
      );
    }
    
    return (
      <Image 
        source={{ uri: uri.startsWith(BASE_URL) ? uri : uri }} 
        style={styles.imagePreview} 
      />
    );
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
    { label: "Guardian", value: profile.guardian_full_name, icon: "account-group", key: "guardian_full_name" },
  ];

  const documentFields = [
    { label: "2x2 Picture", value: profileData.picture_2x2 || docs.picture_2x2, icon: "image", key: "picture_2x2", isImage: true },
    { label: "Barangay Indigency", value: docs.barangay_indigency, icon: "file-document", key: "barangay_indigency", isDocument: true },
    { label: "Medical Certificate", value: docs.medical_certificate, icon: "file-document", key: "medical_certificate", isDocument: true },
    { label: "Birth Certificate", value: docs.birth_certificate, icon: "file-document", key: "birth_certificate", isDocument: true },
  ];

  const renderField = (field, idx) => (
    <View key={idx} style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <Icon name={field.icon} size={20} color="#2563eb" />
        <Text style={styles.fieldLabel}>{field.label}</Text>
      </View>
      
      {field.isImage || field.isDocument ? (
        <View style={styles.documentContainer}>
          {renderImagePreview(field.value, field.isDocument)}
          <Button 
            mode="outlined" 
            onPress={() => field.isImage ? handleImagePicker() : handleDocumentPicker(field.key)}
            style={styles.documentButton}
            compact
          >
            {field.value ? "Change" : "Select"} {field.isImage ? "Image" : "Document"}
          </Button>
        </View>
      ) : (
        <TextInput
          value={field.value || ''}
          onChangeText={(text) => setProfileData({ ...profileData, [field.key]: text })}
          style={styles.input}
          placeholder={`Enter ${field.label.toLowerCase()}`}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileHeader}>
            <Avatar.Icon size={80} icon="account" style={styles.avatar} />
            <View style={styles.profileText}>
              <Text style={styles.fullName}>{fullName || "Member"}</Text>
              <Text style={styles.email}>{user?.email}</Text>
              <Text style={styles.memberId}>ID: {user?.id}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Personal Information */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            {personalInfoFields.map(renderField)}
          </Card.Content>
        </Card>

        {/* Address Information */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Address Information</Text>
            {addressFields.map(renderField)}
          </Card.Content>
        </Card>

        {/* Medical Information */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Medical Information</Text>
            {medicalFields.map(renderField)}
          </Card.Content>
        </Card>

        {/* Photo Section */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Profile Photo</Text>
            <View style={styles.photoSection}>
              {profileData.picture_2x2 && (
                <Image source={{ uri: profileData.picture_2x2 }} style={styles.mainImage} />
              )}
              <View style={styles.photoButtons}>
                <Button 
                  mode="contained" 
                  onPress={handleImagePicker} 
                  style={styles.photoButton}
                  icon="image"
                >
                  Gallery
                </Button>
                <Button 
                  mode="outlined" 
                  onPress={handleCameraPicker} 
                  style={styles.photoButton}
                  icon="camera"
                >
                  Camera
                </Button>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Documents */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Required Documents</Text>
            {documentFields.slice(1).map(renderField)}
          </Card.Content>
        </Card>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Fixed Submit Button */}
      <View style={styles.submitButtonContainer}>
        <Button 
          mode="contained" 
          onPress={handleSubmit} 
          style={styles.submitButton}
          loading={updating}
          disabled={updating}
          icon="content-save"
        >
          {updating ? "Updating..." : "Update Profile"}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f5f5f5" 
  },
  scrollContent: { 
    padding: 16,
    paddingBottom: 100 
  },
  loader: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  loadingText: { 
    marginTop: 10, 
    color: "#2563eb",
    fontSize: 16 
  },
  
  // Profile Header
  profileCard: { 
    borderRadius: 12, 
    backgroundColor: "#fff", 
    elevation: 2,
    marginBottom: 16 
  },
  profileHeader: { 
    flexDirection: "row", 
    alignItems: "center" 
  },
  avatar: { 
    backgroundColor: "#2563eb", 
    marginRight: 16 
  },
  profileText: { 
    flex: 1 
  },
  fullName: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#111827" 
  },
  email: { 
    fontSize: 14, 
    color: "#6b7280",
    marginTop: 2 
  },
  memberId: { 
    fontSize: 12, 
    color: "#9ca3af",
    marginTop: 2 
  },
  
  // Section Cards
  sectionCard: { 
    borderRadius: 12, 
    backgroundColor: "#fff", 
    elevation: 2,
    marginBottom: 16 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: "#111827",
    marginBottom: 16 
  },
  
  // Fields
  fieldContainer: { 
    marginBottom: 16 
  },
  fieldHeader: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 8 
  },
  fieldLabel: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: "#374151",
    marginLeft: 8 
  },
  input: { 
    borderWidth: 1, 
    borderColor: "#d1d5db", 
    padding: 12, 
    borderRadius: 8, 
    fontSize: 16,
    backgroundColor: "#f9fafb" 
  },
  
  // Documents & Images
  documentContainer: { 
    alignItems: "center" 
  },
  documentPreview: { 
    alignItems: "center", 
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    marginBottom: 8 
  },
  documentText: { 
    fontSize: 12, 
    color: "#6b7280",
    marginTop: 4 
  },
  imagePreview: { 
    width: 120, 
    height: 120, 
    borderRadius: 8, 
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb" 
  },
  documentButton: { 
    marginTop: 4 
  },
  
  // Photo Section
  photoSection: { 
    alignItems: "center" 
  },
  mainImage: { 
    width: 150, 
    height: 150, 
    borderRadius: 12, 
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#2563eb" 
  },
  photoButtons: { 
    flexDirection: "row", 
    justifyContent: "center",
    gap: 12 
  },
  photoButton: { 
    flex: 1 
  },
  
  // Buttons
  submitButtonContainer: { 
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb"
  },
  submitButton: { 
    paddingVertical: 8,
    backgroundColor: "#2563eb" 
  },
  
  // Spacing
  bottomSpacing: { 
    height: 20 
  }
});