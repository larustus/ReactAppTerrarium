import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    ImageBackground,
    Modal,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface TerrariumData {
    id: number;
    name: string;
    current_temp1: number;
    current_temp2: number;
    current_hum: number;
    last_update: string;
    type: string;
}

const MultiTerrariumScreen: React.FC = () => {
    const [terrariums, setTerrariums] = useState<TerrariumData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTerrarium, setSelectedTerrarium] = useState<TerrariumData | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [tempGoal, setTempGoal] = useState<string>('');
    const [humGoal, setHumGoal] = useState<string>('');
    const [maxTemp, setMaxTemp] = useState<string>('');
    const [minTemp, setMinTemp] = useState<string>('');
    const [maxHum, setMaxHum] = useState<string>('');
    const [minHum, setMinHum] = useState<string>('');

    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        ws.current = new WebSocket('ws://212.47.71.180:8082');

        ws.current.onopen = () => {
            console.log('WebSocket connected');
        };

        ws.current.onmessage = (event) => {
            const updatedTerrariums: TerrariumData[] = JSON.parse(event.data);
            setTerrariums(updatedTerrariums);
            setLoading(false);
        };

        ws.current.onerror = (err) => {
            console.error('WebSocket error:', err);
            setError('Failed to connect to WebSocket');
        };

        ws.current.onclose = () => {
            console.log('WebSocket disconnected');
        };

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, []);

    const openModal = (terrarium: TerrariumData) => {
        setSelectedTerrarium(terrarium);
        setTempGoal('');
        setHumGoal('');
        setMaxTemp('');
        setMinTemp('');
        setMaxHum('');
        setMinHum('');
        setModalVisible(true);
    };

    const handleSave = (field: string, value: string) => {
        if (!selectedTerrarium) return;

        // Placeholder: Replace with API call to update the specific field for the terrarium
        console.log(`Updating ${field} of Terrarium ${selectedTerrarium.id} to ${value}`);

        // Close modal and refresh the list if necessary
        Alert.alert('Success', `${field} updated successfully.`);
        setModalVisible(false);
    };

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
        <ImageBackground
            source={require('../app/app_tabs/backround_image.jpg')}
            style={styles.background}
            resizeMode="cover"
        >
            <View style={styles.overlay} />

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

                    const formattedDate = new Intl.DateTimeFormat('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                    }).format(new Date(last_update));

                    const formattedTime = new Intl.DateTimeFormat('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false,
                    }).format(new Date(last_update));

                    return (
                        <View style={styles.terrariumCard}>
                            <View style={styles.row}>
                                <Text style={styles.nameText}>{name}</Text>
                                <TouchableOpacity onPress={() => openModal(item)}>
                                    <Icon name="pencil" size={24} color="#2196f3" />
                                </TouchableOpacity>
                            </View>
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

            {/* Modal for Editing Terrarium */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <KeyboardAvoidingView
                        style={styles.modalContainer}
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    >
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>
                                Edit Terrarium: {selectedTerrarium?.name}
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={tempGoal}
                                onChangeText={setTempGoal}
                                placeholder="Temperature Goal"
                                keyboardType="numeric"
                            />
                            <TouchableOpacity
                                onPress={() => handleSave('Temperature Goal', tempGoal)}
                                style={styles.saveButton}
                            >
                                <Icon name="content-save" size={24} color="#fff" />
                            </TouchableOpacity>

                            <TextInput
                                style={styles.input}
                                value={humGoal}
                                onChangeText={setHumGoal}
                                placeholder="Humidity Goal"
                                keyboardType="numeric"
                            />
                            <TouchableOpacity
                                onPress={() => handleSave('Humidity Goal', humGoal)}
                                style={styles.saveButton}
                            >
                                <Icon name="content-save" size={24} color="#fff" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={styles.cancelButton}
                            >
                                <Text style={styles.cancelText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
            </Modal>
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
        flex: 1,
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
        color: '#333',
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    label: {
        fontSize: 16,
        color: '#555',
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
        marginTop: 20,
    },
    listContent: {
        paddingBottom: 20,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    },
    saveButton: {
        backgroundColor: '#4CAF50',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 20,
    },
    cancelButton: {
        marginTop: 20,
    },
    cancelText: {
        color: '#f00',
        fontWeight: 'bold',
    },
});

export default MultiTerrariumScreen;
