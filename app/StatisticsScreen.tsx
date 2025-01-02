import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Dimensions, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { BarChart } from 'react-native-chart-kit';

interface TerrariumData {
    id: number;
    name: string;
}

interface DailyAverage {
    temperature_1: number;
    temperature_2: number;
    humidity: number;
    count: number;
}

const StatisticsScreen: React.FC = () => {
    const [terrariums, setTerrariums] = useState<TerrariumData[]>([]);
    const [selectedTerrarium, setSelectedTerrarium] = useState<number | null>(null);
    const [selectedMetric, setSelectedMetric] = useState<keyof DailyAverage>('temperature_1');
    const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
    const [dailyAverages, setDailyAverages] = useState<Record<string, DailyAverage>>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTerrariums = async () => {
            try {
                const response = await fetch('http://212.47.71.180:8080/terrariums/user/1');
                if (!response.ok) throw new Error('Failed to fetch terrariums');
                const data: TerrariumData[] = await response.json();
                setTerrariums(data);
            } catch (err: any) {
                setError(err.message);
            }
        };

        fetchTerrariums();
    }, []);

    const getWeekRange = (date: Date) => {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(0, 0, 0, 0);

        const formatDate = (d: Date) =>
            `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d
                .getDate()
                .toString()
                .padStart(2, '0')}`;

        return {
            start: formatDate(startOfWeek),
            end: formatDate(endOfWeek),
            days: Array.from({ length: 7 }).map((_, i) => {
                const day = new Date(startOfWeek);
                day.setDate(startOfWeek.getDate() + i);
                return formatDate(day);
            }),
        };
    };

    const fetchReadingsForWeek = async () => {
        if (!selectedTerrarium) return;

        setLoading(true);
        setError(null);

        const { days } = getWeekRange(currentWeek);
        const dailyData: Record<string, DailyAverage> = {};

        try {
            for (const day of days) {
                const response = await fetch(
                    `http://212.47.71.180:8080/readings/day/${day}/terrarium/${selectedTerrarium}`
                );
                if (!response.ok) continue;

                const readings: any[] = await response.json();

                const dailyAverage = readings.reduce(
                    (acc, reading) => {
                        acc.temperature_1 += reading.temperature_1;
                        acc.temperature_2 += reading.temperature_2;
                        acc.humidity += reading.humidity;
                        acc.count += 1;
                        return acc;
                    },
                    { temperature_1: 0, temperature_2: 0, humidity: 0, count: 0 }
                );

                dailyData[day] = dailyAverage;
            }

            setDailyAverages(
                Object.fromEntries(
                    Object.entries(dailyData).map(([day, data]) => [
                        day,
                        {
                            temperature_1:
                                data.count > 0 ? data.temperature_1 / data.count : 0,
                            temperature_2:
                                data.count > 0 ? data.temperature_2 / data.count : 0,
                            humidity: data.count > 0 ? data.humidity / data.count : 0,
                            count: data.count,
                        },
                    ])
                )
            );
        } catch (err: any) {
            setError('Failed to fetch readings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedTerrarium) fetchReadingsForWeek();
    }, [selectedTerrarium, currentWeek]);

    const handlePreviousWeek = () => {
        const previousWeek = new Date(currentWeek);
        previousWeek.setDate(currentWeek.getDate() - 7);
        setCurrentWeek(previousWeek);
    };

    const handleNextWeek = () => {
        const nextWeek = new Date(currentWeek);
        nextWeek.setDate(currentWeek.getDate() + 7);
        if (nextWeek > new Date()) return;
        setCurrentWeek(nextWeek);
    };

    const { start, end, days } = getWeekRange(currentWeek);

    const getMetricColor = () => {
        if (selectedMetric === 'temperature_1') return '#ffa726'; // Orange
        if (selectedMetric === 'temperature_2') return '#ffeb3b'; // Yellow
        return '#42a5f5'; // Blue for humidity
    };

    const chartValues = days.map((day) => dailyAverages[day]?.[selectedMetric] ?? 0);
    const maxValue = Math.max(...chartValues);
    const adjustedValues = chartValues.map((value) => Math.max(value, 0)); // Ensure all values start at 0

    const chartData = {
        labels: ["S", "M", "T", "W", "T", "F", "S"], // Shortened day names
        datasets: [
            {
                data: adjustedValues,
            },
        ],
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Statistics</Text>

            {/* Terrarium Dropdown */}
            <Picker
                selectedValue={selectedTerrarium}
                onValueChange={(itemValue) => setSelectedTerrarium(itemValue)}
                style={styles.picker}
            >
                <Picker.Item label="Select a Terrarium" value={null} />
                {terrariums.map((terrarium) => (
                    <Picker.Item
                        key={terrarium.id}
                        label={terrarium.name}
                        value={terrarium.id}
                    />
                ))}
            </Picker>

            {/* Metric Dropdown */}
            <Picker
                selectedValue={selectedMetric}
                onValueChange={(itemValue) => setSelectedMetric(itemValue)}
                style={styles.picker}
            >
                <Picker.Item label="Temperature 1" value="temperature_1" />
                <Picker.Item label="Temperature 2" value="temperature_2" />
                <Picker.Item label="Humidity" value="humidity" />
            </Picker>

            {/* Week Range Display */}
            <Text style={styles.weekText}>
                Week Range: {start} - {end}
            </Text>

            {/* Navigation Buttons */}
            <View style={styles.buttonContainer}>
                <Button title="Previous Week" onPress={handlePreviousWeek} />
                <Button title="Next Week" onPress={handleNextWeek} />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <BarChart
                    data={chartData}
                    width={Dimensions.get("window").width - 20}
                    height={300}
                    yAxisLabel=""
                    yAxisSuffix={selectedMetric === 'humidity' ? '%' : '°C'}
                    chartConfig={{
                        backgroundColor: "#f8f8f8",
                        backgroundGradientFrom: "#ffffff",
                        backgroundGradientTo: "#e0e0e0",
                        decimalPlaces: 1,
                        color: () => getMetricColor(),
                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        style: {
                            borderRadius: 16,
                        },
                    }}
                    style={{
                        marginVertical: 8,
                        borderRadius: 16,
                    }}
                    fromZero={true} // Ensure bars always start at 0
                />
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 20,
    },
    picker: {
        height: 50,
        width: 250,
        marginVertical: 10,
    },
    weekText: {
        fontSize: 16,
        fontWeight: "bold",
        marginVertical: 20,
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "80%",
        marginTop: 20,
    },
    errorText: {
        fontSize: 16,
        color: "red",
    },
});

export default StatisticsScreen;
