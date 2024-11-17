const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');
const path = require('path');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Update this to your frontend domain for production
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build'))); // Serve React build files

// Serve static files for React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// WebSocket and other configurations
const userSocketMap = {};
const roomCreationTimes = {};

function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
        return {
            socketId,
            username: userSocketMap[socketId],
        };
    });
}

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        console.log(`User ${username} joined room ${roomId}`);
        userSocketMap[socket.id] = username;
        socket.join(roomId);

        if (!roomCreationTimes[roomId]) {
            roomCreationTimes[roomId] = new Date().toISOString();
        }

        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
                roomCreationTime: roomCreationTimes[roomId],
            });
        });

        socket.emit(ACTIONS.JOINED, {
            clients,
            username,
            socketId: socket.id,
            roomCreationTime: roomCreationTimes[roomId],
        });
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
        delete userSocketMap[socket.id];
    });
});

const PORT = process.env.PORT || 8000; // Render will set PORT dynamically
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

