import { Tabs } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function StaffLayout() {

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#2563eb",
                tabBarStyle: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Events",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="mail" size={size} color={color} />
                    ),
                }}
            />

            <Tabs.Screen name="scanner/index" options={{ href: null }} />
            <Tabs.Screen name="scanner/BenefitScanner" options={{ href: null }} />

            <Tabs.Screen name="Attendance" options={{ href: null }} />
            <Tabs.Screen name="BenefitAttendance" options={{ href: null }} />



            <Tabs.Screen
                name="Benefits"
                options={{
                    title: "Benefits",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="gift" size={size} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="Profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }}
            />

        </Tabs>

    );
}
