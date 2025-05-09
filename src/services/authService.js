import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

let BASE_URL = 'http://127.0.0.1:8000';
API_URL = BASE_URL + "/api/auth";
const USER_DATA_KEY = 'user_data';

export const login = async (username, password) => {
  try {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await axios({
      method: 'POST',
      url: `${API_URL}/login`,
      data: formData.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    const { access_token } = response.data;

    console.log(access_token);
    
    // Store the token
    await AsyncStorage.setItem('token', access_token);
    
    // Make a separate request to get user details including ID
    try {
      const userResponse = await axios.get(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      
      // Extract user data including ID
      const userData = {
        username,
        id: userResponse.data.id || userResponse.data._id, 
        email: userResponse.data.email,
      };

      console.log(userData)
      
      // Store the complete user data
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      
      return { access_token, userData };
    } catch (userError) {
      console.error('Error fetching user details:', userError);
      // If we can't get user details, store basic info
      const basicUserData = { username, id: username }; // Use username as fallback ID
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(basicUserData));
      return { access_token, userData: basicUserData };
    }
  } catch (error) {
    throw error.response?.data || { detail: 'Failed to login' };
  }
};

export const register = async (username, email, password) => {
  try {
    const response = await axios.post(`${API_URL}/register`, {
      username,
      email,
      hashed_password: password,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'Failed to register' };
  }
};

export const logout = async () => {
  try {
    // Remove both token and user data
    await Promise.all([
      AsyncStorage.removeItem('token'),
      AsyncStorage.removeItem(USER_DATA_KEY)
    ]);
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

export const getCurrentUser = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) return null;

    // First try to get cached user data
    const userData = await AsyncStorage.getItem(USER_DATA_KEY);
    if (userData) {
      const parsedData = JSON.parse(userData);
      return {
        ...parsedData,
        id: parsedData.id || parsedData._id || parsedData.username
      };
    }
    
    // If we have a token but no user data, try to fetch from API
    try {
      const response = await axios.get(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const user = {
        username: response.data.username,
        id: response.data.id || response.data._id || response.data.username,
        email: response.data.email,
      };
      
      // Cache the user data
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
      
      return user;
    } catch (apiError) {
      console.error('Error fetching user from API:', apiError);
      // If API call fails but we have a token, return minimal user data
      const username = 'User';
      return { username, id: username };
    }
  } catch (error) {
    console.error('Error getting current user:', error);
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem(USER_DATA_KEY);
    return null;
  }
};
