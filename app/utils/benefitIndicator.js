// utils/benefitIndicator.js
import AsyncStorage from "@react-native-async-storage/async-storage";

export const BenefitIndicator = {
  // Update benefit indicator
  updateBenefitIndicator: async (hasNew, count = 0) => {
    try {
      const indicatorData = { hasNew, count, timestamp: Date.now() };
      await AsyncStorage.setItem('benefit_indicator', JSON.stringify(indicatorData));
      console.log('Benefit indicator updated:', indicatorData);
    } catch (error) {
      console.log('Error updating benefit indicator:', error);
    }
  },

  // Get benefit indicator
  getBenefitIndicator: async () => {
    try {
      const indicatorData = await AsyncStorage.getItem('benefit_indicator');
      if (indicatorData) {
        return JSON.parse(indicatorData);
      }
      return { hasNew: false, count: 0, timestamp: null };
    } catch (error) {
      console.log('Error getting benefit indicator:', error);
      return { hasNew: false, count: 0, timestamp: null };
    }
  },

  // Clear benefit indicator
  clearBenefitIndicator: async () => {
    try {
      await AsyncStorage.setItem('benefit_indicator', JSON.stringify({ 
        hasNew: false, 
        count: 0, 
        timestamp: Date.now() 
      }));
      console.log('Benefit indicator cleared');
    } catch (error) {
      console.log('Error clearing benefit indicator:', error);
    }
  }
};