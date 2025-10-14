import React, { useState } from "react";
import { View, Text, Button, StyleSheet, Appearance } from "react-native";
import Tts from 'react-native-tts';  // For text-to-speech

export default function Settings({ onHighContrastToggle, onDarkModeToggle }) {
  const [darkMode, setDarkMode] = useState(Appearance.getColorScheme() === 'dark');
  const [highContrast, setHighContrast] = useState(false);  // For high contrast mode

  // Text-to-speech function
  const readOutText = (text) => {
    Tts.speak(text);
  };

  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
    onDarkModeToggle(!darkMode);
  };

  const handleHighContrastToggle = () => {
    setHighContrast(!highContrast);
    onHighContrastToggle(!highContrast);
  };

  return (
    <View style={styles.settingsContainer}>
      <Text style={styles.title}>Accessibility Settings</Text>

      {/* Dark Mode Toggle */}
      <Button 
        title={`Toggle Dark Mode: ${darkMode ? "ON" : "OFF"}`} 
        onPress={handleDarkModeToggle} 
      />

      {/* High Contrast Mode Toggle */}
      <Button 
        title={`Toggle High Contrast: ${highContrast ? "ON" : "OFF"}`} 
        onPress={handleHighContrastToggle} 
      />

      {/* Text to Speech */}
      <Button 
        title="Read Instructions" 
        onPress={() => readOutText("Toggle dark mode and high contrast for better accessibility experience.")} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  settingsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f3f4f6",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#111827",
  },
});
