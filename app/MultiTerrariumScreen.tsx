import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface TerrariumData {
    id: number;
    name: string;
    current_temp1: number;
    current_temp2: number;
    current_hum: number;
    last_update: string;
    type: string; // Added type field
}

const MultiTerrariumScreen: React.FC = () => {
    const [terrariums, setTerrariums] = useState<TerrariumData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const ws = new WebSocket('ws://212.47.71.180:8082');

        ws.onopen = () => {
            console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
            const updatedTerrariums: TerrariumData[] = JSON.parse(event.data);
            console.log('WebSocket message received:', updatedTerrariums);
            setTerrariums(updatedTerrariums);
            setLoading(false);
        };

        ws.onerror = (err) => {
            console.error('WebSocket error:', err);
            setError('Failed to connect to WebSocket');
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
        };

        return () => {
            ws.close();
        };
    }, []);

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Error: {error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={terrariums}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                    const {
                        name,
                        current_temp1,
                        current_temp2,
                        current_hum,
                        last_update,
                        type,
                    } = item;

                    // Format the date as DD/MM/YYYY
                    const formattedDate = new Intl.DateTimeFormat('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                    }).format(new Date(last_update));

                    // Format the time as HH:mm:ss (24-hour format)
                    const formattedTime = new Intl.DateTimeFormat('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false,
                    }).format(new Date(last_update));

                    return (
                        <View style={styles.terrariumCard}>
                            <Text style={styles.nameText}>{name}</Text>
                            <View style={styles.row}>
                                <Icon name="thermometer" size={24} color="#ff5722" />
                                <Text style={styles.label}>Temperature 1: {current_temp1}°C</Text>
                            </View>
                            <View style={styles.row}>
                                <Icon name="thermometer-lines" size={24} color="#ff5722" />
                                <Text style={styles.label}>Temperature 2: {current_temp2}°C</Text>
                            </View>
                            <View style={styles.row}>
                                <Icon name="water" size={24} color="#2196f3" />
                                <Text style={styles.label}>Humidity: {current_hum}%</Text>
                            </View>
                            <View style={styles.row}>
                                <Icon name="clock-outline" size={24} color="#607d8b" />
                                <Text style={styles.label}>
                                    Last Update: {formattedDate} {formattedTime}
                                </Text>
                            </View>
                            <View style={styles.row}>
                                <Icon name="cog" size={24} color="#607d8b" />
                                <Text style={styles.label}>Type: {type}</Text>
                            </View>
                        </View>
                    );
                }}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
        padding: 10,
    },
    terrariumCard: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    nameText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    label: {
        marginLeft: 10,
        fontSize: 16,
        color: '#555',
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
    },
    listContent: {
        paddingBottom: 20,
    },
});

export default MultiTerrariumScreen;
