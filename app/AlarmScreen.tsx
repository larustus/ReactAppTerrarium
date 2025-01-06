import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    ImageBackground,
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
    type: string;
}

const AlarmsScreen: React.FC = () => {
    const [terrariums, setTerrariums] = useState<Terrarium[]>([]);
    const [alarms, setAlarms] = useState<Record<number, Alarm[]>>({});
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchTerrariums = async () => {
            try {
                const terrariumResponse = await fetch(
                    'http://212.47.71.180:8080/terrariums/user/id/1'
                );
                if (!terrariumResponse.ok) throw new Error('Failed to fetch terrariums');
                const terrariumData: Terrarium[] = await terrariumResponse.json();
                setTerrariums(terrariumData);

                // Fetch alarms for each terrarium
                const alarmData: Record<number, Alarm[]> = {};
                for (const terrarium of terrariumData) {
                    const alarmResponse = await fetch(
                        `http://212.47.71.180:8080/alarms/terrarium/${terrarium.id}`
                    );
                    if (!alarmResponse.ok) {
                        console.warn(`Failed to fetch alarms for terrarium ${terrarium.id}`);
                        continue;
                    }
                    const alarmsForTerrarium: Alarm[] = await alarmResponse.json();
                    alarmData[terrarium.id] = alarmsForTerrarium;
                }
                setAlarms(alarmData);
            } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to fetch terrariums or alarms');
            } finally {
                setLoading(false);
            }
        };

        fetchTerrariums();
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
            source={require('../app/app_tabs/backround_image.jpg')} // Update this to your background image path
            style={styles.background}
            resizeMode="cover"
        >
            {/* Overlay for dimmed effect */}
            <View style={styles.overlay} />

            <ScrollView contentContainerStyle={styles.container}>
                {terrariums.map((terrarium) => (
                    <View key={terrarium.id} style={styles.terrariumContainer}>
                        <Text style={styles.terrariumName}>{terrarium.name}</Text>
                        {alarms[terrarium.id]?.length > 0 ? (
                            alarms[terrarium.id].map((alarm) => (
                                <View
                                    key={alarm.id}
                                    style={[
                                        styles.alarmCard,
                                        alarm.end_time === null
                                            ? styles.activeAlarm // Red for ongoing alarms
                                            : styles.inactiveAlarm, // Yellow for resolved alarms
                                    ]}
                                >
                                    <Text style={styles.alarmText}>
                                        Start: {alarm.start_time}
                                    </Text>
                                    <Text style={styles.alarmText}>
                                        End: {alarm.end_time || 'Ongoing'}
                                    </Text>
                                    <Text style={styles.alarmText}>
                                        Offshoot: {alarm.highest_offshoot ?? 'N/A'}
                                    </Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.noAlarmsText}>No alarms yet</Text>
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
        backgroundColor: 'rgba(255, 255, 255, 0.3)', // Semi-transparent white overlay for dimmed effect
    },
    container: {
        padding: 10,
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
        backgroundColor: '#ffcccc', // Red for ongoing alarms
    },
    inactiveAlarm: {
        backgroundColor: '#fff3cd', // Yellow for resolved alarms
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
});

export default AlarmsScreen;
