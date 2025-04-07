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
    TouchableWithoutFeedback,
    Keyboard,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider'

interface TerrariumData {
    id: number;
    name: string;
    current_temp1: number;
    current_temp2: number;
    current_hum: number;
    last_update: string | null;
    temperature_goal: number;
    temperature_thermostat: number | null;
    humidity_goal: number;
    max_temp: number;
    min_temp: number;
    max_hum: number;
    min_hum: number;
    water_time: string | null;
    water_period: string | null;
}


const MultiTerrariumScreen: React.FC = () => {
    const [terrariums, setTerrariums] = useState<TerrariumData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTerrarium, setSelectedTerrarium] = useState<TerrariumData | null>(null);
    const [generalModalVisible, setGeneralModalVisible] = useState(false);
    const [thresholdModalVisible, setThresholdModalVisible] = useState(false);
    const [waterModalVisible, setWaterModalVisible] = useState(false);

    // Inputs for General Settings
    const [name, setName] = useState<string>('');
    const [tempGoal, setTempGoal] = useState<number>(0);
    const [humGoal, setHumGoal] = useState<number>(0);

    // Inputs for Threshold Settings
    const [maxTemp, setMaxTemp] = useState<number>(0);
    const [minTemp, setMinTemp] = useState<number>(0);
    const [maxHum, setMaxHum] = useState<number>(0);
    const [minHum, setMinHum] = useState<number>(0);

    // Inputs for Water Settings
    const [waterTime, setWaterTime] = useState<string>('');
    const [waterPeriod, setWaterPeriod] = useState<string>('');

    // New state for fetched humidity goal
    const [fetchedHumGoal, setFetchedHumGoal] = useState<number>(0);

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

    // Open modals
    const openGeneralModal = (terrarium: TerrariumData) => {
        setSelectedTerrarium(terrarium);
        setName(terrarium.name);
        setTempGoal((terrarium.temperature_goal));
        setHumGoal((terrarium.humidity_goal));
        setGeneralModalVisible(true);
    };

    const openThresholdModal = (terrarium: TerrariumData) => {
        setSelectedTerrarium(terrarium);
        setFetchedHumGoal(Math.round(terrarium.humidity_goal));

        setMaxTemp(terrarium.max_temp);
        setMinTemp(terrarium.min_temp);
        setMaxHum(terrarium.max_hum);
        setMinHum(terrarium.min_hum);

        setThresholdModalVisible(true);
    };


    const openWaterModal = (terrarium: TerrariumData) => {
        setSelectedTerrarium(terrarium);
        setWaterTime('');
        setWaterPeriod('');
        setWaterModalVisible(true);
    };

    // Handle save for all modals
    const handleSave = async (field: string, value: string) => {
        if (!selectedTerrarium) return;

        const id = selectedTerrarium.id;
        let url = "";
        let paramKey = "";

        if (field === "Temperature Goal") {
            url = `http://212.47.71.180:8080/terrariums/${id}/temperature-goal`;
            paramKey = "temperatureGoal";
        } else if (field === "Humidity Goal") {
            url = `http://212.47.71.180:8080/terrariums/${id}/humidity-goal`;
            paramKey = "humidityGoal";
        } else if (field === "Max Temp") {
            url = `http://212.47.71.180:8080/terrariums/${id}/max-temp`;
            paramKey = "maxTemp";
        } else if (field === "Min Temp") {
            url = `http://212.47.71.180:8080/terrariums/${id}/min-temp`;
            paramKey = "minTemp";
        } else if (field === "Max Hum") {
            url = `http://212.47.71.180:8080/terrariums/${id}/max-hum`;
            paramKey = "maxHum";
        } else if (field === "Min Hum") {
            url = `http://212.47.71.180:8080/terrariums/${id}/min-hum`;
            paramKey = "minHum";
        } else {
            Alert.alert("Unsupported field", `${field} is not handled`);
            return;
        }

        try {
            const response = await fetch(`${url}?${paramKey}=${value}`, {
                method: "PUT",
            });

            if (!response.ok) {
                throw new Error("Failed to update");
            }

            const updated = await response.json();

            Alert.alert("Success", `${field} updated successfully.`);
            console.log("Updated Terrarium:", updated);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", `Failed to update ${field}`);
        }
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

            {/* Title at the Top */}
            <View style={styles.titleContainer}>
                <Text style={styles.titleText}>Lista terrariów</Text>
            </View>

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
                        temperature_goal,
                        temperature_thermostat,
                        humidity_goal,
                    } = item;

                    let formattedDate = "Brak danych";
                    let formattedTime = "";

                    if (last_update) {
                        const date = new Date(last_update);
                        formattedDate = new Intl.DateTimeFormat('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                        }).format(date);

                        formattedTime = new Intl.DateTimeFormat('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false,
                        }).format(date);
                    }

                    return (
                        <View style={styles.terrariumCard}>
                            <View style={styles.row}>
                                <Text style={styles.nameText}>{name}</Text>
                            </View>
                            <View style={styles.row}>
                                <Icon name="thermometer" size={24} color="#ff5722" />
                                <Text style={styles.label}>
                                    Temperatura 1: {current_temp1}°C
                                </Text>
                            </View>
                            <View style={styles.row}>
                                <Icon name="thermometer-lines" size={24} color="#ff5722" />
                                <Text style={styles.label}>
                                    Temperatura 2: {current_temp2}°C
                                </Text>
                            </View>
                            <View style={styles.row}>
                                <Icon name="thermostat" size={24} color="#ff5722" />
                                <Text style={styles.label}>
                                    Temperatura termostat: {temperature_thermostat}°C
                                </Text>
                            </View>
                            <View style={styles.row}>
                                <Icon name="water" size={24} color="#2196f3" />
                                <Text style={styles.label}>Wilgotność: {current_hum}%</Text>
                            </View>
                            <View style={styles.row}>
                                <Icon name="target" size={24} color="#ff5722" />
                                <Text style={styles.label}>
                                    Temperatura zadana: {temperature_goal}°C
                                </Text>
                            </View>
                            <View style={styles.row}>
                                <Icon name="target" size={24} color="#2196f3" />
                                <Text style={styles.label}>Wilgotność zadana: {humidity_goal}%</Text>
                            </View>
                            <View style={styles.row}>
                                <Icon name="clock-outline" size={24} color="#607d8b" />
                                <Text style={styles.label}>
                                    Ostatnia aktualizacja: {formattedDate} {formattedTime}
                                </Text>
                            </View>
                            {/*<View style={styles.row}>*/}
                            {/*    <Icon name="cog" size={24} color="#607d8b" />*/}
                            {/*    <Text style={styles.label}>Typ terrarium: {type}</Text>*/}
                            {/*</View>*/}
                            {/* Buttons */}
                            <View style={styles.buttonRow}>
                                <TouchableOpacity
                                    onPress={() => openGeneralModal(item)}
                                    style={styles.iconButton}
                                >
                                    <Icon name="cog" size={24} color="#fff" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => openThresholdModal(item)}
                                    style={styles.iconButton}
                                >
                                    <Icon name="thermometer-lines" size={24} color="#fff" />
                                </TouchableOpacity>

                                {/*{type === 'lamp_water' && (*/}
                                {/*    <TouchableOpacity*/}
                                {/*        onPress={() => openWaterModal(item)}*/}
                                {/*        style={styles.iconButton}*/}
                                {/*    >*/}
                                {/*        <Icon name="water-outline" size={24} color="#fff" />*/}
                                {/*    </TouchableOpacity>*/}
                                {/*)}*/}
                            </View>
                        </View>
                    );
                }}
                contentContainerStyle={styles.listContent}
            />

            {/* General Modal */}
            {/* General Modal */}
            <Modal visible={generalModalVisible} animationType="slide" transparent>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit General Settings</Text>
                        <Slider
                            style={styles.slider}
                            minimumValue={15}
                            maximumValue={40}
                            step={0.1}
                            value={tempGoal}
                            onValueChange={setTempGoal}
                        />
                        <Text style={styles.label}>Temperature Goal: {tempGoal.toFixed(1)}°C</Text>
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={() => handleSave('Temperature Goal', String(tempGoal))}
                        >
                            <Text style={styles.saveText}>Save Temp Goal</Text>
                        </TouchableOpacity>

                        <Slider
                            style={styles.slider}
                            minimumValue={10}
                            maximumValue={90}
                            step={1}
                            value={humGoal}
                            onValueChange={setHumGoal}
                        />
                        <Text style={styles.label}>Humidity Goal: {humGoal}%</Text>
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={() => handleSave('Humidity Goal', String(humGoal))}
                        >
                            <Text style={styles.saveText}>Save Hum Goal</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setGeneralModalVisible(false)}
                        >
                            <Text style={styles.cancelText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Threshold Modal */}
            <Modal visible={thresholdModalVisible} animationType="slide" transparent>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Threshold Settings</Text>
                        <Slider
                            style={styles.slider}
                            minimumValue={tempGoal}
                            maximumValue={50}
                            step={0.5}
                            value={maxTemp}
                            onValueChange={setMaxTemp}
                        />
                        <Text style={styles.label}>Max Temp: {maxTemp.toFixed(1)}°C</Text>
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={() => handleSave('Max Temp', String(maxTemp))}
                        >
                            <Text style={styles.saveText}>Save Max Temp</Text>
                        </TouchableOpacity>

                        <Slider
                            style={styles.slider}
                            minimumValue={20}
                            maximumValue={tempGoal}
                            step={0.5}
                            value={minTemp}
                            onValueChange={setMinTemp}
                        />
                        <Text style={styles.label}>Min Temp: {minTemp.toFixed(1)}°C</Text>
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={() => handleSave('Min Temp', String(minTemp))}
                        >
                            <Text style={styles.saveText}>Save Min Temp</Text>
                        </TouchableOpacity>

                        <Slider
                            style={styles.slider}
                            minimumValue={fetchedHumGoal}
                            maximumValue={90}
                            step={1}
                            value={maxHum}
                            onValueChange={setMaxHum}
                        />
                        <Text style={styles.label}>Max Hum: {maxHum}%</Text>
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={() => handleSave('Max Hum', String(maxHum))}
                        >
                            <Text style={styles.saveText}>Save Max Hum</Text>
                        </TouchableOpacity>

                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={fetchedHumGoal}
                            step={1}
                            value={minHum}
                            onValueChange={setMinHum}
                        />
                        <Text style={styles.label}>Min Hum: {minHum}%</Text>
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={() => handleSave('Min Hum', String(minHum))}
                        >
                            <Text style={styles.saveText}>Save Min Hum</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setThresholdModalVisible(false)}
                        >
                            <Text style={styles.cancelText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
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
    titleContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
        padding: 15,
        alignItems: 'center',
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
    },
    titleText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
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
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        marginTop: 10,
    },
    iconButton: {
        backgroundColor: '#4CAF50',
        padding: 10,
        borderRadius: 5,
    },
    saveText: { fontWeight: 'bold' },
    slider: {
        width: '100%',
        height: 40,
        marginBottom: 20,
    },
});

export default MultiTerrariumScreen;
