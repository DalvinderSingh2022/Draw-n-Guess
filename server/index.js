const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const words = require("./config/words");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000"
    }
});

app.use(cors());
app.use(express.json());

const rooms = [];

io.on("connection", (socket) => {
    console.log("user connected : " + socket.id);

    // socket.on("join public room", (username) => {
    //     console.log(username)
    // });

    socket.on("host room", (userName) => {
        let roomId = Math.floor((Math.random() * 9000) + 1000);
        while (rooms[roomId]) {
            roomId = Math.floor((Math.random() * 9000) + 1000);
        }

        const room = {
            players: [{
                name: userName,
                id: socket.id,
                score: 0
            }],
            host: socket.id,
            round: 0,
            isFull: false,
            maxPlayers: 5,
            turnIndex: -1,
            maxRounds: 3,
            timer: 0,
            id: roomId
        }
        rooms[roomId] = room;

        socket.join(roomId);

        socket.emit("joined", room);
        console.log("hosted roomId: " + roomId);
    });

    socket.on("join room", (roomId, userName) => {
        const room = rooms[roomId];

        if (!room) {
            socket.emit("invalid room", `${roomId} not found`);
        } else {
            if (room.players.length >= room.maxPlayers) {
                socket.emit("invalid room", `${roomId} is full`);
            } else {
                room.players.push({
                    name: userName,
                    id: socket.id,
                    score: 0
                })

                socket.join(roomId);

                socket.emit("joined", room);
            }
        }
    });


    socket.on("get room", () => {
        const room = rooms.filter(room => room.players.find(player => player.id === socket.id))?.[0];

        io.in(room.id).emit("updated room", room);
    });

    socket.on("start game", (roomId) => {
        io.in(roomId).emit("updated room", rooms[roomId]);
        io.in(roomId).emit("leave waitting room");

        nextRound(roomId);
    });

    const nextRound = (roomId) => {
        const room = rooms[roomId];

        if (room.round >= room.maxRounds) {
            io.in(roomId).emit("set timer", 1000, `game over`);
        } else {
            room.round = room.round + 1;
            room.turnIndex = 0;
            room.timer = 5;
            const callback = () => io.in(room.id).emit("set timer", room.timer, `Starting Round ${room.round}`);

            updatingTimer(room, callback, false);
        }
    }

    const nextTurn = (roomId) => {
        const room = rooms[roomId];

        if (!room.players[room.turnIndex]?.id) {
            nextRound(roomId);
        } else {
            room.currentWord = words[Math.floor(Math.random() * words.length)];
            room.turnIndex = room.turnIndex + 1;
            room.timer = 70;
            const callback = () => {
                const drawer = room.players[room.turnIndex - 1];

                io.to(roomId).except(drawer.id).emit("set timer", room.timer - 60, `${drawer?.name}'s turn`);
                if (drawer.id === socket.id) {
                    socket.emit("set timer", room.timer - 60, `You have to draw ${room.currentWord}`);
                } else {
                    socket.to(drawer.id).emit("set timer", room.timer - 60, `You have to draw ${room.currentWord}`);
                }

                io.in(room.id).emit("set clock", room.timer);
            }
            io.in(room.id).emit("updated room", room);

            updatingTimer(room, callback);
        }
    }

    const updatingTimer = (room, callback) => {
        callback();

        const intervalId = setInterval(() => {
            if (room.timer > 0) {
                room.timer = room.timer - 1;
                callback();
            } else {
                clearInterval(intervalId);
                nextTurn(room.id);
            }
        }, 1000);
    };

    socket.on("change canvas", (canvasImage, roomId) => {
        socket.to(roomId).emit("new canvas", canvasImage);
    });

    socket.on('new message', (msg, roomId) => {
        const player = rooms[roomId].players.find(player => player.id === socket.id);

        io.in(roomId).emit("update messages", msg, player);
    });

    socket.on("disconnect", () => {
        console.log("disconnected : " + socket.id);
    })
})

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));