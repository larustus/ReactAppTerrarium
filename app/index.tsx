import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const HomeScreen: React.FC = () => {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to the Terrarium App</Text>
            <Button
                title="Go to Dashboard"
                onPress={() => router.push('/app_tabs')} // Navigate to the bottom tab navigator
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
});

export default HomeScreen;
