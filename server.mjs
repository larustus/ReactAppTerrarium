import { WebSocketServer } from 'ws';
import fetch from 'node-fetch';

const PORT = 8082;
const USER_API_URL = 'http://212.47.71.180:8080/users';
const READING_API_URL = 'http://212.47.71.180:8080/readings/current/reading';

// Create a WebSocket server
const wss = new WebSocketServer({ port: PORT });

// Fetch user data to get terrarium IDs
const fetchUserTerrariums = async (userId) => {
    try {
        const response = await fetch(`${USER_API_URL}/${userId}`);
        if (!response.ok) throw new Error(`Failed to fetch user data: ${response.statusText}`);
        const user = await response.json();
        return user.terrariumData; // Returns an array of terrariums
    } catch (error) {
        console.error('Error fetching user data:', error.message);
        return [];
    }
};

// Fetch reading data for a specific terrarium ID
const fetchReadingData = async (terrariumId) => {
    try {
        const response = await fetch(`${READING_API_URL}/${terrariumId}`);
        if (!response.ok) throw new Error(`Failed to fetch reading for terrarium ${terrariumId}`);
        return await response.json();
    } catch (error) {
        console.error(`Error fetching reading for terrarium ${terrariumId}:`, error.message);
        return null;
    }
};

// Broadcast updated data to all clients
const broadcastToClients = (data) => {
    wss.clients.forEach((client) => {
        if (client.readyState === 1) {
            client.send(JSON.stringify(data));
        }
    });
};

// Start periodic updates
const startDataUpdates = async (userId) => {
    const terrariums = await fetchUserTerrariums(userId);

    setInterval(async () => {
        const readings = await Promise.all(
            terrariums.map(async (terrarium) => {
                const reading = await fetchReadingData(terrarium.id);
                return {
                    terrarium,
                    reading,
                };
            })
        );

        console.log('Broadcasting updated readings:', readings);
        broadcastToClients(readings);
    }, 10000); // Update every 10 seconds
};

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('New client connected');

    const userId = 1; // Replace with dynamic user_id if needed
    startDataUpdates(userId);

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log(`WebSocket server running on ws://192.168.0.236:${PORT}`);
