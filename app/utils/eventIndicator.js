// utils/eventIndicator.js
import AsyncStorage from "@react-native-async-storage/async-storage";

export const EventIndicator = {
  // Update event indicator
  updateEventIndicator: async (hasNew, count = 0) => {
    try {
      const indicatorData = { hasNew, count, timestamp: Date.now() };
      await AsyncStorage.setItem('event_indicator', JSON.stringify(indicatorData));
      console.log('Event indicator updated:', indicatorData);
    } catch (error) {
      console.log('Error updating event indicator:', error);
    }
  },

  // Get event indicator
  getEventIndicator: async () => {
    try {
      const indicatorData = await AsyncStorage.getItem('event_indicator');
      if (indicatorData) {
        return JSON.parse(indicatorData);
      }
      return { hasNew: false, count: 0, timestamp: null };
    } catch (error) {
      console.log('Error getting event indicator:', error);
      return { hasNew: false, count: 0, timestamp: null };
    }
  },

  // Clear event indicator
  clearEventIndicator: async () => {
    try {
      await AsyncStorage.setItem('event_indicator', JSON.stringify({ 
        hasNew: false, 
        count: 0, 
        timestamp: Date.now() 
      }));
      console.log('Event indicator cleared');
    } catch (error) {
      console.log('Error clearing event indicator:', error);
    }
  }
};