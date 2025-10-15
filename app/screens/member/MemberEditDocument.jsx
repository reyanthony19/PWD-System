import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    Image,
    TouchableOpacity,
    Modal
} from "react-native";
import { Button, Card } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import api from "@/services/api";
import NetInfo from '@react-native-community/netinfo';

const CACHE_KEYS = {
    USER_DOCUMENTS: 'cached_user_documents',
    CURRENT_USER: 'currentUser'
};

export default function MemberEditDocument() {
    const navigation = useNavigation();
    const [documents, setDocuments] = useState({
        picture_2x2: null,
        barangay_indigency: null,
        medical_certificate: null,
        birth_certificate: null
    });
    const [loading, setLoading] = useState(true);
    const [savingStates, setSavingStates] = useState({
        picture_2x2: false,
        barangay_indigency: false,
        medical_certificate: false,
        birth_certificate: false
    });
    const [isOnline, setIsOnline] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [imageErrors, setImageErrors] = useState({});
    const [userId, setUserId] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    const BASE_URL = api.defaults.baseURL?.replace('/api', '') || "http://192.168.1.101:8000";

    // Network status monitoring
    useEffect(() => {
        const unsubscribeNetInfo = NetInfo.addEventListener(state => {
            setIsOnline(state.isConnected);
        });

        return () => unsubscribeNetInfo();
    }, []);

    // Focus effect to reload documents when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            fetchUserDocuments();
        }, [])
    );

    // Cache management functions
    const getFromCache = async (key) => {
        try {
            const cached = await AsyncStorage.getItem(key);
            if (cached) {
                const cacheData = JSON.parse(cached);
                return cacheData.data;
            }
            return null;
        } catch (error) {
            console.log('❌ Error reading from cache:', error);
            return null;
        }
    };

    const saveToCache = async (key, data) => {
        try {
            const cacheData = {
                data: data,
                timestamp: Date.now(),
            };
            await AsyncStorage.setItem(key, JSON.stringify(cacheData));
        } catch (error) {
            console.log('❌ Error saving to cache:', error);
        }
    };

    // Get user ID from currentUser in AsyncStorage
    const getUserIdFromCurrentUser = async () => {
        try {
            const currentUserString = await AsyncStorage.getItem(CACHE_KEYS.CURRENT_USER);
            if (currentUserString) {
                const currentUserData = JSON.parse(currentUserString);
                setCurrentUser(currentUserData);

                console.log('👤 Current User Data:', currentUserData);

                // Try to get user_id from currentUser.member.user_id
                if (currentUserData?.member?.user_id) {
                    console.log('✅ Got user_id from currentUser.member.user_id:', currentUserData.member.user_id);
                    setUserId(currentUserData.member.user_id);
                    return currentUserData.member.user_id;
                }

                // Try to get user_id from currentUser.member_profile.user_id
                if (currentUserData?.member_profile?.user_id) {
                    console.log('✅ Got user_id from currentUser.member_profile.user_id:', currentUserData.member_profile.user_id);
                    setUserId(currentUserData.member_profile.user_id);
                    return currentUserData.member_profile.user_id;
                }

                // Fallback to direct id if member structure doesn't exist
                if (currentUserData?.id) {
                    console.log('✅ Got user_id from currentUser.id:', currentUserData.id);
                    setUserId(currentUserData.id);
                    return currentUserData.id;
                }

                // Fallback to user_id direct property
                if (currentUserData?.user_id) {
                    console.log('✅ Got user_id from currentUser.user_id:', currentUserData.user_id);
                    setUserId(currentUserData.user_id);
                    return currentUserData.user_id;
                }
            }

            console.log('❌ No user_id found in currentUser, will fetch from API');
            return null;
        } catch (error) {
            console.error("❌ Error getting user from AsyncStorage:", error);
            return null;
        }
    };

    // Get member documents - using the correct endpoint
    const getMemberDocuments = async (user_id) => {
        try {
            const res = await api.get(`/user/documents/${user_id}`);
            console.log('📄 Documents API Response:', res.data);

            // Handle the response format from fetchMemberDocuments
            if (res.data) {
                // If documents exist and are returned as an object
                if (typeof res.data === 'object' && (res.data.picture_2x2 || res.data.barangay_indigency || res.data.medical_certificate || res.data.birth_certificate)) {
                    console.log('📄 Found documents object directly');
                    return {
                        picture_2x2: res.data.picture_2x2 || null,
                        barangay_indigency: res.data.barangay_indigency || null,
                        medical_certificate: res.data.medical_certificate || null,
                        birth_certificate: res.data.birth_certificate || null
                    };
                }
                // If no documents found (empty or null)
                else if (res.data === null || Object.keys(res.data).length === 0) {
                    console.log('📄 No documents found for user');
                    return {
                        picture_2x2: null,
                        barangay_indigency: null,
                        medical_certificate: null,
                        birth_certificate: null
                    };
                }
            }

            // Default fallback
            console.warn("📄 Documents response format unexpected, using defaults");
            return {
                picture_2x2: null,
                barangay_indigency: null,
                medical_certificate: null,
                birth_certificate: null
            };

        } catch (error) {
            console.error("❌ Error fetching member documents:", error);

            // Handle specific error cases
            if (error.response?.status === 404) {
                console.log('📄 No documents found (404) - returning empty structure');
                // This is normal - no documents exist yet for this user
                return {
                    picture_2x2: null,
                    barangay_indigency: null,
                    medical_certificate: null,
                    birth_certificate: null
                };
            }

            if (error.response?.status === 401) {
                console.error('❌ Authentication error');
                throw error; // Re-throw auth errors to be handled by parent function
            }

            // Return default documents structure for other errors
            return {
                picture_2x2: null,
                barangay_indigency: null,
                medical_certificate: null,
                birth_certificate: null
            };
        }
    };

    // Main function to fetch user documents
    const fetchUserDocuments = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Session Expired", "Please log in again.");
                navigation.reset({ index: 0, routes: [{ name: "Login" }] });
                return;
            }

            // Try to get user ID from currentUser first
            let user_id = await getUserIdFromCurrentUser();

            // If not found in currentUser, fetch from API
            if (!user_id) {
                console.log('🔄 User ID not found in currentUser, fetching from API...');
                const userRes = await api.get("/user");
                const userData = userRes.data;
                user_id = userData.id;
                setUserId(user_id);

                // Save to currentUser cache for next time
                await AsyncStorage.setItem(CACHE_KEYS.CURRENT_USER, JSON.stringify(userData));
                setCurrentUser(userData);
            }

            console.log('👤 Using User ID:', user_id);

            // Try to get cached documents first
            const cachedDocuments = await getFromCache(CACHE_KEYS.USER_DOCUMENTS);
            if (cachedDocuments) {
                setDocuments(cachedDocuments);
            }

            // Fetch documents from separate table
            const userDocuments = await getMemberDocuments(user_id);
            console.log('📄 Final documents data:', userDocuments);
            setDocuments(userDocuments);
            await saveToCache(CACHE_KEYS.USER_DOCUMENTS, userDocuments);

        } catch (error) {
            console.error("❌ Error fetching documents:", error);
            if (error.response?.status === 401) {
                await AsyncStorage.clear();
                navigation.reset({ index: 0, routes: [{ name: "Login" }] });
                return;
            }

            if (!isOnline) {
                Alert.alert("Offline", "No internet connection. You can view but not edit documents.");
            } else {
                Alert.alert("Error", "Failed to load documents. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Utility functions
    const getImageUrl = (filePath) => {
        if (!filePath) return null;
        if (filePath.startsWith('http')) return filePath;

        const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
        return `${BASE_URL}/storage/${cleanPath}`;
    };

    const isImageFile = (filename) => {
        if (!filename) return false;
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        return imageExtensions.some(ext =>
            filename.toLowerCase().includes(ext)
        );
    };

    // Update saving state for specific document
    const setSavingState = (documentType, isSaving) => {
        setSavingStates(prev => ({
            ...prev,
            [documentType]: isSaving
        }));
    };

    // Fixed document picker function
    const handleDocumentPick = async (documentType) => {
        if (!isOnline) {
            Alert.alert("Offline", "Cannot upload documents while offline.");
            return;
        }

        try {
            let result;
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

            if (documentType === 'picture_2x2') {
                // Request camera roll permissions first
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission required', 'Sorry, we need camera roll permissions to select images.');
                    return;
                }

                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.8,
                });

                if (!result.canceled && result.assets && result.assets.length > 0) {
                    const asset = result.assets[0];
                    const fileType = asset.mimeType || 'image/jpeg';

                    if (!allowedTypes.includes(fileType)) {
                        Alert.alert('Invalid File Type', 'Please select a JPG, JPEG, or PNG file.');
                        return;
                    }

                    // Get file extension from URI or use default
                    const fileExtension = asset.uri.split('.').pop() || 'jpg';
                    const fileName = `picture_2x2_${Date.now()}.${fileExtension}`;

                    await handleUpdateDocument(documentType, {
                        uri: asset.uri,
                        type: fileType,
                        name: fileName,
                        size: asset.fileSize || 0
                    });
                }
            } else {
                // For other documents, use document picker
                result = await DocumentPicker.getDocumentAsync({
                    type: '*/*',
                    copyToCacheDirectory: true,
                });

                if (result.assets && result.assets.length > 0) {
                    const file = result.assets[0];
                    const fileType = file.mimeType || 'application/octet-stream';

                    // Validate file types
                    if (!allowedTypes.includes(fileType)) {
                        Alert.alert('Invalid File Type', 'Please select JPG, JPEG, PNG, or PDF files only.');
                        return;
                    }

                    await handleUpdateDocument(documentType, {
                        uri: file.uri,
                        type: fileType,
                        name: file.name || `${documentType}_${Date.now()}.${fileType.split('/')[1] || 'file'}`,
                        size: file.size || 0
                    });
                }
            }
        } catch (error) {
            console.error('❌ Document picker error:', error);
            if (!error.toString().includes('User canceled')) {
                Alert.alert('Error', 'Failed to pick document. Please try again.');
            }
        }
    };

    // Fixed document update function with proper FormData handling
    const handleUpdateDocument = async (documentType, fileObject) => {
        if (!isOnline) {
            Alert.alert("Offline", "Cannot update documents while offline.");
            return;
        }

        // Ensure we have user_id
        if (!userId) {
            const user_id = await getUserIdFromCurrentUser();
            if (!user_id) {
                Alert.alert("Error", "User ID not found. Please try refreshing the page.");
                return;
            }
            setUserId(user_id);
        }

        try {
            setSavingState(documentType, true);

            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Error", "Authentication token not found.");
                setSavingState(documentType, false);
                return;
            }

            // Create FormData with proper file attachment
            const formData = new FormData();

            // Append the file with correct structure for React Native
            formData.append('file', {
                uri: fileObject.uri,
                type: fileObject.type || 'image/jpeg',
                name: fileObject.name || `${documentType}_${Date.now()}.jpg`
            });

            // Append document type so backend knows which field to update
            formData.append('document_type', documentType);

            console.log('📤 Uploading document:', {
                documentType,
                userId,
                fileName: fileObject.name,
                fileType: fileObject.type
            });

            // Use the correct endpoint - check your API routes
            const response = await api.post(`/member/${userId}/documents`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`,
                },
            });

            console.log('✅ Document update response:', response.data);

            if (response.data.message && response.data.message.includes('successfully')) {
                // Update local state with new document path
                const updatedDocumentPath = response.data.document_path || response.data[documentType];
                
                if (updatedDocumentPath) {
                    setDocuments(prev => ({
                        ...prev,
                        [documentType]: updatedDocumentPath
                    }));

                    // Update cache
                    const updatedDocuments = {
                        ...documents,
                        [documentType]: updatedDocumentPath
                    };
                    await saveToCache(CACHE_KEYS.USER_DOCUMENTS, updatedDocuments);
                }

                Alert.alert("Success", "Document updated successfully!");
            } else {
                throw new Error(response.data.message || 'Update failed');
            }

        } catch (error) {
            console.error("❌ Update error:", error);
            console.error("Error details:", error.response?.data);

            let errorMessage = "Failed to update document. Please try again.";

            if (error.response?.status === 400) {
                errorMessage = error.response.data?.message || "Invalid file or request.";
            } else if (error.response?.status === 413) {
                errorMessage = "File too large. Please select a smaller file.";
            } else if (error.response?.status === 422) {
                errorMessage = "Invalid file type. Please select JPG, PNG, or PDF files only.";
            } else if (error.response?.status === 404) {
                errorMessage = "User not found. Please log in again.";
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            Alert.alert("Update Failed", errorMessage);
        } finally {
            setSavingState(documentType, false);
        }
    };

    // Image modal functions
    const openImageModal = (imageUrl) => {
        setSelectedImage(imageUrl);
        setModalVisible(true);
    };

    const closeImageModal = () => {
        setModalVisible(false);
        setSelectedImage(null);
    };

    const handleImageError = (documentKey) => {
        setImageErrors(prev => ({
            ...prev,
            [documentKey]: true
        }));
    };

    // Document field configuration
    const documentFields = [
        {
            label: "2x2 Picture",
            key: "picture_2x2",
            description: "Recent 2x2 ID picture with white background",
            icon: "image",
            type: "image",
            required: true
        },
        {
            label: "Barangay Indigency",
            key: "barangay_indigency",
            description: "Certificate of indigency from your barangay (JPG, PNG, or PDF)",
            icon: "file-document",
            type: "document",
            required: true
        },
        {
            label: "Medical Certificate",
            key: "medical_certificate",
            description: "Medical clearance or health certificate",
            icon: "hospital-box",
            type: "document",
            required: false
        },
        {
            label: "Birth Certificate",
            key: "birth_certificate",
            description: "PSA-authenticated birth certificate",
            icon: "certificate",
            type: "document",
            required: true
        },
    ];

    // Render document field
    const renderDocumentField = (field, index) => {
        const hasDocument = !!documents[field.key];
        const imageUrl = hasDocument ? getImageUrl(documents[field.key]) : null;
        const hasImageError = imageErrors[field.key];
        const isImage = field.type === "image" || (documents[field.key] && isImageFile(documents[field.key]));
        const isSaving = savingStates[field.key];

        return (
            <Card key={index} style={styles.documentCard}>
                <Card.Content>
                    <View style={styles.documentHeader}>
                        <View style={styles.documentTitleContainer}>
                            <Icon
                                name={hasDocument ? "check-circle" : field.icon}
                                size={24}
                                color={hasDocument ? "#4CAF50" : field.required ? "#f44336" : "#2196F3"}
                            />
                            <Text style={styles.documentLabel}>
                                {field.label}{field.required ? ' *' : ''}
                            </Text>
                        </View>
                        <View style={styles.documentStatus}>
                            <Text style={[
                                styles.statusText,
                                { color: hasDocument ? "#4CAF50" : "#FF9800" }
                            ]}>
                                {hasDocument ? "Uploaded" : "Not Uploaded"}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.documentDescription}>
                        {field.description}
                    </Text>

                    {hasDocument ? (
                        <View style={styles.documentPreview}>
                            {isImage ? (
                                <TouchableOpacity
                                    onPress={() => openImageModal(imageUrl)}
                                    style={styles.imagePreview}
                                >
                                    {!hasImageError ? (
                                        <Image
                                            source={{ uri: imageUrl }}
                                            style={styles.documentImage}
                                            onError={() => handleImageError(field.key)}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View style={styles.imageErrorContainer}>
                                            <Icon name="image-off" size={32} color="#9E9E9E" />
                                            <Text style={styles.imageErrorText}>Failed to load image</Text>
                                        </View>
                                    )}
                                    <View style={styles.imageOverlay}>
                                        <Icon name="eye" size={20} color="#fff" />
                                        <Text style={styles.viewText}>View</Text>
                                    </View>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.documentFile}>
                                    <Icon name="file-document" size={40} color="#4CAF50" />
                                    <Text style={styles.documentFileName}>
                                        {documents[field.key]?.split('/').pop() || 'Document'}
                                    </Text>
                                    <Text style={styles.documentStatusText}>Uploaded</Text>
                                </View>
                            )}
                        </View>
                    ) : (
                        <View style={styles.uploadArea}>
                            <Icon name="cloud-upload" size={40} color="#757575" />
                            <Text style={styles.uploadText}>No document uploaded</Text>
                            {field.required && (
                                <Text style={styles.requiredText}>This document is required</Text>
                            )}
                        </View>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.documentButton,
                            hasDocument && styles.documentButtonReupload,
                            (isSaving || !isOnline) && styles.documentButtonDisabled
                        ]}
                        onPress={() => handleDocumentPick(field.key)}
                        disabled={isSaving || !isOnline}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Icon
                                    name={hasDocument ? "refresh" : "upload"}
                                    size={20}
                                    color="#fff"
                                />
                                <Text style={styles.documentButtonText}>
                                    {hasDocument ? "Update Document" : "Upload Document"}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {!isOnline && (
                        <Text style={styles.offlineText}>
                            📶 Update unavailable while offline
                        </Text>
                    )}
                </Card.Content>
            </Card>
        );
    };

    // Loading state
    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.loadingText}>Loading Documents...</Text>
            </View>
        );
    }

    // Main render
    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <Card style={styles.headerCard}>
                    <Card.Content>
                        <View style={styles.header}>
                            <Icon name="file-document-edit" size={32} color="#2196F3" />
                            <View style={styles.headerText}>
                                <Text style={styles.title}>Manage Documents</Text>
                                <Text style={styles.subtitle}>
                                    Update your documents - new uploads will replace existing ones
                                </Text>
                            </View>
                        </View>
                    </Card.Content>
                </Card>

                {/* Connection Status */}
                {!isOnline && (
                    <View style={styles.offlineBanner}>
                        <Icon name="wifi-off" size={16} color="#fff" />
                        <Text style={styles.offlineBannerText}>
                            You're offline. Document updates are unavailable.
                        </Text>
                    </View>
                )}

                {/* Documents List */}
                {documentFields.map(renderDocumentField)}

                {/* Debug Info */}
                <Card style={[styles.debugCard, { backgroundColor: '#f5f5f5' }]}>
                    <Card.Content>
                        <Text style={styles.debugTitle}>
                            Debug Info
                        </Text>
                        <Text style={styles.debugText}>User ID: {userId}</Text>
                        <Text style={styles.debugText}>Online: {isOnline ? 'Yes' : 'No'}</Text>
                        <Text style={styles.debugText}>Base URL: {BASE_URL}</Text>
                    </Card.Content>
                </Card>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                    <Button
                        mode="outlined"
                        onPress={() => navigation.goBack()}
                        style={styles.cancelButton}
                        contentStyle={styles.buttonContent}
                        icon="arrow-left"
                    >
                        Back to Profile
                    </Button>

                    <Button
                        mode="contained"
                        onPress={fetchUserDocuments}
                        style={styles.refreshButton}
                        contentStyle={styles.buttonContent}
                        icon="refresh"
                    >
                        Refresh Documents
                    </Button>
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Image Preview Modal */}
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
                                onError={() => {
                                    Alert.alert("Error", "Failed to load image");
                                    closeImageModal();
                                }}
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
        backgroundColor: "#fafafa"
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 20
    },
    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fafafa"
    },
    loadingText: {
        marginTop: 12,
        color: "#2196F3",
        fontSize: 16
    },
    headerCard: {
        borderRadius: 12,
        backgroundColor: "#ffffff",
        elevation: 4,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
    },
    headerText: {
        marginLeft: 12,
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#212121",
    },
    subtitle: {
        fontSize: 14,
        color: "#757575",
        marginTop: 4,
    },
    offlineBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF9800',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    offlineBannerText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 8,
    },
    documentCard: {
        borderRadius: 12,
        backgroundColor: "#ffffff",
        elevation: 2,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    documentHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    documentTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    documentLabel: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#212121",
        marginLeft: 8,
    },
    documentStatus: {
        flexDirection: "row",
        alignItems: "center",
    },
    statusText: {
        fontSize: 12,
        fontWeight: "500",
    },
    documentDescription: {
        fontSize: 14,
        color: "#757575",
        marginBottom: 16,
        lineHeight: 20,
    },
    documentPreview: {
        alignItems: "center",
        marginBottom: 16,
    },
    imagePreview: {
        position: "relative",
        alignItems: "center",
    },
    documentImage: {
        width: 200,
        height: 150,
        borderRadius: 8,
    },
    imageErrorContainer: {
        width: 200,
        height: 150,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    imageErrorText: {
        fontSize: 12,
        color: '#9E9E9E',
        marginTop: 8,
    },
    imageOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    viewText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "500",
        marginTop: 4,
    },
    documentFile: {
        alignItems: "center",
        padding: 16,
        backgroundColor: "#E8F5E8",
        borderRadius: 8,
        width: "100%",
        borderWidth: 1,
        borderColor: "#C8E6C9",
    },
    documentFileName: {
        fontSize: 14,
        fontWeight: "500",
        color: "#2E7D32",
        marginTop: 8,
        textAlign: "center",
    },
    documentStatusText: {
        fontSize: 12,
        color: "#4CAF50",
        marginTop: 4,
        fontWeight: "500",
    },
    uploadArea: {
        alignItems: "center",
        padding: 32,
        backgroundColor: "#fafafa",
        borderRadius: 8,
        borderWidth: 2,
        borderColor: "#e0e0e0",
        borderStyle: "dashed",
        marginBottom: 16,
    },
    uploadText: {
        fontSize: 14,
        color: "#757575",
        marginTop: 8,
        textAlign: "center",
    },
    requiredText: {
        fontSize: 12,
        color: "#f44336",
        marginTop: 4,
        fontStyle: "italic",
    },
    documentButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2196F3",
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginTop: 8,
    },
    documentButtonReupload: {
        backgroundColor: "#4CAF50",
    },
    documentButtonDisabled: {
        backgroundColor: "#BDBDBD",
    },
    documentButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 8,
    },
    offlineText: {
        fontSize: 12,
        color: "#FF9800",
        textAlign: "center",
        marginTop: 8,
        fontStyle: "italic",
    },
    actionsContainer: {
        gap: 12,
        marginTop: 8,
    },
    cancelButton: {
        borderColor: "#757575",
        borderRadius: 8,
    },
    refreshButton: {
        backgroundColor: "#2196F3",
        borderRadius: 8,
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
        backgroundColor: "rgba(0,0,0,0.5)",
        borderRadius: 20,
    },
    fullSizeImage: {
        width: "100%",
        height: "100%",
    },
    bottomSpacing: {
        height: 20,
    },
    debugCard: {
        borderRadius: 12,
        backgroundColor: "#ffffff",
        elevation: 2,
        marginBottom: 16,
    },
    debugTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#212121",
        marginBottom: 8,
    },
    debugText: {
        fontSize: 12,
        color: '#757575',
        fontFamily: 'monospace',
        marginBottom: 2,
    },
});