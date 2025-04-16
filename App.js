import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Image, View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font'; // Add this import
import { theme } from './src/theme/theme';
import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import SymptomScreen from './src/screens/SymptomScreen';
import MedicationScreen from './src/screens/MedicationScreen';
import ReportScreen from './src/screens/ReportScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainApp = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'Home') iconName = 'home';
        else if (route.name === 'Symptoms') iconName = 'healing';
        else if (route.name === 'Medications') iconName = 'medical-services';
        else if (route.name === 'Reports') iconName = 'description';
        return <MaterialIcons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.disabled,
      tabBarStyle: styles.tabBar,
      tabBarLabelStyle: styles.tabBarLabel,
      header: () => (
        <View style={styles.header}>
          <Image
            source={require('./assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      ),
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Symptoms" component={SymptomScreen} />
    <Tab.Screen name="Medications" component={MedicationScreen} />
    <Tab.Screen name="Reports" component={ReportScreen} />
  </Tab.Navigator>
);

const App = () => {
  const [fontsLoaded] = useFonts({
    'MaterialIcons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Splash">
            <Stack.Screen
              name="Splash"
              component={SplashScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="MainApp"
              component={MainApp}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    height: Platform.OS === 'ios' ? 100 : 80,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  logo: {
    width: 120,
    height: 40,
  },
  tabBar: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 0,
    elevation: 8,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: -2 },
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    height: Platform.OS === 'ios' ? 80 : 60,
  },
  tabBarLabel: {
    fontFamily: theme.typography.regular.fontFamily,
    fontSize: theme.typography.caption.fontSize,
    marginBottom: 4,
  },
});

export default App;