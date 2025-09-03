import { useEffect } from "react";
import { View, Text, StyleSheet, Alert, Pressable } from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useCameraPermissions } from "expo-camera";

export default function Attendance() {
  const { eventId, eventTitle } = useLocalSearchParams();
  const router = useRouter();

  const [permission, requestPermission] = useCameraPermissions();
  const isPermissionGranted = Boolean(permission?.granted);

  useEffect(() => {
    if (!eventId) {
      Alert.alert("Error", "No event ID provided.");
      router.back();
    }
  }, [eventId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📌 {eventTitle}</Text>
      <Text style={styles.subtitle}>Event ID: {eventId}</Text>

      <Pressable onPress={requestPermission}>
        <Text style={styles.buttonStyle}>Request Camera Permission</Text>
      </Pressable>
      <Link href={"/staff/scanner"} asChild>
        <Pressable disabled={!isPermissionGranted}>
          <Text style={[
            styles.buttonStyle,
            { opacity: !isPermissionGranted ? 0.5 : 1 },
          ]}>
            Go to Scanner
          </Text>

        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#6b7280" },
});
