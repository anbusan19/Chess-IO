const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const path = require('path');

app.use(express.static(path.join(__dirname, '/')));

const rooms = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Create or join room
    socket.on('joinRoom', (roomId) => {
        if (!rooms.has(roomId)) {
            // Create new room
            rooms.set(roomId, {
                players: [socket.id],
                currentGame: null
            });
            socket.join(roomId);
            socket.emit('joinedRoom', { roomId, color: 'white' });
        } else if (rooms.get(roomId).players.length === 1) {
            // Join existing room
            rooms.get(roomId).players.push(socket.id);
            socket.join(roomId);
            socket.emit('joinedRoom', { roomId, color: 'black' });
            io.to(roomId).emit('gameStart');
        } else {
            // Room is full
            socket.emit('roomFull');
        }
    });

    // Handle moves
    socket.on('move', ({ roomId, move }) => {
        socket.to(roomId).emit('opponentMove', move);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        rooms.forEach((room, roomId) => {
            if (room.players.includes(socket.id)) {
                room.players = room.players.filter(id => id !== socket.id);
                io.to(roomId).emit('playerLeft');
                if (room.players.length === 0) {
                    rooms.delete(roomId);
                }
            }
        });
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 