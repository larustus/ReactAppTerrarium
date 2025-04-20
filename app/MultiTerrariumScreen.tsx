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
import DateTimePicker from "@react-native-community/datetimepicker";
import DateTimePickerModal from "react-native-modal-datetime-picker";


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
    const [pinModalVisible, setPinModalVisible] = useState(false);
    const [assignedPins, setAssignedPins] = useState<{ id: number; function: string }[]>([]);

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

    const [showTimePicker, setShowTimePicker] = useState(false);
    const [selectedTime, setSelectedTime] = useState<Date | null>(null);

    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        ws.current = new WebSocket('ws://212.47.71.180:8082');

        ws.current.onopen = () => {
            console.log('WebSocket connected');
        };

        ws.current.onmessage = (event) => {
            console.log("📦 Message received from WebSocket:", event.data);
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

    const openPinModal = async (terrarium: TerrariumData) => {
        try {
            const response = await fetch(`http://212.47.71.180:8080/pins/assigned/1/${terrarium.id}`);
            const data = await response.json();
            setAssignedPins(data);
            setPinModalVisible(true);
        } catch (error) {
            console.error("Failed to fetch pins:", error);
            Alert.alert("Błąd", "Nie udało się pobrać przypisanych pinów.");
        }
    };

    const openWaterModal = (terrarium: TerrariumData) => {
        setSelectedTerrarium(terrarium);
        setWaterTime(terrarium.water_time ?? '');
        setWaterPeriod(terrarium.water_period?.toString() ?? '');
        setWaterModalVisible(true);
    };

    const deleteTerrarium = async (id: number) => {
        try {
            const res = await fetch(`http://212.47.71.180:8080/terrariums/remove/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setTerrariums(prev => prev.filter(t => t.id !== id));
                Alert.alert("Sukces", "Terrarium zostało usunięte.");
            } else {
                const msg = await res.text();
                Alert.alert("Błąd", `Nie udało się usunąć terrarium: ${msg}`);
            }
        } catch (error) {
            console.error("Error deleting terrarium:", error);
            Alert.alert("Błąd", "Wystąpił problem podczas usuwania terrarium.");
        }
    };


    const confirmDeleteTerrarium = (id: number) => {
        Alert.alert(
            "Usuń terrarium",
            "Czy na pewno chcesz usunąć to terrarium?",
            [
                { text: "Anuluj", style: "cancel" },
                { text: "Usuń", style: "destructive", onPress: () => deleteTerrarium(id) }
            ]
        );
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

            Alert.alert("Sukces", `Zaktualizowano ${field} `);
            console.log("Updated Terrarium:", updated);
        } catch (error) {
            console.error(error);
            Alert.alert("Błąd", `Nie udało się zaktualizować ${field}`);
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
            source={require('./app_tabs/background_image.png')}
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
                                <View style={{ flexDirection: 'row' }}>
                                    <TouchableOpacity onPress={() => openPinModal(item)} style={{ marginRight: 10 }}>
                                        <Icon name="chip" size={24} color="#4CAF50" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => confirmDeleteTerrarium(item.id)}>
                                        <Icon name="close-circle" size={24} color="#f44336" />
                                    </TouchableOpacity>
                                </View>
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

                                {item.water_time && item.water_period && (
                                    <TouchableOpacity
                                        onPress={() => openWaterModal(item)}
                                        style={styles.iconButton}
                                    >
                                        <Icon name="water-outline" size={24} color="#fff" />
                                    </TouchableOpacity>
                                )}

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
                        <Text style={styles.modalTitle}>Zmiana wartości ogólnych</Text>
                        <Slider
                            style={styles.slider}
                            minimumValue={15}
                            maximumValue={40}
                            step={0.1}
                            value={tempGoal}
                            onValueChange={setTempGoal}
                        />
                        <Text style={styles.label}>Wartość zadana temperatury: {tempGoal.toFixed(1)}°C</Text>
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={() => handleSave('Temperature Goal', String(tempGoal))}
                        >
                            <Text style={styles.saveText}>Zapisz temperaturę</Text>
                        </TouchableOpacity>

                        <Slider
                            style={styles.slider}
                            minimumValue={10}
                            maximumValue={90}
                            step={1}
                            value={humGoal}
                            onValueChange={setHumGoal}
                        />
                        <Text style={styles.label}>Cel wilgotności: {humGoal}%</Text>
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={() => handleSave('Humidity Goal', String(humGoal))}
                        >
                            <Text style={styles.saveText}>Zapisz wilgotność</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setGeneralModalVisible(false)}
                        >
                            <Text style={styles.cancelText}>Zamknij</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Threshold Modal */}
            <Modal visible={thresholdModalVisible} animationType="slide" transparent>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Zmiana wartości granicznych</Text>
                        <Slider
                            style={styles.slider}
                            minimumValue={tempGoal}
                            maximumValue={50}
                            step={0.5}
                            value={maxTemp}
                            onValueChange={setMaxTemp}
                        />
                        <Text style={styles.label}>Maksymalna temperatura: {maxTemp.toFixed(1)}°C</Text>
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={() => handleSave('Max Temp', String(maxTemp))}
                        >
                            <Text style={styles.saveText}>Zapisz temperaturę</Text>
                        </TouchableOpacity>

                        <Slider
                            style={styles.slider}
                            minimumValue={20}
                            maximumValue={tempGoal}
                            step={0.5}
                            value={minTemp}
                            onValueChange={setMinTemp}
                        />
                        <Text style={styles.label}>Minimalna temperatura: {minTemp.toFixed(1)}°C</Text>
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={() => handleSave('Min Temp', String(minTemp))}
                        >
                            <Text style={styles.saveText}>Zapisz temperaturę</Text>
                        </TouchableOpacity>

                        <Slider
                            style={styles.slider}
                            minimumValue={fetchedHumGoal}
                            maximumValue={90}
                            step={1}
                            value={maxHum}
                            onValueChange={setMaxHum}
                        />
                        <Text style={styles.label}>Maksymalna wilgotność: {maxHum}%</Text>
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={() => handleSave('Max Hum', String(maxHum))}
                        >
                            <Text style={styles.saveText}>Zapisz wilgotność</Text>
                        </TouchableOpacity>

                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={fetchedHumGoal}
                            step={1}
                            value={minHum}
                            onValueChange={setMinHum}
                        />
                        <Text style={styles.label}>Minimalna wilgotność: {minHum}%</Text>
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={() => handleSave('Min Hum', String(minHum))}
                        >
                            <Text style={styles.saveText}>Zapisz wilgotność</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setThresholdModalVisible(false)}
                        >
                            <Text style={styles.cancelText}>Zamknij</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={waterModalVisible} animationType="slide" transparent>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Edycja ustawień wody</Text>

                            <Text style={styles.label}>Czas startu dolewania wody:</Text>
                            <TouchableOpacity
                                onPress={() => setShowTimePicker(true)}
                                style={[styles.input, { justifyContent: 'center' }]}
                            >
                                <Text>{waterTime || 'Wybierz czas'}</Text>
                            </TouchableOpacity>

                            <DateTimePickerModal
                                isVisible={showTimePicker}
                                mode="time"
                                is24Hour={true}
                                onConfirm={(date) => {
                                    setShowTimePicker(false);
                                    if (date) {
                                        setSelectedTime(date);
                                        const hours = date.getHours().toString().padStart(2, '0');
                                        const minutes = date.getMinutes().toString().padStart(2, '0');
                                        const timeString = `${hours}:${minutes}:00`; // seconds hardcoded
                                        setWaterTime(timeString);
                                    }
                                }}
                                onCancel={() => setShowTimePicker(false)}
                            />



                            <Text style={styles.label}>Czas trwania dolewania wody (sekundy):</Text>
                            <TextInput
                                style={styles.input}
                                value={waterPeriod}
                                onChangeText={setWaterPeriod}
                                placeholder="np. 45"
                                keyboardType="numeric"
                            />

                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={async () => {
                                    if (!selectedTerrarium) return;

                                    try {
                                        const id = selectedTerrarium.id;

                                        const timeRes = await fetch(
                                            `http://212.47.71.180:8080/terrariums/${id}/water-time?waterTime=${waterTime}`,
                                            { method: 'PUT' }
                                        );
                                        if (!timeRes.ok) throw new Error("Failed to update water time");

                                        const periodRes = await fetch(
                                            `http://212.47.71.180:8080/terrariums/${id}/water-period?waterPeriod=${waterPeriod}`,
                                            { method: 'PUT' }
                                        );
                                        if (!periodRes.ok) throw new Error("Failed to update water period");

                                        Alert.alert("Sukces", "Ustawienia wody zaktualizowano!");
                                        setWaterModalVisible(false);
                                    } catch (error) {
                                        console.error(error);
                                        Alert.alert("Błąd", "Nie udało się zaktualizować ustawień wody");
                                    }
                                }}
                            >
                                <Text style={styles.saveText}>Zapisz</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setWaterModalVisible(false)}
                            >
                                <Text style={styles.cancelText}>Zamknij</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            <Modal visible={pinModalVisible} animationType="slide" transparent>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Przypisane piny</Text>
                        {assignedPins.length > 0 ? (
                            assignedPins.map((pin, index) => (
                                <Text key={index} style={styles.label}>
                                    Funkcja: {pin.function} | Pin ID: {pin.id}
                                </Text>
                            ))
                        ) : (
                            <Text style={styles.label}>Brak przypisanych pinów.</Text>
                        )}
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setPinModalVisible(false)}
                        >
                            <Text style={styles.cancelText}>Zamknij</Text>
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
