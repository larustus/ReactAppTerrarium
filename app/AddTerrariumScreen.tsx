import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Alert,
    FlatList,
    ImageBackground,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Keyboard,
    Switch,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

interface TerrariumDetails {
    name: string;
    temperature_goal: string;
    humidity_goal: string;
    max_temp: string;
    min_temp: string;
    max_hum: string;
    min_hum: string;
    water_time: Date | null;
    water_duration: string; // input as string, convert later if needed
    shouldWater: boolean;
}

interface PinSelection {
    thermometer: number | null;
    probe: number | null;
    hygrometer: number | null;
    heating: number | null;
    water: number | null;
}

interface PinOption {
    label: string;
    value: number;
}

const AddTerrariumScreen: React.FC = () => {
    const initialTerrariumDetails: TerrariumDetails = {
        name: '',
        temperature_goal: '',
        humidity_goal: '',
        max_temp: '',
        min_temp: '',
        max_hum: '',
        min_hum: '',
        water_time: null,
        water_duration: '',
        shouldWater: false,
    };

    const initialPins: PinSelection = {
        probe: null,
        thermometer: null,
        hygrometer: null,
        heating: null,
        water: null,
    };

    const [step, setStep] = useState(1);
    const [terrariumDetails, setTerrariumDetails] = useState<TerrariumDetails>(initialTerrariumDetails);
    const [userId] = useState(1);
    const [pins, setPins] = useState<PinSelection>(initialPins);

    // Date picker state
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

    // Dropdown options and open states for pin assignments
    const [thermometerOptions, setThermometerOptions] = useState<PinOption[]>([]);
    const [hygrometerOptions, setHygrometerOptions] = useState<PinOption[]>([]);
    const [heatingOptions, setHeatingOptions] = useState<PinOption[]>([]);
    const [waterOptions, setWaterOptions] = useState<PinOption[]>([]);
    const [probeOptions, setProbeOptions] = useState<PinOption[]>([]);

    const [thermometerDropdownOpen, setThermometerDropdownOpen] = useState(false);
    const [hygrometerDropdownOpen, setHygrometerDropdownOpen] = useState(false);
    const [heatingDropdownOpen, setHeatingDropdownOpen] = useState(false);
    const [waterDropdownOpen, setWaterDropdownOpen] = useState(false);
    const [probeDropdownOpen, setProbeDropdownOpen] = useState(false);

    const fetchPins = async (functionType: string, setOptions: React.Dispatch<React.SetStateAction<any[]>>) => {
        try {
            const response = await fetch(`http://212.47.71.180:8080/pins/${userId}/${functionType}`);
            if (!response.ok) {
                throw new Error('Failed to fetch pins');
            }
            const data = await response.json();
            setOptions(data.map((pin: any) => ({ label: `Pin ${pin.id}`, value: pin.id })));
        } catch (error) {
            Alert.alert('Error', `Failed to fetch pins for ${functionType}`);
        }
    };

    useEffect(() => {
        if (step === 3) {
            fetchPins('t1', setThermometerOptions);
            fetchPins('t2', setHygrometerOptions);
            fetchPins('pwm', setHeatingOptions);
            fetchPins('probe', setProbeOptions);
            if (terrariumDetails.shouldWater) {
                fetchPins('water', setWaterOptions);
            }
        }
    }, [step, terrariumDetails.shouldWater]);

    const updateTerrariumDetail = (field: keyof TerrariumDetails, value: any) => {
        setTerrariumDetails(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    // Helper to format Date to "HH:mm:ss"
    const formatTime = (date: Date): string => {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    // Helper to parse a locale float (handles comma as decimal separator)
    const parseLocaleFloat = (value: string): number => {
        return parseFloat(value.replace(',', '.'));
    };

    const handleConfirmTime = (date: Date) => {
        updateTerrariumDetail('water_time', date);
        setDatePickerVisibility(false);
    };

    const handleCancelTime = () => {
        setDatePickerVisibility(false);
    };

    const handleNext = () => {
        setStep(prev => prev + 1);
    };

    const handlePrevious = () => {
        setStep(prev => prev - 1);
    };

    // Final submission: Build DTOs and POST to backend endpoints.
    // After a successful submission and pin assignment, reset the form.
    const handleSubmit = async () => {
        // Build payload for /add endpoint according to TerrariumDisplayDTO
        const payload = {
            user_id: userId,
            name: terrariumDetails.name,
            temperature_goal: parseLocaleFloat(terrariumDetails.temperature_goal),
            humidity_goal: parseLocaleFloat(terrariumDetails.humidity_goal),
            max_temp: parseLocaleFloat(terrariumDetails.max_temp),
            min_temp: parseLocaleFloat(terrariumDetails.min_temp),
            max_hum: parseLocaleFloat(terrariumDetails.max_hum),
            min_hum: parseLocaleFloat(terrariumDetails.min_hum),
            water_time:
                terrariumDetails.shouldWater && terrariumDetails.water_time
                    ? formatTime(terrariumDetails.water_time)
                    : null,
            water_period: terrariumDetails.shouldWater
                ? parseInt(terrariumDetails.water_duration.replace(',', '.'))
                : null,
        };

        try {
            // POST to /add endpoint
            const response = await fetch('http://212.47.71.180:8080/terrariums/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            if (response.ok) {
                const responseText = await response.text();
                Alert.alert('Success', 'Terrarium created successfully!');
                // Extract terrarium ID from response text.
                // Assumes response text in the form "Terrarium saved with ID: X"
                const terrariumId = parseInt(responseText.split(':')[1].trim());

                // Build payload for /assign endpoint using the updated mapping
                const pinPayload = {
                    terrarium_id: terrariumId,
                    probe_pin: pins.probe,                 // New probe pin from step 3
                    t1_pin: pins.thermometer,              // Thermometer becomes t1
                    t2_pin: pins.hygrometer,               // Hygrometer becomes t2
                    pwm_pin: pins.heating,                 // Heating becomes pwm
                    water_pin: terrariumDetails.shouldWater ? pins.water : null,
                };

                // POST to /assign endpoint
                const assignResponse = await fetch('http://212.47.71.180:8080/pins/assign', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pinPayload),
                });
                if (!assignResponse.ok) {
                    const assignErrorText = await assignResponse.text();
                    Alert.alert('Error', 'Failed to assign pins: ' + assignErrorText);
                } else {
                    const assignResponseText = await assignResponse.text();
                    console.log('Pin assignment response:', assignResponseText);
                }

                // Reset form state after submission
                setTerrariumDetails(initialTerrariumDetails);
                setPins(initialPins);
                setStep(1);
            } else {
                const errorText = await response.text();
                Alert.alert('Error', 'Failed to create terrarium: ' + errorText);
            }
        } catch (error: any) {
            Alert.alert('Error', 'Failed to create terrarium: ' + error.message);
        }
    };


    // STEP 1: Basic details & watering options
    const renderStepOne = () => {
        const validateStepOne = () => {
            if (!terrariumDetails.name.trim()) {
                Alert.alert('Błąd', 'Należy wpisać nazwę terrarium');
                return false;
            }
            const tempGoal = parseLocaleFloat(terrariumDetails.temperature_goal);
            if (isNaN(tempGoal) || tempGoal < 10 || tempGoal > 90) {
                Alert.alert('Błąd', 'Temperatura musi być większa od 10°C i mniejsza niż 90°C');
                return false;
            }
            const humGoal = parseLocaleFloat(terrariumDetails.humidity_goal);
            if (isNaN(humGoal) || humGoal < 0 || humGoal > 100) {
                Alert.alert('Błąd', 'Wilgotność musi być większa od 0% i mniejsza niż 100%');
                return false;
            }
            if (terrariumDetails.shouldWater) {
                if (!terrariumDetails.water_time) {
                    Alert.alert('Błąd', 'Przy sterowanie wodą, należy podać godzinę startu');
                    return false;
                }
                if (!terrariumDetails.water_duration.trim()) {
                    Alert.alert('Błąd', 'Przy sterowaniu wodą należy podać czas trwania');
                    return false;
                }
            }
            return true;
        };

        return (
            <FlatList
                keyboardShouldPersistTaps="handled"
                data={[1]} // dummy data; form is rendered via ListHeaderComponent
                renderItem={() => null}
                ListHeaderComponent={
                    <View>
                        <View style={styles.formItem}>
                            <View style={styles.labelContainer}>
                                <Text style={styles.label}>Nazwa terrarium</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={terrariumDetails.name}
                                onChangeText={(value) => updateTerrariumDetail('name', value)}
                                placeholder="Wprowadź nazwę"
                            />
                        </View>
                        <View style={styles.formItem}>
                            <View style={styles.labelContainer}>
                                <Text style={styles.label}>Temperatura - cel</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={terrariumDetails.temperature_goal}
                                onChangeText={(value) => updateTerrariumDetail('temperature_goal', value)}
                                placeholder="Wprowadź temperaturę"
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.formItem}>
                            <View style={styles.labelContainer}>
                                <Text style={styles.label}>Wilgotność - cel</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={terrariumDetails.humidity_goal}
                                onChangeText={(value) => updateTerrariumDetail('humidity_goal', value)}
                                placeholder="Enter humidity goal"
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.formItem}>
                            <View style={styles.labelContainer}>
                                <Text style={styles.label}>Sterowanie wodą w terrarium?</Text>
                            </View>
                            <Switch
                                value={terrariumDetails.shouldWater}
                                onValueChange={(value) => updateTerrariumDetail('shouldWater', value)}
                            />
                        </View>
                        {terrariumDetails.shouldWater && (
                            <>
                                <View style={styles.formItem}>
                                    <View style={styles.labelContainer}>
                                        <Text style={styles.label}>Godzina dolewania wody</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setDatePickerVisibility(true)}
                                        style={styles.timePickerButton}
                                    >
                                        <Text style={styles.timePickerText}>
                                            {terrariumDetails.water_time
                                                ? terrariumDetails.water_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : 'Set Water Time'}
                                        </Text>
                                    </TouchableOpacity>
                                    <DateTimePickerModal
                                        isVisible={isDatePickerVisible}
                                        mode="time"
                                        onConfirm={handleConfirmTime}
                                        onCancel={handleCancelTime}
                                    />
                                </View>
                                <View style={styles.formItem}>
                                    <View style={styles.labelContainer}>
                                        <Text style={styles.label}>Czas trwania dolewania wody (sekundy)</Text>
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        value={terrariumDetails.water_duration}
                                        onChangeText={(value) => updateTerrariumDetail('water_duration', value)}
                                        placeholder="Enter water duration in minutes"
                                        keyboardType="numeric"
                                    />
                                </View>
                            </>
                        )}
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => {
                                if (validateStepOne()) handleNext();
                            }}
                        >
                            <Text style={styles.buttonText}>Dalej</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        );
    };

    // STEP 2: Temperature and humidity ranges
    const renderStepTwo = () => {
        const validateStepTwo = () => {
            if (!terrariumDetails.max_temp.trim()) {
                Alert.alert('Błąd', 'Trzeba podać maksymalną temperaturę');
                return false;
            }
            if (!terrariumDetails.min_temp.trim()) {
                Alert.alert('Błąd', 'Trzeba podać minimalną temperaturę');
                return false;
            }
            if (!terrariumDetails.max_hum.trim()) {
                Alert.alert('Błąd', 'Trzeba podać maksymalną wilgotność');
                return false;
            }
            if (!terrariumDetails.min_hum.trim()) {
                Alert.alert('Błąd', 'Trzeba podać minimalną wilgotność');
                return false;
            }

            const minTemp = parseLocaleFloat(terrariumDetails.min_temp);
            const maxTemp = parseLocaleFloat(terrariumDetails.max_temp);
            const tempGoal = parseLocaleFloat(terrariumDetails.temperature_goal);

            if (isNaN(minTemp) || minTemp <= 0 || minTemp >= tempGoal) {
                Alert.alert('Błąd', `Minimalna temperatura musi być większa niż 0 i mniejsza niż (${tempGoal}°C).`);
                return false;
            }
            if (isNaN(maxTemp) || maxTemp <= tempGoal || maxTemp >= 100) {
                Alert.alert('Błąd', `Maksymalna temperatura musi być większa niż (${tempGoal}°C) i mniejsza od 100°C.`);
                return false;
            }

            const minHum = parseLocaleFloat(terrariumDetails.min_hum);
            const maxHum = parseLocaleFloat(terrariumDetails.max_hum);
            const humGoal = parseLocaleFloat(terrariumDetails.humidity_goal);

            if (isNaN(minHum) || minHum <= 0 || minHum >= humGoal) {
                Alert.alert('Błąd', `Minimalna wilgotność musi być większa niż 0 i mniejsza niż (${humGoal}%).`);
                return false;
            }
            if (isNaN(maxHum) || maxHum <= humGoal || maxHum >= 100) {
                Alert.alert('Błąd', `Maksymalna wilgotność musi być większa niż (${humGoal}%) i mniejsza od 100%.`);
                return false;
            }

            return true;
        };

        return (
            <FlatList
                keyboardShouldPersistTaps="handled"
                data={['max_temp', 'min_temp', 'max_hum', 'min_hum']}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                    <View style={styles.formItem}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>{item.replace('_', ' ').toUpperCase()}</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            value={(terrariumDetails[item as keyof TerrariumDetails] as string) || ''}
                            onChangeText={(value) => updateTerrariumDetail(item as keyof TerrariumDetails, value)}
                            placeholder={`Enter ${item.replace('_', ' ')}`}
                            keyboardType="numeric"
                        />
                    </View>
                )}
                ListFooterComponent={
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.button} onPress={handlePrevious}>
                            <Text style={styles.buttonText}>Wstecz</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={() => { if (validateStepTwo()) handleNext(); }}>
                            <Text style={styles.buttonText}>Dalej</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        );
    };

    // STEP 3: Pin assignment
    const renderStepThree = () => {
        const validateStepThree = () => {
            if (!pins.probe) {
                Alert.alert('Błąd', 'Brak pinu termostatu.');
                return false;
            }
            if (!pins.thermometer) {
                Alert.alert('Błąd', 'Brak pinu termometru 1');
                return false;
            }
            if (!pins.hygrometer) {
                Alert.alert('Błąd', 'Brak pinu termometru 2');
                return false;
            }
            if (!pins.heating) {
                Alert.alert('Błąd', 'Brak pinu zasilania ogrzewania');
                return false;
            }
            if (terrariumDetails.shouldWater && !pins.water) {
                Alert.alert('Błąd', 'Brak pinu sterowania wodą');
                return false;
            }
            return true;
        };

        return (
            <View>
                <View style={styles.overlay} />
                <View style={styles.titleContainer}>
                    <Text style={styles.titleText}>Przypisanie pinów</Text>
                </View>

                {/* Probe Pin */}
                <View style={styles.formItem}>
                    <View style={styles.labelContainer}>
                        <Text style={styles.label}>Pin termostatu</Text>
                    </View>
                    <DropDownPicker
                        open={probeDropdownOpen}
                        value={pins.probe}
                        items={probeOptions}
                        setOpen={setProbeDropdownOpen}
                        setValue={(callback) =>
                            setPins(prev => ({
                                ...prev,
                                probe: callback(prev.probe),
                            }))
                        }
                        placeholder="Wybierz pin termostatu"
                        style={styles.dropdown}
                        dropDownContainerStyle={styles.dropdownContainer}
                        zIndex={1100}
                    />
                </View>

                {/* Thermometer Pin */}
                <View style={styles.formItem}>
                    <View style={styles.labelContainer}>
                        <Text style={styles.label}>Pin termometru 1</Text>
                    </View>
                    <DropDownPicker
                        open={thermometerDropdownOpen}
                        value={pins.thermometer}
                        items={thermometerOptions}
                        setOpen={setThermometerDropdownOpen}
                        setValue={(callback) =>
                            setPins(prev => ({
                                ...prev,
                                thermometer: callback(prev.thermometer),
                            }))
                        }
                        placeholder="Wybierz pin termometru 1"
                        style={styles.dropdown}
                        dropDownContainerStyle={styles.dropdownContainer}
                        zIndex={1000}
                    />
                </View>

                {/* Hygrometer Pin */}
                <View style={styles.formItem}>
                    <View style={styles.labelContainer}>
                        <Text style={styles.label}>Pin termometru 2</Text>
                    </View>
                    <DropDownPicker
                        open={hygrometerDropdownOpen}
                        value={pins.hygrometer}
                        items={hygrometerOptions}
                        setOpen={setHygrometerDropdownOpen}
                        setValue={(callback) =>
                            setPins(prev => ({
                                ...prev,
                                hygrometer: callback(prev.hygrometer),
                            }))
                        }
                        placeholder="Wybierz pin termometru 2"
                        style={styles.dropdown}
                        dropDownContainerStyle={styles.dropdownContainer}
                        zIndex={900}
                    />
                </View>

                {/* Heating Pin */}
                <View style={styles.formItem}>
                    <View style={styles.labelContainer}>
                        <Text style={styles.label}>Pin ogrzewania</Text>
                    </View>
                    <DropDownPicker
                        open={heatingDropdownOpen}
                        value={pins.heating}
                        items={heatingOptions}
                        setOpen={setHeatingDropdownOpen}
                        setValue={(callback) =>
                            setPins(prev => ({
                                ...prev,
                                heating: callback(prev.heating),
                            }))
                        }
                        placeholder="Wybierz pin ogrzewania"
                        style={styles.dropdown}
                        dropDownContainerStyle={styles.dropdownContainer}
                        zIndex={800}
                    />
                </View>

                {/* Water Pin (if watering is enabled) */}
                {terrariumDetails.shouldWater && (
                    <View style={styles.formItem}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>Pin sterowania wodą</Text>
                        </View>
                        <DropDownPicker
                            open={waterDropdownOpen}
                            value={pins.water}
                            items={waterOptions}
                            setOpen={setWaterDropdownOpen}
                            setValue={(callback) =>
                                setPins(prev => ({
                                    ...prev,
                                    water: callback(prev.water),
                                }))
                            }
                            placeholder="Wybierz pin sterowania wodą"
                            style={styles.dropdown}
                            dropDownContainerStyle={styles.dropdownContainer}
                            zIndex={700}
                        />
                    </View>
                )}

                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.button} onPress={handlePrevious}>
                        <Text style={styles.buttonText}>Wstecz</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => {
                            if (validateStepThree()) handleSubmit();
                        }}
                    >
                        <Text style={styles.buttonText}>Dodaj</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };


    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ImageBackground
                source={require('../app/app_tabs/backround_image.jpg')}
                style={styles.background}
                resizeMode="cover"
            >
                <View style={styles.overlay} />
                <View style={styles.container}>
                    {step === 1 && renderStepOne()}
                    {step === 2 && renderStepTwo()}
                    {step === 3 && renderStepThree()}
                </View>
            </ImageBackground>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    background: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.3)' },
    container: { flex: 1, padding: 20 },
    formItem: { marginBottom: 20 },
    labelContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 5,
        borderRadius: 5,
        alignSelf: 'flex-start',
        marginBottom: 5,
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
    label: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, backgroundColor: '#fff' },
    dropdown: { marginVertical: 10 },
    dropdownContainer: { backgroundColor: '#fff' },
    timePickerButton: { backgroundColor: '#fff', padding: 10 },
    timePickerText: { color: '#333' },
    button: { backgroundColor: '#4CAF50', padding: 10, borderRadius: 5, marginVertical: 10 },
    buttonText: { fontWeight: 'bold', textAlign: 'center', color: '#fff' },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
});

export default AddTerrariumScreen;
