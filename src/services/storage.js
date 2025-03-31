import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  SYMPTOMS: 'symptoms',
  MEDICATIONS: 'medications',
  REPORTS: 'reports',
};

export const storage = {
  async save(key, data) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Storage save error:', error);
    }
  },

  async load(key) {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Storage load error:', error);
      return null;
    }
  }
}; 