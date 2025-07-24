const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const port = 3001;

// --- Vehicle & Trip State ---
let activeTrip = null; 
let tripDataPoints = [];

let currentLatitude = 12.9716;
let currentLongitude = 77.5946;

const vehicleStatus = {
  vehicleId: 'vehicle-1-demo',
  location: { latitude: currentLatitude, longitude: currentLongitude, speed: 0, heading: 0, timestamp: new Date() },
  ignitionOn: false,
  isMoving: false,
  lastUpdate: new Date(),
};

// --- Vehicle Simulation ---
function updateVehicleLocation() {
  const isMoving = vehicleStatus.ignitionOn;
  if (isMoving) {
      currentLatitude += (Math.random() - 0.5) * 0.0005;
      currentLongitude += (Math.random() - 0.5) * 0.0005;
  }
  
  const currentSpeed = isMoving ? Math.round(Math.random() * 60 + 20) : 0;
  if(isMoving) tripDataPoints.push(currentSpeed);

  vehicleStatus.location = {
    latitude: currentLatitude,
    longitude: currentLongitude,
    speed: currentSpeed,
    heading: Math.round(Math.random() * 360),
    timestamp: new Date(),
  };
  vehicleStatus.isMoving = isMoving;
  vehicleStatus.lastUpdate = new Date();
  
  io.emit('vehicleUpdate', vehicleStatus);
}

// Middleware
app.use(cors());
app.use(express.json());

// Socket.IO Connections
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.emit('vehicleUpdate', vehicleStatus);
});

// API Routes
app.post('/toggle-ignition', (req, res) => {
    vehicleStatus.ignitionOn = !vehicleStatus.ignitionOn;
    const now = new Date();

    if (vehicleStatus.ignitionOn) {
        activeTrip = {
            id: `trip-${Date.now()}`,
            startTime: now,
            startLat: vehicleStatus.location.latitude,
            startLon: vehicleStatus.location.longitude,
        };
        tripDataPoints = [];
        console.log("Trip started:", activeTrip.id);

    } else {
        if (activeTrip) {
            const endTime = new Date();
            const duration = Math.round((endTime.getTime() - activeTrip.startTime.getTime()) / 60000);
            
            const R = 6371;
            const dLat = (vehicleStatus.location.latitude - activeTrip.startLat) * Math.PI / 180;
            const dLon = (vehicleStatus.location.longitude - activeTrip.startLon) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(activeTrip.startLat * Math.PI / 180) * Math.cos(vehicleStatus.location.latitude * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c;

            const maxSpeed = tripDataPoints.length ? Math.max(...tripDataPoints) : 0;
            const avgSpeed = tripDataPoints.length ? tripDataPoints.reduce((a, b) => a + b, 0) / tripDataPoints.length : 0;
            
            const sql = `INSERT INTO trips (id, vehicleId, startTime, endTime, startLat, startLon, endLat, endLon, distance, duration, maxSpeed, avgSpeed, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const params = [
                activeTrip.id, vehicleStatus.vehicleId, activeTrip.startTime.toISOString(), endTime.toISOString(),
                activeTrip.startLat, activeTrip.startLon, vehicleStatus.location.latitude, vehicleStatus.location.longitude,
                distance.toFixed(2), duration, Math.round(maxSpeed), Math.round(avgSpeed), 'completed'
            ];

            db.run(sql, params, (err) => {
                if (err) console.error("Error saving trip:", err.message);
                else console.log("Trip ended and saved:", activeTrip.id);
            });
            activeTrip = null;
        }
    }
    io.emit('vehicleUpdate', vehicleStatus);
    res.json({ message: `Ignition is now ${vehicleStatus.ignitionOn ? 'ON' : 'OFF'}` });
});

app.get('/trips', (req, res) => {
    db.all(`SELECT * FROM trips WHERE status = 'completed' ORDER BY startTime DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });
  const sql = `INSERT INTO users (id, username, password) VALUES (?, ?, ?)`;
  db.run(sql, [`user-${Date.now()}`, username, password], function(err) {
    if (err) {
        if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Username already exists.' });
        return res.status(400).json({ error: err.message });
    }
    res.json({ message: 'User registered successfully!' });
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });
  const sql = `SELECT * FROM users WHERE username = ? AND password = ?`;
  db.get(sql, [username, password], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) {
      const { password, ...userData } = row;
      return res.json({ message: 'Login successful!', user: userData });
    }
    res.status(401).json({ error: 'Invalid username or password' });
  });
});

// --- Database and Server Initialization ---
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error("Fatal DB Connection Error:", err.message);
        process.exit(1);
    }
    console.log('Connected to the SQLite database.');
    
    // This is the corrected CREATE TABLE statement
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE, password TEXT);
        CREATE TABLE IF NOT EXISTS trips (
            id TEXT PRIMARY KEY, vehicleId TEXT, startTime TEXT, endTime TEXT, 
            startLat REAL, startLon REAL, endLat REAL, endLon REAL, 
            distance REAL, duration INTEGER, maxSpeed INTEGER, avgSpeed INTEGER, 
            status TEXT
        );
    `, (err) => {
        if (err) {
            console.error("Error creating tables:", err.message);
            process.exit(1);
        }
        console.log("Database tables are ready.");

        server.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
            setInterval(updateVehicleLocation, 3000);
            console.log("Vehicle simulation started.");
        });
    });
});