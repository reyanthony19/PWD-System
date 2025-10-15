import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function About({ navigation }) {
  const navigateToTerms = () => {
    navigation.navigate("Terms");
  };

  const navigateToContactUs = () => {
    navigation.navigate("ContactUs");
  };

  const features = [
    {
      icon: "qr-code",
      title: "QR Code Attendance",
      description: "Quick and easy event check-ins using QR scanning technology"
    },
    {
      icon: "gift",
      title: "Benefits Tracking",
      description: "Monitor and manage assistance programs and benefits distribution"
    },
    {
      icon: "calendar",
      title: "Event Management",
      description: "Stay updated with upcoming events and activities"
    },
    {
      icon: "person",
      title: "Member Profiles",
      description: "Complete personal records and attendance history"
    }
  ];

  const stats = [
    { number: "1000+", label: "Members Served" },
    { number: "50+", label: "Events Monthly" },
    { number: "24/7", label: "Support" },
    { number: "100%", label: "Commitment" }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#667eea", "#764ba2", "#667eea"]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={["#fff", "#f0f9ff"]}
                style={styles.logo}
              >
                <MaterialCommunityIcons name="heart-circle" size={40} color="#2563eb" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>About PDAO</Text>
            <Text style={styles.subtitle}>
              Empowering Persons with Disabilities
            </Text>
          </View>

          {/* Introduction Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="office-building" size={24} color="#2563eb" />
              <Text style={styles.cardTitle}>Welcome to PDAO</Text>
            </View>
            <Text style={styles.paragraph}>
              The <Text style={styles.highlight}>Persons with Disability Affairs Office (PDAO)</Text> is committed to promoting the welfare, rights, and opportunities of persons with disabilities (PWDs) in our community.
            </Text>
            <Text style={styles.paragraph}>
              Our office ensures that PWDs have equal access to resources, services, and programs that empower them to live independently and contribute to society.
            </Text>
          </View>

          {/* Features Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Features</Text>
            <Text style={styles.sectionSubtitle}>
              This mobile system helps PDAO efficiently manage events and benefits
            </Text>
            
            <View style={styles.featuresGrid}>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureCard}>
                  <View style={styles.featureIcon}>
                    <MaterialCommunityIcons 
                      name={feature.icon} 
                      size={28} 
                      color="#2563eb" 
                    />
                  </View>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>
                    {feature.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Stats Section */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Our Impact</Text>
            <View style={styles.statsGrid}>
              {stats.map((stat, index) => (
                <View key={index} style={styles.statCard}>
                  <Text style={styles.statNumber}>{stat.number}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Vision & Mission Section */}
          <View style={styles.visionMissionSection}>
            <View style={styles.visionMissionCard}>
              <View style={styles.vmHeader}>
                <MaterialCommunityIcons name="eye" size={24} color="#10b981" />
                <Text style={styles.vmTitle}>VISION</Text>
              </View>
              <Text style={styles.vmContent}>
                "All persons with disabilities are able to attain their fullest potential and to become active contributors and participants in nation-building"
              </Text>
            </View>

            <View style={styles.visionMissionCard}>
              <View style={styles.vmHeader}>
                <MaterialCommunityIcons name="target" size={24} color="#f59e0b" />
                <Text style={styles.vmTitle}>MISSION</Text>
              </View>
              <Text style={styles.vmContent}>
                To provide direction to all stakeholders through policy formulation, coordination, monitoring and evaluation of all activities to "MAKE THE RIGHTS REAL" for all.
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsSection}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={navigateToTerms}
            >
              <LinearGradient
                colors={["#2563eb", "#1d4ed8"]}
                style={styles.actionButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <MaterialCommunityIcons name="file-document" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Terms & Conditions</Text>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={navigateToContactUs}
            >
              <LinearGradient
                colors={["#10b981", "#059669"]}
                style={styles.actionButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <MaterialCommunityIcons name="map-marker" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Visit Us</Text>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Together, we build an inclusive community where everyone belongs.
            </Text>
            <View style={styles.footerIcon}>
              <MaterialCommunityIcons name="heart" size={16} color="#fff" />
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 10,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginLeft: 12,
  },
  paragraph: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 12,
    lineHeight: 24,
  },
  highlight: {
    fontWeight: "bold",
    color: "#2563eb",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  sectionSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 20,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  featureCard: {
    width: "48%",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 16,
  },
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: "center",
    backdropFilter: "blur(10px)",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
  visionMissionSection: {
    marginBottom: 24,
  },
  visionMissionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
  },
  vmHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  vmTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginLeft: 12,
  },
  vmContent: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
    fontStyle: "italic",
    textAlign: "center",
  },
  actionsSection: {
    marginBottom: 24,
  },
  actionButton: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
  },
  actionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginLeft: 12,
  },
  footer: {
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  footerText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 12,
  },
  footerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
});