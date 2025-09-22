import React, { useEffect, useRef } from "react";
import { View, Text, ScrollView, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient"; // Import Expo's LinearGradient

export default function Terms() {
  const fadeAnim = useRef(new Animated.Value(0)).current; // Initial opacity set to 0



  useEffect(() => {
    // Animation to fade in the title and paragraphs
    Animated.timing(fadeAnim, {
      toValue: 1, // Final opacity
      duration: 2000,
      useNativeDriver: true, // Optimize performance
    }).start();
  }, [fadeAnim]);

  return (
    <LinearGradient
      colors={["#6ee7b7", "#2563eb"]} // Gradient colors
      style={styles.container}
    >
      <ScrollView contentContainerStyle={{ padding: 16 }}>


        <Animated.Text
          style={[styles.paragraph, { opacity: fadeAnim }]} // Fade-in animation for the paragraph
        >
          By using this mobile application, you agree to the following terms and
          conditions:
        </Animated.Text>

        <Animated.Text
          style={[styles.paragraph, { opacity: fadeAnim }]} // Fade-in animation for each paragraph
        >
          1. <Text style={styles.bold}>Acceptance of Terms:</Text> By accessing or
          using this application, you agree to comply with the terms set forth in
          this agreement.
        </Animated.Text>

        <Animated.Text
          style={[styles.paragraph, { opacity: fadeAnim }]}
        >
          2. <Text style={styles.bold}>Changes to Terms:</Text> We may update or
          modify these terms at any time without prior notice. It is your
          responsibility to review the terms periodically.
        </Animated.Text>

        <Animated.Text
          style={[styles.paragraph, { opacity: fadeAnim }]}
        >
          3. <Text style={styles.bold}>Privacy Policy:</Text> Your use of this
          application is also governed by our Privacy Policy.
        </Animated.Text>

        <Animated.Text
          style={[styles.paragraph, { opacity: fadeAnim }]}
        >
          4. <Text style={styles.bold}>User Responsibilities:</Text> You are
          responsible for maintaining the confidentiality of your account
          information and for any activities that occur under your account.
        </Animated.Text>

        <Animated.Text
          style={[styles.paragraph, { opacity: fadeAnim }]}
        >
          5. <Text style={styles.bold}>Limitation of Liability:</Text> We are not
          liable for any direct, indirect, incidental, special, or consequential
          damages arising from your use of this application.
        </Animated.Text>

        <Animated.Text
          style={[styles.paragraph, { opacity: fadeAnim }]}
        >
          6. <Text style={styles.bold}>Governing Law:</Text> These terms are
          governed by the laws of The Opol Municipality.
        </Animated.Text>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingTop: 16,
  },
  header: { alignItems: "center", marginBottom: 20 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  paragraph: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 12,
    lineHeight: 22,
  },
  bold: {
    fontWeight: "bold",
  },
});
