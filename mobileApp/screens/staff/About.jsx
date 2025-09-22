import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient"; // Import Expo's LinearGradient

export default function About({ navigation }) {
  // Navigate to Terms and Conditions page
  const navigateToTerms = () => {
    navigation.navigate("Terms & Conditions"); // Assuming you have set up navigation to the Terms screen
  };

  const navigateToContactUs = () => {
    navigation.navigate("Location");
  };


  return (
    <LinearGradient
      colors={["#6ee7b7", "#2563eb"]} // Gradient colors
      style={styles.container} // Apply gradient to the container
    >
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.header}>
          <Ionicons name="information-circle" size={48} color="#fff" />
          <Text style={styles.title}>About PDAO</Text>
        </View>

        <Text style={styles.paragraph}>
          The{" "}
          <Text style={{ fontWeight: "bold" }}>
            Persons with Disability Affairs Office (PDAO)
          </Text>{" "}
          is committed to promoting the welfare, rights, and opportunities of
          persons with disabilities (PWDs) in our community. Our office ensures
          that PWDs have equal access to resources, services, and programs that
          empower them to live independently and contribute to society.

        </Text>

        <Text style={styles.paragraph}>
          This mobile system helps PDAO efficiently manage events and benefits. It
          allows:
        </Text>

        <View style={styles.list}>
          <Text style={styles.listItem}>
            • Staff to scan member attendance at events.
          </Text>
          <Text style={styles.listItem}>
            • Staff to record which members received assistance or goods.
          </Text>
          <Text style={styles.listItem}>
            • Members to track their own attendance records and benefits
            received.
          </Text>
          <Text style={styles.listItem}>
            • Members to review absences and other personal records.
          </Text>
        </View>

        <Text style={styles.paragraph}>
          <Text style={{ fontWeight: "bold" }}>Mission:</Text> To empower persons
          with disabilities by providing accessible programs and services that
          promote equality, independence, and social inclusion.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={{ fontWeight: "bold" }}>Vision:</Text> An inclusive
          community where persons with disabilities enjoy full participation,
          opportunities, and respect in all aspects of life.
        </Text>

        {/* Vision and Mission from the new image */}
        <Text style={styles.textTitle}>VISION</Text>
        <Text style={styles.textContent}>
          “All persons with disabilities are able to attain their fullest
          potential and to become active contributors and participants in
          nation-building”
        </Text>

        <Text style={styles.textTitle}>MISSION</Text>
        <Text style={styles.textContent}>
          To provide direction to all stakeholders through policy formulation,
          coordination, monitoring and evaluation of all activities to “MAKE THE
          RIGHTS REAL” for all.
        </Text>

        {/* Terms and Conditions Link */}
        <Text style={styles.link} onPress={navigateToTerms}>
          View Terms and Conditions
        </Text>

        <Text style={styles.link} onPress={navigateToContactUs}>
          Visit Us
        </Text>
        
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb", // fallback background color in case the gradient doesn't load
  },
  header: { alignItems: "center", marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff", marginTop: 8 },
  paragraph: {
    fontSize: 16,
    color: "#fff", // Change text color to white for better contrast on the gradient background
    marginBottom: 12,
    lineHeight: 22,
  },
  list: { marginBottom: 16, paddingLeft: 10 },
  listItem: { fontSize: 16, color: "#fff", marginBottom: 6, lineHeight: 22 },
  textTitle: { fontSize: 18, fontWeight: "bold", color: "#fff", marginTop: 20 },
  textContent: { fontSize: 16, color: "#fff", marginTop: 10 },
  link: {
    color: "#fff", // White text for the link
    textDecorationLine: "underline",
    marginTop: 20,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
