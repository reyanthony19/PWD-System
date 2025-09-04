import { View, Text, StyleSheet } from "react-native";

export default function Profile() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>👤 Profile</Text>
      <Text style={styles.text}>
        This is the Profile page. You can show staff information, account
        settings, and logout options here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", color: "#2563eb", marginBottom: 10 },
  text: { fontSize: 16, color: "#374151", textAlign: "center", paddingHorizontal: 20 },
});
