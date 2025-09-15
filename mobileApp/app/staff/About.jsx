// app/(staff)/About.jsx
import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function About() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.header}>
        <Ionicons name="information-circle" size={48} color="#2563eb" />
        <Text style={styles.title}>About PDAO</Text>
      </View>

      <Text style={styles.paragraph}>
        The <Text style={{ fontWeight: "bold" }}>Persons with Disability Affairs Office (PDAO)</Text> is
        committed to promoting the welfare, rights, and opportunities of persons with disabilities
        (PWDs) in our community. Our office ensures that PWDs have equal access to resources,
        services, and programs that empower them to live independently and contribute to society.
      </Text>

      <Text style={styles.paragraph}>
        This mobile system helps PDAO efficiently manage events and benefits. It allows:
      </Text>

      <View style={styles.list}>
        <Text style={styles.listItem}>• Staff to scan member attendance at events.</Text>
        <Text style={styles.listItem}>• Staff to record which members received assistance or goods.</Text>
        <Text style={styles.listItem}>• Members to track their own attendance records and benefits received.</Text>
        <Text style={styles.listItem}>• Members to review absences and other personal records.</Text>
      </View>

      <Text style={styles.paragraph}>
        <Text style={{ fontWeight: "bold" }}>Mission:</Text> To empower persons with disabilities
        by providing accessible programs and services that promote equality, independence, and
        social inclusion.
      </Text>

      <Text style={styles.paragraph}>
        <Text style={{ fontWeight: "bold" }}>Vision:</Text> An inclusive community where persons
        with disabilities enjoy full participation, opportunities, and respect in all aspects of
        life.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: { alignItems: "center", marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#111827", marginTop: 8 },
  paragraph: { fontSize: 16, color: "#374151", marginBottom: 12, lineHeight: 22 },
  list: { marginBottom: 16, paddingLeft: 10 },
  listItem: { fontSize: 16, color: "#374151", marginBottom: 6, lineHeight: 22 },
});
