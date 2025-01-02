import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

interface TerrariumDetails {
    name: string;
    type: string | null;
    temperature_goal: string;
    humidity_goal: string;
    max_temp: string;
    min_temp: string;
    max_hum: string;
    min_hum: string;
    water_time: Date | null;
    water_period: string;
    pins: {
        thermometer: string | null;
        hygrometer: string | null;
        heating: string | null;
        thermostat_probe: string | null;
        water_control: string | null;
    };
}

const AddTerrariumScreen: React.FC = () => {
    const [step, setStep] = useState(1); // Current page (1 or 2)
    const [terrariumDetails, setTerrariumDetails] = useState<TerrariumDetails>({
        name: '',
        type: null,
        temperature_goal: '',
        humidity_goal: '',
        max_temp: '',
        min_temp: '',
        max_hum: '',
        min_hum: '',
        water_time: null,
        water_period: '',
        pins: {
            thermometer: null,
            hygrometer: null,
            heating: null,
            thermostat_probe: null,
            water_control: null,
        },
    });
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Update state dynamically for terrarium details
    const updateTerrariumDetail = (field: keyof TerrariumDetails, value: any) => {
        setTerrariumDetails((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Update state dynamically for pin assignments
    const updatePinAssignment = (field: keyof TerrariumDetails['pins'], value: any) => {
        setTerrariumDetails((prev) => ({
            ...prev,
            pins: {
                ...prev.pins,
                [field]: value,
            },
        }));
    };

    const handleTimeChange = (event: any, selectedTime: Date | undefined) => {
        setShowTimePicker(false); // Close the picker
        if (selectedTime) {
            updateTerrariumDetail('water_time', selectedTime);
        }
    };

    const handleNext = () => {
        if (step === 1) {
            // Validation for Step 1
            if (!terrariumDetails.name.trim()) {
                Alert.alert('Error', 'Name is required.');
                return;
            }
            if (!terrariumDetails.type) {
                Alert.alert('Error', 'Terrarium type is required.');
                return;
            }
            setStep(2);
        }
    };

    const handlePrevious = () => {
        setStep(1);
    };

    const handleSubmit = () => {
        console.log('Terrarium to be submitted:', terrariumDetails);
        Alert.alert('Success', 'Terrarium created successfully!');
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {/* Step 1: Terrarium Details */}
                {step === 1 && (
                    <View style={styles.container}>
                        <Text style={styles.title}>Add New Terrarium - Step 1</Text>

                        {/* Name Input */}
                        <Text style={styles.label}>Name</Text>
                        <TextInput
                            style={styles.input}
                            value={terrariumDetails.name}
                            onChangeText={(value) => updateTerrariumDetail('name', value)}
                            placeholder="Enter terrarium name"
                        />

                        {/* Type Picker */}
                        <Text style={styles.label}>Type</Text>
                        <Picker
                            selectedValue={terrariumDetails.type}
                            onValueChange={(value) => updateTerrariumDetail('type', value)}
                            style={styles.picker}
                        >
                            <Picker.Item label="Select Type" value={null} />
                            <Picker.Item label="Lamp" value="lamp" />
                            <Picker.Item label="Mat" value="mat" />
                            <Picker.Item label="Lamp with Mist" value="lamp_mist" />
                        </Picker>

                        {/* Numeric Inputs */}
                        <Text style={styles.label}>Temperature Goal</Text>
                        <TextInput
                            style={styles.input}
                            value={terrariumDetails.temperature_goal}
                            onChangeText={(value) =>
                                updateTerrariumDetail('temperature_goal', value)
                            }
                            placeholder="Enter temperature goal"
                            keyboardType="numeric"
                        />

                        <Text style={styles.label}>Humidity Goal</Text>
                        <TextInput
                            style={styles.input}
                            value={terrariumDetails.humidity_goal}
                            onChangeText={(value) =>
                                updateTerrariumDetail('humidity_goal', value)
                            }
                            placeholder="Enter humidity goal"
                            keyboardType="numeric"
                        />

                        <Text style={styles.label}>Max Temperature</Text>
                        <TextInput
                            style={styles.input}
                            value={terrariumDetails.max_temp}
                            onChangeText={(value) => updateTerrariumDetail('max_temp', value)}
                            placeholder="Enter max temperature"
                            keyboardType="numeric"
                        />

                        <Text style={styles.label}>Min Temperature</Text>
                        <TextInput
                            style={styles.input}
                            value={terrariumDetails.min_temp}
                            onChangeText={(value) => updateTerrariumDetail('min_temp', value)}
                            placeholder="Enter min temperature"
                            keyboardType="numeric"
                        />

                        <Text style={styles.label}>Max Humidity</Text>
                        <TextInput
                            style={styles.input}
                            value={terrariumDetails.max_hum}
                            onChangeText={(value) => updateTerrariumDetail('max_hum', value)}
                            placeholder="Enter max humidity"
                            keyboardType="numeric"
                        />

                        <Text style={styles.label}>Min Humidity</Text>
                        <TextInput
                            style={styles.input}
                            value={terrariumDetails.min_hum}
                            onChangeText={(value) => updateTerrariumDetail('min_hum', value)}
                            placeholder="Enter min humidity"
                            keyboardType="numeric"
                        />

                        {/* Optional Water Period */}
                        {terrariumDetails.type === 'lamp_mist' && (
                            <>
                                <Text style={styles.label}>Water Period (Optional, seconds)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={terrariumDetails.water_period}
                                    onChangeText={(value) =>
                                        updateTerrariumDetail('water_period', value)
                                    }
                                    placeholder="Enter water period"
                                    keyboardType="numeric"
                                />
                            </>
                        )}

                        {/* Optional Water Time */}
                        {terrariumDetails.type === 'lamp_mist' && (
                            <>
                                <Text style={styles.label}>Water Time (Optional)</Text>
                                {terrariumDetails.water_time && (
                                    <Text style={styles.timeText}>
                                        Selected Time:{' '}
                                        {terrariumDetails.water_time
                                            .toTimeString()
                                            .slice(0, 5)}
                                    </Text>
                                )}
                                <Button
                                    title="Pick Water Time"
                                    onPress={() => setShowTimePicker(true)}
                                />
                                {showTimePicker && (
                                    <DateTimePicker
                                        value={terrariumDetails.water_time || new Date()}
                                        mode="time"
                                        display="default"
                                        onChange={handleTimeChange}
                                    />
                                )}
                            </>
                        )}

                        <Button title="Next" onPress={handleNext} />
                    </View>
                )}

                {/* Step 2: Assign Pins */}
                {step === 2 && (
                    <View style={styles.container}>
                        <Text style={styles.title}>Assign Pins - Step 2</Text>

                        <Text style={styles.label}>Thermometer Pin</Text>
                        <TextInput
                            style={styles.input}
                            value={terrariumDetails.pins.thermometer || ''}
                            onChangeText={(value) =>
                                updatePinAssignment('thermometer', value)
                            }
                            placeholder="Enter thermometer pin"
                        />

                        <Text style={styles.label}>Hygrometer Pin</Text>
                        <TextInput
                            style={styles.input}
                            value={terrariumDetails.pins.hygrometer || ''}
                            onChangeText={(value) =>
                                updatePinAssignment('hygrometer', value)
                            }
                            placeholder="Enter hygrometer pin"
                        />

                        <Text style={styles.label}>Heating Pin</Text>
                        <TextInput
                            style={styles.input}
                            value={terrariumDetails.pins.heating || ''}
                            onChangeText={(value) =>
                                updatePinAssignment('heating', value)
                            }
                            placeholder="Enter heating pin"
                        />

                        <Text style={styles.label}>Thermostat Probe Pin</Text>
                        <TextInput
                            style={styles.input}
                            value={terrariumDetails.pins.thermostat_probe || ''}
                            onChangeText={(value) =>
                                updatePinAssignment('thermostat_probe', value)
                            }
                            placeholder="Enter thermostat probe pin"
                        />

                        {terrariumDetails.type === 'lamp_mist' && (
                            <>
                                <Text style={styles.label}>Water Control Pin</Text>
                                <TextInput
                                    style={styles.input}
                                    value={terrariumDetails.pins.water_control || ''}
                                    onChangeText={(value) =>
                                        updatePinAssignment('water_control', value)
                                    }
                                    placeholder="Enter water control pin"
                                />
                            </>
                        )}

                        <View style={styles.buttonRow}>
                            <Button title="Previous" onPress={handlePrevious} />
                            <Button title="Submit" onPress={handleSubmit} />
                        </View>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        paddingBottom: 20,
    },
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
        marginTop: 15,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        fontSize: 16,
    },
    picker: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 10,
    },
    timeText: {
        fontSize: 14,
        marginBottom: 10,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
});

export default AddTerrariumScreen;
