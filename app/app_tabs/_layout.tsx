import React from 'react';
import { Tabs } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const TabsLayout: React.FC = () => {
    return (
        <Tabs
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    let iconName = '';

                    if (route.name === 'index') {
                        iconName = 'home'; // Icon for MultiTerrariumScreen
                    } else if (route.name === 'statistics') {
                        iconName = 'chart-bar'; // Icon for StatisticsScreen
                    } else if (route.name === 'add') {
                        iconName = 'plus-circle'; // Icon for AddTerrariumScreen
                    }

                    return <Icon name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#42a5f5', // Active icon color
                tabBarInactiveTintColor: '#757575', // Inactive icon color
            })}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarLabel: 'Terrarium Display',
                }}
            />
            <Tabs.Screen
                name="statistics"
                options={{
                    tabBarLabel: 'Statistics',
                }}
            />
            <Tabs.Screen
                name="add"
                options={{
                    tabBarLabel: 'Add Terrarium',
                }}
            />
        </Tabs>
    );
};

export default TabsLayout;
