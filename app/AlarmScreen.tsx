import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    ImageBackground,
    TouchableOpacity,
} from 'react-native';

interface Alarm {
    id: number;
    start_time: string;
    end_time: string | null;
    is_active: boolean;
    highest_offshoot: number | null;
}

interface Terrarium {
    id: number;
    name: string;
}

const AlarmsScreen: React.FC = () => {
    const [terrariums, setTerrariums] = useState<Terrarium[]>([]);
    const [alarms, setAlarms] = useState<Record<number, Alarm[]>>({});
    const [loading, setLoading] = useState<boolean>(true);

    const fetchTerrariumsAndAlarms = async () => {
        setLoading(true);
        try {
            const terrariumResponse = await fetch(
                'http://212.47.71.180:8080/terrariums/user/id/1'
            );
            if (!terrariumResponse.ok) throw new Error('Failed to fetch terrariums');
            const terrariumData: Terrarium[] = await terrariumResponse.json();
            setTerrariums(terrariumData);

            const alarmData: Record<number, Alarm[]> = {};
            for (const terrarium of terrariumData) {
                const alarmResponse = await fetch(
                    `http://212.47.71.180:8080/alarms/terrarium/${terrarium.id}`
                );
                if (!alarmResponse.ok) continue;
                const alarmsForTerrarium: Alarm[] = (await alarmResponse.json()).map((alarm: any) => ({
                    ...alarm,
                    is_active: !!alarm.active, // ✅ Convert to boolean
                }));
                alarmData[terrarium.id] = alarmsForTerrarium;
            }
            setAlarms(alarmData);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to fetch terrariums or alarms');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAlarm = async (alarmId: number) => {
        try {
            const response = await fetch(`http://212.47.71.180:8080/alarms/delete/${alarmId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorMsg = await response.text();
                Alert.alert('Error', errorMsg);
                return;
            }

            Alert.alert('Success', 'Alarm deleted successfully.');
            fetchTerrariumsAndAlarms(); // Refresh after deletion
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete alarm');
        }
    };


    useEffect(() => {
        fetchTerrariumsAndAlarms();
    }, []);

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <ImageBackground
            source={require('../app/app_tabs/backround_image.jpg')}
            style={styles.background}
            resizeMode="cover"
        >
            <View style={styles.overlay} />
            <View style={styles.titleContainer}>
                <Text style={styles.titleText}>Alarmy</Text>
            </View>

            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.refreshButtonContainer}>
                    <TouchableOpacity style={styles.button} onPress={fetchTerrariumsAndAlarms}>
                        <Text style={styles.buttonText}>Odśwież alarmy</Text>
                    </TouchableOpacity>
                </View>

                {terrariums.map((terrarium) => (
                    <View key={terrarium.id} style={styles.terrariumContainer}>
                        <Text style={styles.terrariumName}>{terrarium.name}</Text>
                        {alarms[terrarium.id]?.length > 0 ? (
                            alarms[terrarium.id].map((alarm) => (
                                <View
                                    key={alarm.id}
                                    style={[
                                        styles.alarmCard,
                                        alarm.is_active ? styles.activeAlarm : styles.inactiveAlarm,
                                    ]}
                                >
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <View>
                                            <Text style={styles.alarmText}>Start alarmu: {alarm.start_time}</Text>
                                            <Text style={styles.alarmText}>Koniec alarmu: {alarm.end_time || 'Trwający'}</Text>
                                            <Text style={styles.alarmText}>Amplituda (°C): {alarm.highest_offshoot ?? 'Brak danych'}</Text>
                                        </View>

                                        {!alarm.is_active && (
                                            <TouchableOpacity onPress={() => handleDeleteAlarm(alarm.id)}>
                                                <Text style={styles.deleteButton}>❌</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>

                            ))
                        ) : (
                            <Text style={styles.noAlarmsText}>Nie ma alarmów</Text>
                        )}
                    </View>
                ))}
            </ScrollView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    container: {
        padding: 10,
    },
    refreshButtonContainer: {
        marginBottom: 20,
        alignSelf: 'center',
    },
    terrariumContainer: {
        marginBottom: 20,
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    terrariumName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    alarmCard: {
        marginBottom: 10,
        padding: 10,
        borderRadius: 8,
    },
    activeAlarm: {
        backgroundColor: '#ffcccc', // Red
    },
    inactiveAlarm: {
        backgroundColor: '#fff3cd', // Yellow
    },
    alarmText: {
        fontSize: 14,
        marginBottom: 5,
    },
    noAlarmsText: {
        fontSize: 14,
        fontStyle: 'italic',
        color: '#888',
    },
    titleContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 15,
        alignItems: 'center',
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        marginBottom: 10,
    },
    titleText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    button: {
        backgroundColor: '#ffffff',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#4CAF50',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    buttonText: {
        fontWeight: 'bold',
        color: '#4CAF50',
        fontSize: 16,
    },
    deleteButton: {
        fontSize: 24,
        color: '#d32f2f',
        alignSelf: 'center',
        marginLeft: 10,
    },
});

export default AlarmsScreen;
