import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import api from "../../services/api";

export default function Index() {
    const router = useRouter();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const token = await AsyncStorage.getItem("token");
                const headers = token ? { Authorization: `Bearer ${token}` } : {};

                const res = await api.get("/events", { headers });
                setEvents(res.data.data || res.data || []);
            } catch (err) {
                console.error("Events fetch error:", err.response?.data || err.message);
                setError("Failed to load events.");
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0284c7" />
                <Text>Loading Events...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={{ color: "red" }}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {events.length === 0 ? (
                <Text style={styles.empty}>No events available</Text>
            ) : (
                <FlatList
                    data={events}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.card}
                            onPress={() =>
                                router.push({
                                    pathname: "/staff/Attendance",
                                    params: { eventId: item.id, eventTitle: item.title },
                                })
                            }
                        >
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.subtitle}>
                                📅 {new Date(item.event_date).toLocaleDateString()}
                            </Text>
                            <Text style={styles.subtitle}>📍 {item.location}</Text>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: "#f9fafb" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    empty: { textAlign: "center", fontSize: 16, color: "#6b7280" },
    card: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 2,
    },
    title: { fontSize: 18, fontWeight: "bold", marginBottom: 6 },
    subtitle: { fontSize: 14, color: "#6b7280" },
});
