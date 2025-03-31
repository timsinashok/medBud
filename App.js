import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import HomeScreen from './src/screens/HomeScreen';
import SymptomScreen from './src/screens/SymptomScreen';
import MedicationScreen from './src/screens/MedicationScreen';
import ReportScreen from './src/screens/ReportScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Tab.Navigator>
          <Tab.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'Dashboard' }}
          />
          <Tab.Screen 
            name="Symptoms" 
            component={SymptomScreen} 
            options={{ title: 'Log Symptoms' }}
          />
          <Tab.Screen 
            name="Medications" 
            component={MedicationScreen} 
            options={{ title: 'Medications' }}
          />
          <Tab.Screen 
            name="Reports" 
            component={ReportScreen} 
            options={{ title: 'Health Reports' }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
