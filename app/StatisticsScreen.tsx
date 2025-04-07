import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    Button,
    Dimensions,
    ActivityIndicator,
    FlatList,
    ImageBackground,
    ScrollView,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { BarChart } from "react-native-chart-kit";
//import DateTimePicker from '@react-native-community/datetimepicker';
import { TouchableOpacity, Platform } from 'react-native';



interface TerrariumData {
    id: number;
    name: string;
}

interface HourlyReading {
    temperature1: number;
    temperature2: number;
    humidity: number;
    hour: number;
}

const StatisticsScreen: React.FC = () => {
    const [terrariums, setTerrariums] = useState<TerrariumData[]>([]);
    const [selectedTerrarium, setSelectedTerrarium] = useState<number | null>(null);
    const [selectedMetric, setSelectedMetric] = useState<keyof HourlyReading>("temperature1");
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split("T")[0]
    );
    const [hourlyReadings, setHourlyReadings] = useState<HourlyReading[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Dropdown states
    const [terrariumDropdownOpen, setTerrariumDropdownOpen] = useState(false);
    const [metricDropdownOpen, setMetricDropdownOpen] = useState(false);

    //const [showDatePicker, setShowDatePicker] = useState(false);


    useEffect(() => {
        const fetchTerrariums = async () => {
            try {
                const response = await fetch("http://212.47.71.180:8080/terrariums/user/1");
                if (!response.ok) throw new Error("Failed to fetch terrariums");
                const data: TerrariumData[] = await response.json();
                setTerrariums(data);
            } catch (err: any) {
                setError(err.message);
            }
        };

        fetchTerrariums();
    }, []);

    const fetchReadingsForDay = async () => {
        if (!selectedTerrarium) return;
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `http://212.47.71.180:8080/readings/day/${selectedDate}/terrarium/${selectedTerrarium}`
            );
            if (!response.ok) throw new Error("Failed to fetch readings");

            const data = await response.json();
            setHourlyReadings(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const changeDate = (days: number) => {
        const current = new Date(selectedDate);
        current.setDate(current.getDate() + days);
        const formatted = current.toISOString().split("T")[0];
        setSelectedDate(formatted);
    };



    useEffect(() => {
        if (selectedTerrarium) fetchReadingsForDay();
    }, [selectedTerrarium, selectedDate]);

    const getMetricColor = () => {
        if (selectedMetric === "temperature1") return "#9c27b0"; // Purple
        if (selectedMetric === "temperature2") return "#f44336"; // Red
        return "#42a5f5"; // Blue for humidity
    };

    const chartData = {
        labels: Array.from({ length: 24 }, (_, i) =>
            [0, 6, 12, 18].includes(i) ? i.toString().padStart(2, "0") : ""
        ),
        datasets: [
            {
                data: hourlyReadings.map((reading) => reading[selectedMetric] ?? 0),
            },
        ],
    };

    return (
        <ImageBackground
            source={require("../app/app_tabs/backround_image.jpg")}
            style={styles.background}
            resizeMode="cover"
        >
            <View style={styles.overlay} />
            <View style={styles.titleContainer}>
                <Text style={styles.titleText}>Statystyki</Text>
            </View>
            <FlatList
                data={[]}
                renderItem={null}
                ListHeaderComponent={
                    <View style={styles.container}>


                        {/* Terrarium Dropdown */}
                        <DropDownPicker
                            open={terrariumDropdownOpen}
                            value={selectedTerrarium}
                            items={terrariums.map((terrarium) => ({
                                label: terrarium.name,
                                value: terrarium.id,
                            }))}
                            setOpen={setTerrariumDropdownOpen}
                            onOpen={() => setMetricDropdownOpen(false)}
                            setValue={setSelectedTerrarium}
                            placeholder="Wybierz terrarium"
                            style={styles.dropdown}
                            dropDownContainerStyle={styles.dropdownContainer}
                            zIndex={terrariumDropdownOpen ? 1000 : 1}
                        />

                        {/* Metric Dropdown */}
                        <DropDownPicker
                            open={metricDropdownOpen}
                            value={selectedMetric}
                            items={[
                                { label: "Temperatura 1", value: "temperature1" },
                                { label: "Temperatura 2", value: "temperature2" },
                                { label: "Wilgotność", value: "humidity" },
                            ]}
                            setOpen={setMetricDropdownOpen}
                            onOpen={() => setTerrariumDropdownOpen(false)}
                            setValue={setSelectedMetric}
                            placeholder="Select Metric"
                            style={styles.dropdown}
                            dropDownContainerStyle={styles.dropdownContainer}
                            zIndex={metricDropdownOpen ? 1000 : 1}
                        />

                        {/* Date */}
                        <View style={styles.dateSelector}>
                            <TouchableOpacity onPress={() => changeDate(-1)} style={styles.arrowButton}>
                                <Text style={styles.arrowText}>{'<'}</Text>
                            </TouchableOpacity>

                            <View style={styles.dateDisplay}>
                                <Text style={styles.dateText}>{selectedDate}</Text>
                            </View>

                            <TouchableOpacity onPress={() => changeDate(1)} style={styles.arrowButton}>
                                <Text style={styles.arrowText}>{'>'}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Chart */}
                        {loading ? (
                            <ActivityIndicator size="large" color="#0000ff" />
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <BarChart
                                    data={chartData}
                                    width={Dimensions.get("window").width * 2}
                                    height={300}
                                    yAxisLabel=""
                                    yAxisSuffix={selectedMetric === "humidity" ? "%" : "°C"}
                                    chartConfig={{
                                        backgroundColor: "#f8f8f8",
                                        backgroundGradientFrom: "#ffffff",
                                        backgroundGradientTo: "#e0e0e0",
                                        decimalPlaces: 1,
                                        barPercentage: 0.3,
                                        color: () => getMetricColor(),
                                        labelColor: (opacity = 1) =>
                                            `rgba(0, 0, 0, ${opacity})`,
                                        style: {
                                            borderRadius: 16,
                                        },
                                    }}
                                    style={{
                                        marginVertical: 8,
                                        borderRadius: 16,
                                        alignSelf: "center",
                                    }}
                                    fromZero={true}
                                />
                            </ScrollView>
                        )}

                        {error && <Text style={styles.errorText}>{error}</Text>}
                    </View>
                }
            />
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255, 255, 255, 0.3)",
    },
    container: {
        padding: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 20,
    },
    dropdown: {
        marginVertical: 10,
        backgroundColor: "#fff",
        borderColor: "#ccc",
        borderRadius: 5,
    },
    dropdownContainer: {
        backgroundColor: "#fff",
        borderColor: "#ccc",
    },
    errorText: {
        fontSize: 16,
        color: "red",
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
    weekRangeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 10,
        marginVertical: 10,
    },
    weekText: {
        fontSize: 16,
        fontWeight: "bold",
        marginHorizontal: 10,
    },
    arrow: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        paddingHorizontal: 10,
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 15,
    },

    arrowButton: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
        borderColor: '#4CAF50',
        borderWidth: 1,
        marginHorizontal: 10,
        elevation: 2,
    },

    arrowText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4CAF50',
    },

    dateDisplay: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        borderColor: '#ccc',
        borderWidth: 1,
        elevation: 2,
    },

    dateText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },


});

export default StatisticsScreen;
