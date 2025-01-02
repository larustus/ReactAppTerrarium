import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MultiTerrariumScreen from './app/MultiTerrariumScreen';
import StatisticsScreen from './app/StatisticsScreen';
import AddTerrariumScreen from './app/AddTerrariumScreen';

const Tab = createBottomTabNavigator();

const App: React.FC = () => {
    return (
        <NavigationContainer>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ color, size }) => {
                        let iconName = '';

                        if (route.name === 'Statistics') {
                            iconName = 'chart-bar'; // Icon for Statistics
                        } else if (route.name === 'Current') {
                            iconName = 'home'; // Icon for Current MultiTerrariumScreen
                        } else if (route.name === 'Add Terrarium') {
                            iconName = 'plus-circle'; // Icon for Add Terrarium
                        }

                        return <Icon name={iconName} size={size} color={color} />;
                    },
                    tabBarActiveTintColor: '#42a5f5', // Active icon color
                    tabBarInactiveTintColor: '#757575', // Inactive icon color
                    headerShown: false, // Hide header for cleaner UI
                })}
            >
                <Tab.Screen name="Statistics" component={StatisticsScreen} />
                <Tab.Screen name="Current" component={MultiTerrariumScreen} />
                <Tab.Screen name="Add Terrarium" component={AddTerrariumScreen} />
            </Tab.Navigator>
        </NavigationContainer>
    );
};

export default App;
