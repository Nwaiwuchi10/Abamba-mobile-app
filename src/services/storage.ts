import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage utility safe for Expo Go, Web, and Native environments
let memoryStore: Record<string, string> = {};

export const appStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      // 1. Try browser localStorage if running on web
      if (typeof window !== "undefined" && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      }

      // 2. Try @react-native-async-storage/async-storage
      if (AsyncStorage && typeof AsyncStorage.getItem === "function") {
        const val = await AsyncStorage.getItem(key);
        if (val !== null) return val;
      }

      // 3. Fallback to in-memory store
      return memoryStore[key] || null;
    } catch {
      return memoryStore[key] || null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      memoryStore[key] = value;

      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
      }

      if (AsyncStorage && typeof AsyncStorage.setItem === "function") {
        await AsyncStorage.setItem(key, value);
      }
    } catch {
      memoryStore[key] = value;
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      delete memoryStore[key];

      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
      }

      if (AsyncStorage && typeof AsyncStorage.removeItem === "function") {
        await AsyncStorage.removeItem(key);
      }
    } catch {
      delete memoryStore[key];
    }
  },

  clear: async (): Promise<void> => {
    memoryStore = {};
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.clear();
      }
      if (AsyncStorage && typeof AsyncStorage.clear === "function") {
        await AsyncStorage.clear();
      }
    } catch {}
  },
};

export default appStorage;
