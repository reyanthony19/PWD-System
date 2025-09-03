import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import EventsScreen from "./EventsScreen";
import AttendanceScreen from "./AttendanceScreen";

const Stack = createNativeStackNavigator();

export default function EventsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="EventsScreen"
        component={EventsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AttendanceScreen"
        component={AttendanceScreen}
        options={{ title: "Attendance" }}
      />
    </Stack.Navigator>
  );
}
