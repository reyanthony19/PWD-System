import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    Animated,
    ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

function RegistrationSuccess({ navigation, route }) {
    const { userData } = route.params || {};

    // Animation values
    const scaleAnim = React.useRef(new Animated.Value(0)).current;
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const slideAnim = React.useRef(new Animated.Value(50)).current;

    React.useEffect(() => {
        // Start animations
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleGoToLogin = () => {
        navigation.navigate("Login");
    };



    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <LinearGradient
                colors={["#667eea", "#764ba2", "#667eea"]}
                style={styles.background}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.content}>
                        {/* Animated Success Icon */}
                        <Animated.View
                            style={[
                                styles.iconContainer,
                                {
                                    transform: [{ scale: scaleAnim }],
                                    opacity: fadeAnim,
                                }
                            ]}
                        >
                            <View style={styles.iconCircle}>
                                <Ionicons name="checkmark" size={80} color="#fff" />
                            </View>
                        </Animated.View>

                        {/* Success Message */}
                        <Animated.View
                            style={[
                                styles.textContainer,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }]
                                }
                            ]}
                        >
                            <Text style={styles.title}>Registration Successful!</Text>
                            <Text style={styles.subtitle}>
                                Your account has been created successfully and is pending approval.
                            </Text>

                            {/* Status Card */}
                            <View style={styles.statusCard}>
                                <View style={styles.statusItem}>
                                    <Ionicons name="time-outline" size={24} color="#f59e0b" />
                                    <View style={styles.statusText}>
                                        <Text style={styles.statusLabel}>Current Status</Text>
                                        <Text style={styles.statusValue}>Pending Approval</Text>
                                    </View>
                                </View>

                                <View style={styles.statusItem}>
                                    <Ionicons name="alert-circle-outline" size={24} color="#3b82f6" />
                                    <View style={styles.statusText}>
                                        <Text style={styles.statusLabel}>What's Next?</Text>
                                        <Text style={styles.statusValue}>Wait for admin approval</Text>
                                    </View>
                                </View>
                            </View>

                            {/* User Information (if available) */}
                            {userData && (
                                <View style={styles.userInfo}>
                                    <Text style={styles.infoTitle}>Registration Details:</Text>
                                    <View style={styles.infoItem}>
                                        <Ionicons name="person-outline" size={16} color="#6b7280" />
                                        <Text style={styles.infoText}>Username: {userData.username}</Text>
                                    </View>
                                    <View style={styles.infoItem}>
                                        <Ionicons name="mail-outline" size={16} color="#6b7280" />
                                        <Text style={styles.infoText}>Email: {userData.email}</Text>
                                    </View>
                                    <View style={styles.infoItem}>
                                        <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                                        <Text style={styles.infoText}>Registered: {new Date().toLocaleDateString()}</Text>
                                    </View>
                                </View>
                            )}

                            {/* Instructions */}
                            <View style={styles.instructions}>
                                <Text style={styles.instructionsTitle}>What to expect next:</Text>
                                <View style={styles.instructionItem}>
                                    <View style={styles.bulletPoint} />
                                    <Text style={styles.instructionText}>
                                        You will receive an email once your account is approved
                                    </Text>
                                </View>
                                <View style={styles.instructionItem}>
                                    <View style={styles.bulletPoint} />
                                    <Text style={styles.instructionText}>
                                        Approval typically takes 24-48 hours
                                    </Text>
                                </View>
                                <View style={styles.instructionItem}>
                                    <View style={styles.bulletPoint} />
                                    <Text style={styles.instructionText}>
                                        You can check your approval status by contacting support
                                    </Text>
                                </View>
                            </View>
                        </Animated.View>

                        {/* Action Buttons */}
                        <Animated.View
                            style={[
                                styles.buttonContainer,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }]
                                }
                            ]}
                        >
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={handleGoToLogin}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="log-in-outline" size={20} color="#fff" />
                                <Text style={styles.primaryButtonText}>Go to Login</Text>
                            </TouchableOpacity>

                            {/* Support Contact */}
                            <View style={styles.supportSection}>
                                <Text style={styles.supportText}>Need help?</Text>
                                <TouchableOpacity style={styles.supportButton} activeOpacity={0.7}>
                                    <Ionicons name="chatbubble-outline" size={16} color="#2563eb" />
                                    <Text style={styles.supportButtonText}>Contact Support</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </View>
                </ScrollView>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingVertical: 40,
        minHeight: height, // Ensure it takes full height
    },
    iconContainer: {
        alignItems: "center",
        marginTop: 40,
    },
    iconCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 4,
        borderColor: "rgba(255, 255, 255, 0.3)",
    },
    textContainer: {
        alignItems: "center",
        marginTop: 30,
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#fff",
        textAlign: "center",
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: "rgba(255, 255, 255, 0.9)",
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 30,
    },
    statusCard: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: 16,
        padding: 20,
        marginBottom: 25,
        width: "100%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    statusItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15,
    },
    statusText: {
        marginLeft: 12,
        flex: 1,
    },
    statusLabel: {
        fontSize: 14,
        color: "#6b7280",
        marginBottom: 2,
    },
    statusValue: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
    },
    userInfo: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        width: "100%",
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 12,
    },
    infoItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: "#374151",
        marginLeft: 8,
    },
    instructions: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        borderRadius: 12,
        padding: 16,
        width: "100%",
        marginBottom: 20,
    },
    instructionsTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 12,
    },
    instructionItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 10,
    },
    bulletPoint: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#2563eb",
        marginTop: 6,
        marginRight: 12,
    },
    instructionText: {
        fontSize: 14,
        color: "#374151",
        lineHeight: 20,
        flex: 1,
    },
    buttonContainer: {
        width: "100%",
        marginTop: 10,
        marginBottom: 30, // Add bottom margin for better scrolling
    },
    primaryButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#10b981",
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#fff",
        marginLeft: 8,
    },
    secondaryButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.3)",
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#2563eb",
        marginLeft: 8,
    },
    supportSection: {
        alignItems: "center",
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "rgba(255, 255, 255, 0.2)",
    },
    supportText: {
        fontSize: 14,
        color: "rgba(255, 255, 255, 0.8)",
        marginBottom: 8,
    },
    supportButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    supportButtonText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#2563eb",
        marginLeft: 6,
    },
});

export default RegistrationSuccess;