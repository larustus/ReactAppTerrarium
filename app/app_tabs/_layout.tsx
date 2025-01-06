import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, ImageBackground } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const TabsLayout: React.FC = () => {
    return (
        <ImageBackground
            source={require('../app_tabs/backround_image.jpg')} // Replace with your image path
            style={styles.background}
            resizeMode="cover"
        >
            <View style={styles.container}>
                <Tabs
                    screenOptions={({ route }) => ({
                        tabBarIcon: ({ color, size }) => {
                            let iconName = '';

                            if (route.name === 'index') {
                                iconName = 'home'; // Icon for Home screen
                            } else if (route.name === 'statistics') {
                                iconName = 'chart-bar'; // Icon for Statistics screen
                            } else if (route.name === 'add') {
                                iconName = 'plus-circle'; // Icon for Add Terrarium screen
                            } else if (route.name === 'alarms') {
                                iconName = 'bell'; // Icon for Alarms screen
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
                            tabBarLabel: 'Home',
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
                    <Tabs.Screen
                        name="alarms"
                        options={{
                            tabBarLabel: 'Alarms',
                        }}
                    />
                </Tabs>
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
    },
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.8)', // Slight transparency if needed
    },
});

export default TabsLayout;
