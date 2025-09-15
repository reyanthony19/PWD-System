import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";

export default function Layout() {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const segments = useSegments(); // tells us where we are (auth/staff/member)
  const router = useRouter();

  // check token on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("token");
      setIsLoggedIn(!!token);
      setIsReady(true);
    };
    checkAuth();
  }, []);

  // redirect based on auth state + current group
  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isLoggedIn && !inAuthGroup) {
      router.replace("/auth");
    } else if (isLoggedIn && inAuthGroup) {
      router.replace("/staff"); // default for logged-in users
    }
  }, [isReady, isLoggedIn, segments]);

  if (!isReady) return null; // add splash screen if you want

  return <Stack screenOptions={{ headerShown: false }} />;
}
