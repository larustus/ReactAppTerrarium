import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    Platform,
    Alert, // Import Alert from react-native
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const SimpleFormScreen = () => {
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        date: null as string | null,
        time: null as string | null, // Time in HH:mm:ss format or null
    });

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false); // Tracks form validity

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const formattedDate = selectedDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            setFormData({ ...formData, date: formattedDate });
        }
    };

    const handleTimeChange = (event: any, selectedTime?: Date) => {
        setShowTimePicker(false);
        if (selectedTime) {
            const hours = selectedTime.getHours().toString().padStart(2, '0');
            const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
            const formattedTime = `${hours}:${minutes}:00`; // Format as HH:mm:ss
            setFormData({ ...formData, time: formattedTime });
        } else {
            setFormData({ ...formData, time: null }); // Set to null if no time selected
        }
    };

    const validateForm = () => {
        const age = parseInt(formData.age, 10);

        // Form is valid if age is above 12
        if (!isNaN(age) && age > 12) {
            setIsFormValid(true);
        } else {
            setIsFormValid(false);
        }
    };

    const handleAgeChange = (text: string) => {
        setFormData({ ...formData, age: text });
        validateForm(); // Validate the form after the age changes
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Simple Form</Text>

            <TextInput
                style={styles.input}
                placeholder="Name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            <TextInput
                style={styles.input}
                placeholder="Age (must be above 12)"
                value={formData.age}
                keyboardType="numeric"
                onChangeText={handleAgeChange} // Custom handler for validation
            />

            <View style={styles.datePickerContainer}>
                <Text>Date: {formData.date || 'No date selected'}</Text>
                <Button title="Pick a Date" onPress={() => setShowDatePicker(true)} />
            </View>

            {showDatePicker && (
                <DateTimePicker
                    value={new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                />
            )}

            <View style={styles.timePickerContainer}>
                <Text>Time: {formData.time || 'No time selected'}</Text>
                <Button title="Pick a Time" onPress={() => setShowTimePicker(true)} />
            </View>

            {showTimePicker && (
                <DateTimePicker
                    value={new Date()}
                    mode="time"
                    is24Hour={true}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleTimeChange}
                />
            )}

            <Button
                title="Submit"
                onPress={() => {
                    console.log('Form Data:', formData);
                    Alert.alert('Success', 'Form submitted successfully!');
                }}
                disabled={!isFormValid} // Disable button if form is invalid
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        backgroundColor: '#f8f8f8',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 15,
        borderRadius: 5,
        backgroundColor: '#fff',
    },
    datePickerContainer: {
        marginBottom: 20,
    },
    timePickerContainer: {
        marginBottom: 20,
    },
});

export default SimpleFormScreen;
