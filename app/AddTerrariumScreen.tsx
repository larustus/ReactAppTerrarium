import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    Alert,
    FlatList,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
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
}

interface PinSelection {
    thermometer: number | null;
    hygrometer: number | null;
    heating: number | null;
    water: number | null; // Optional
}

interface PinOption {
    label: string;
    value: number;
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
    });
    const [userId] = useState(1); // Assuming user ID is 1
    const [pins, setPins] = useState<PinSelection>({
        thermometer: null,
        hygrometer: null,
        heating: null,
        water: null,
    });
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

    // Dropdown open states for pins
    const [thermometerOptions, setThermometerOptions] = useState<PinOption[]>([]);
    const [hygrometerOptions, setHygrometerOptions] = useState<PinOption[]>([]);
    const [heatingOptions, setHeatingOptions] = useState<PinOption[]>([]);
    const [waterOptions, setWaterOptions] = useState<PinOption[]>([]);

    // Dropdown open states for pins
    const [thermometerDropdownOpen, setThermometerDropdownOpen] = useState(false);
    const [hygrometerDropdownOpen, setHygrometerDropdownOpen] = useState(false);
    const [heatingDropdownOpen, setHeatingDropdownOpen] = useState(false);
    const [waterDropdownOpen, setWaterDropdownOpen] = useState(false);

    const formItems = [
        'name',
        'type',
        'temperature_goal',
        'humidity_goal',
        'max_temp',
        'min_temp',
        'max_hum',
        'min_hum',
        'water_time',
        'water_period',
    ];

    const fetchPins = async (functionType: string, setOptions: React.Dispatch<React.SetStateAction<any[]>>) => {
        try {
            const response = await fetch(
                `http://212.47.71.180:8080/pins/${userId}/${functionType}`
            );
            if (!response.ok) {
                throw new Error('Failed to fetch pins');
            }
            const data = await response.json();
            setOptions(data.map((pin: any) => ({ label: `Pin ${pin.id}`, value: pin.id })));
        } catch (error) {
            if (error instanceof Error) {
                console.error(error.message);
                Alert.alert('Error', `Failed to fetch pins for ${functionType}: ${error.message}`);
            } else {
                console.error('Unknown error occurred:', error);
                Alert.alert('Error', `Failed to fetch pins for ${functionType}: Unknown error`);
            }
        }
    };



    useEffect(() => {
        if (step === 2) {
            // Fetch available pins for each function when on Page 2
            fetchPins('t1', setThermometerOptions);
            fetchPins('t2', setHygrometerOptions);
            fetchPins('pwm', setHeatingOptions);
            if (terrariumDetails.type === 'lamp_mist') fetchPins('water', setWaterOptions);
        }
    }, [step, terrariumDetails.type]);

    // Update terrarium details dynamically
    const updateTerrariumDetail = (field: keyof TerrariumDetails, value: any) => {
        setTerrariumDetails((prev) => ({
            ...prev,
            [field]: value,
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

    const renderFormItem = ({ item }: { item: string }) => {
        switch (item) {
            case 'name':
            case 'temperature_goal':
            case 'humidity_goal':
            case 'max_temp':
            case 'min_temp':
            case 'max_hum':
            case 'min_hum':
                return (
                    <View style={styles.formItem}>
                        <Text style={styles.label}>{item.replace('_', ' ').toUpperCase()}</Text>
                        <TextInput
                            style={styles.input}
                            value={(terrariumDetails[item as keyof TerrariumDetails] as string) || ''}
                            onChangeText={(value) =>
                                updateTerrariumDetail(item as keyof TerrariumDetails, value)
                            }
                            placeholder={`Enter ${item.replace('_', ' ')}`}
                            keyboardType={
                                item.includes('temp') || item.includes('hum') ? 'numeric' : 'default'
                            }
                        />
                    </View>
                );
            case 'type':
                return (
                    <View style={styles.formItem}>
                        <Text style={styles.label}>Type</Text>
                        <DropDownPicker
                            open={typeDropdownOpen}
                            value={terrariumDetails.type}
                            items={[
                                { label: 'Lamp', value: 'lamp' },
                                { label: 'Mat', value: 'mat' },
                                { label: 'Lamp with Mist', value: 'lamp_mist' },
                            ]}
                            setOpen={setTypeDropdownOpen}
                            setValue={(callback) => {
                                const selectedValue = callback(terrariumDetails.type);
                                updateTerrariumDetail('type', selectedValue);

                                // Reset water-related fields if type changes to non-lamp_mist
                                if (selectedValue !== 'lamp_mist') {
                                    updateTerrariumDetail('water_time', null);
                                    updateTerrariumDetail('water_period', '');
                                }
                            }}
                            placeholder="Select Type"
                            style={styles.dropdown}
                            dropDownContainerStyle={styles.dropdownContainer}
                            zIndex={typeDropdownOpen ? 1000 : 1}
                        />
                    </View>
                );
            case 'water_time':
                return (
                    terrariumDetails.type === 'lamp_mist' && (
                        <View style={styles.formItem}>
                            <Text style={styles.label}>Water Time (Optional)</Text>
                            {terrariumDetails.water_time && (
                                <Text style={styles.timeText}>
                                    Selected Time:{' '}
                                    {terrariumDetails.water_time
                                        ?.toTimeString()
                                        .slice(0, 5) || ''}
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
                        </View>
                    )
                );
            case 'water_period':
                return (
                    terrariumDetails.type === 'lamp_mist' && (
                        <View style={styles.formItem}>
                            <Text style={styles.label}>Water Period (Optional, seconds)</Text>
                            <TextInput
                                style={styles.input}
                                value={terrariumDetails.water_period || ''}
                                onChangeText={(value) =>
                                    updateTerrariumDetail('water_period', value)
                                }
                                placeholder="Enter water period"
                                keyboardType="numeric"
                            />
                        </View>
                    )
                );
            default:
                return null; // Ensure no crash for unsupported items
        }
    };


    return (
        <View style={styles.container}>
            {step === 1 && (
                <FlatList
                    data={formItems}
                    keyExtractor={(item) => item}
                    renderItem={(item) => renderFormItem(item) || null}
                    ListFooterComponent={<Button title="Next" onPress={handleNext} />}
                />
            )}
            {step === 2 && (
                <View>
                    <Text style={styles.title}>Assign Pins - Step 2</Text>

                    {/* Thermometer Pin Dropdown */}
                    <Text style={styles.label}>Thermometer Pin</Text>
                    <DropDownPicker
                        open={thermometerDropdownOpen}
                        value={pins.thermometer}
                        items={thermometerOptions}
                        setOpen={setThermometerDropdownOpen}
                        setValue={(callback) =>
                            setPins((prev) => ({
                                ...prev,
                                thermometer: callback(prev.thermometer),
                            }))
                        }
                        placeholder="Select Thermometer Pin"
                        style={styles.dropdown}
                        dropDownContainerStyle={styles.dropdownContainer}
                        zIndex={1000}
                    />

                    {/* Hygrometer Pin Dropdown */}
                    <Text style={styles.label}>Hygrometer Pin</Text>
                    <DropDownPicker
                        open={hygrometerDropdownOpen}
                        value={pins.hygrometer}
                        items={hygrometerOptions}
                        setOpen={setHygrometerDropdownOpen}
                        setValue={(callback) =>
                            setPins((prev) => ({
                                ...prev,
                                hygrometer: callback(prev.hygrometer),
                            }))
                        }
                        placeholder="Select Hygrometer Pin"
                        style={styles.dropdown}
                        dropDownContainerStyle={styles.dropdownContainer}
                        zIndex={900}
                    />

                    {/* Heating Pin Dropdown */}
                    <Text style={styles.label}>Heating Pin</Text>
                    <DropDownPicker
                        open={heatingDropdownOpen}
                        value={pins.heating}
                        items={heatingOptions}
                        setOpen={setHeatingDropdownOpen}
                        setValue={(callback) =>
                            setPins((prev) => ({
                                ...prev,
                                heating: callback(prev.heating),
                            }))
                        }
                        placeholder="Select Heating Pin"
                        style={styles.dropdown}
                        dropDownContainerStyle={styles.dropdownContainer}
                        zIndex={800}
                    />

                    {/* Optional Water Pin Dropdown */}
                    {terrariumDetails.type === 'lamp_mist' && (
                        <>
                            <Text style={styles.label}>Water Pin</Text>
                            <DropDownPicker
                                open={waterDropdownOpen}
                                value={pins.water} // Ensure this is of type number | null
                                items={waterOptions}
                                setOpen={setWaterDropdownOpen}
                                setValue={(callback) =>
                                    setPins((prev) => ({
                                        ...prev,
                                        water: callback(prev.water), // Correctly apply the callback to maintain type compatibility
                                    }))
                                }
                                placeholder="Select Water Pin"
                                style={styles.dropdown}
                                dropDownContainerStyle={styles.dropdownContainer}
                                zIndex={700}
                            />

                        </>
                    )}

                    {/* Navigation Buttons */}
                    <View style={styles.buttonRow}>
                        <Button title="Previous" onPress={handlePrevious} />
                        <Button title="Submit" onPress={handleSubmit} />
                    </View>
                </View>
            )}

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    formItem: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        fontSize: 16,
    },
    dropdown: {
        marginVertical: 10,
        backgroundColor: '#fff',
        borderColor: '#ccc',
        borderRadius: 5,
    },
    dropdownContainer: {
        backgroundColor: '#fff',
        borderColor: '#ccc',
    },
    timeText: {
        fontSize: 14,
        marginBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
});

export default AddTerrariumScreen;
