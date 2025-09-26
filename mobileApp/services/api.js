import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native"; 
// Create an Axios instance
const api = axios.create({
  baseURL: process.env.BASE_URL || "http://127.0.0.1:8000/api", 
  headers: {
    Accept: "application/json", 
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response, 
  async (error) => {
    if (error.response && error.response.status === 401) {
      await AsyncStorage.removeItem('token');
      Alert.alert("Session expired", "Please log in again.");
    }
    return Promise.reject(error);
  }
);

export const getCurrentUserProfile = async () => {
  try {
    const res = await api.get("/user"); 
    return res.data; 
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw new Error("Failed to fetch user profile.");
  }
};

export default api;
