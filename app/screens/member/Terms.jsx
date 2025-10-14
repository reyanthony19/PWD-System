import React, { useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Animated, 
  TouchableOpacity,
  Dimensions 
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function Terms({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, slideAnim]);

  const terms = [
    {
      number: "1",
      title: "Acceptance of Terms",
      description: "By accessing or using this application, you agree to comply with the terms set forth in this agreement.",
      icon: "checkmark-circle"
    },
    {
      number: "2",
      title: "Changes to Terms",
      description: "We may update or modify these terms at any time without prior notice. It is your responsibility to review the terms periodically.",
      icon: "refresh-circle"
    },
    {
      number: "3",
      title: "Privacy Policy",
      description: "Your use of this application is also governed by our Privacy Policy.",
      icon: "shield-checkmark"
    },
    {
      number: "4",
      title: "User Responsibilities",
      description: "You are responsible for maintaining the confidentiality of your account information and for any activities that occur under your account.",
      icon: "person-circle"
    },
    {
      number: "5",
      title: "Limitation of Liability",
      description: "We are not liable for any direct, indirect, incidental, special, or consequential damages arising from your use of this application.",
      icon: "warning"
    },
    {
      number: "6",
      title: "Governing Law",
      description: "These terms are governed by the laws of The Opol Municipality.",
      icon: "business"
    },
    {
      number: "7",
      title: "Data Usage",
      description: "We collect and process personal data in accordance with our privacy policy to provide and improve our services.",
      icon: "server"
    },
    {
      number: "8",
      title: "Account Security",
      description: "You must keep your login credentials secure and notify us immediately of any unauthorized use of your account.",
      icon: "lock-closed"
    }
  ];

  const renderTermItem = (term, index) => (
    <Animated.View 
      key={index}
      style={[
        styles.termCard,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: fadeAnim }
          ]
        }
      ]}
    >
      <View style={styles.termHeader}>
        <View style={styles.termNumber}>
          <Text style={styles.termNumberText}>{term.number}</Text>
        </View>
        <View style={styles.termIcon}>
          <Ionicons name={term.icon} size={24} color="#2563eb" />
        </View>
        <Text style={styles.termTitle}>{term.title}</Text>
      </View>
      <Text style={styles.termDescription}>{term.description}</Text>
    </Animated.View>
  );

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
          {/* Header */}
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <MaterialCommunityIcons name="file-document" size={40} color="#fff" />
              <Text style={styles.title}>Terms & Conditions</Text>
              <Text style={styles.subtitle}>
                Please read these terms carefully before using our application
              </Text>
            </View>
          </Animated.View>

          {/* Introduction Card */}
          <Animated.View 
            style={[
              styles.introCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.introHeader}>
              <Ionicons name="information-circle" size={28} color="#2563eb" />
              <Text style={styles.introTitle}>Important Information</Text>
            </View>
            <Text style={styles.introText}>
              By using this mobile application, you agree to the following terms and conditions. 
              These terms constitute a legally binding agreement between you and PDAO.
            </Text>
            <View style={styles.lastUpdated}>
              <Ionicons name="time" size={16} color="#6b7280" />
              <Text style={styles.lastUpdatedText}>Last updated: {new Date().toLocaleDateString()}</Text>
            </View>
          </Animated.View>

          {/* Terms List */}
          <View style={styles.termsSection}>
            {terms.map((term, index) => renderTermItem(term, index))}
          </View>

          {/* Acceptance Section */}
          <Animated.View 
            style={[
              styles.acceptanceCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.acceptanceHeader}>
              <MaterialCommunityIcons name="handshake" size={28} color="#10b981" />
              <Text style={styles.acceptanceTitle}>Agreement</Text>
            </View>
            <Text style={styles.acceptanceText}>
              By continuing to use this application, you acknowledge that you have read, 
              understood, and agree to be bound by these Terms and Conditions.
            </Text>
            
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>For questions:</Text>
              <View style={styles.contactItem}>
                <Ionicons name="mail" size={16} color="#6b7280" />
                <Text style={styles.contactText}>pdao@opol.gov.ph</Text>
              </View>
              <View style={styles.contactItem}>
                <Ionicons name="call" size={16} color="#6b7280" />
                <Text style={styles.contactText}>(088) 123-4567</Text>
              </View>
            </View>
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              PDAO - Persons with Disability Affairs Office
            </Text>
            <Text style={styles.footerSubtext}>
              Committed to serving our community
            </Text>
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
    marginBottom: 24,
    marginTop: 10,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
    zIndex: 1,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  introCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 12,
  },
  introText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
  },
  lastUpdated: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  lastUpdatedText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  termsSection: {
    marginBottom: 24,
  },
  termCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  termHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  termNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  termNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  termIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  termTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  termDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
    marginLeft: 84, // Align with term title
  },
  acceptanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
  },
  acceptanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  acceptanceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 12,
  },
  acceptanceText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 20,
  },
  contactInfo: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});