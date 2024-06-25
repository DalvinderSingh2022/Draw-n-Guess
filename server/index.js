const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const words = require("./config/words");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

let rooms = [];

io.on("connection", (socket) => {
    console.log("user connected : " + socket.id);

    // socket.on("join public room", (username) => {
    //     console.log(username)
    // });

    socket.on("host room", (userName, image) => {
        let roomId = Math.floor((Math.random() * 9000) + 1000);
        while (rooms[roomId]) {
            roomId = Math.floor((Math.random() * 9000) + 1000);
        }

        const room = {
            players: [{
                name: userName,
                id: socket.id,
                guessed: false,
                score: 0,
                image
            }],
            host: socket.id,
            round: 0,
            isFull: false,
            maxPlayers: 5,
            turnIndex: -1,
            maxRounds: 3,
            timer: 0,
            currentWord: '',
            started: false,
            id: roomId
        }
        rooms[roomId] = room;

        socket.join(roomId);

        socket.emit("joined", room);
        console.log("hosted roomId: " + roomId);
    });

    socket.on("join room", (roomId, userName, image) => {
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
                    score: 0,
                    image
                });

                socket.join(roomId);

                socket.emit("joined", room);

                io.in(roomId).emit("update leaderboard", room.players);
                io.in(roomId).emit("update messages", `${userName} Join the room`, "event");
            }
        }
    });

    socket.on("get room", () => {
        const room = rooms.filter(room => room.players.find(player => player.id === socket.id))?.[0];

        if (room) io.in(room.id).emit("updated room", room);
    });

    socket.on("start game", (roomId) => {
        rooms[roomId].started = true;

        io.in(roomId).emit("updated room", rooms[roomId]);
        io.in(roomId).emit("update leaderboard", rooms[roomId].players);

        nextRound(roomId);
    });

    const nextRound = (roomId) => {
        const room = rooms[roomId];

        if (room) {
            if (room.round >= room.maxRounds) {
                io.in(roomId).emit("game over");
                io.in(room.id).emit("update leaderboard", room.players);
            } else {
                room.round = room.round + 1;
                room.turnIndex = 0;
                room.timer = 5;
                room.currentWord = '';
                io.to(roomId).emit("new word", room, false);
                const callback = () => io.in(room.id).emit("set timer", room.timer, `Starting Round ${room.round}`);

                updatingTimer(room, callback, false);
                io.in(roomId).emit("update messages", `Round ${room.round} started`, "event");
            }
        }
    }

    const nextTurn = (roomId) => {
        const room = rooms[roomId];

        if (room) {
            if (!room.players[room.turnIndex]?.id) {
                nextRound(roomId);
            } else {
                room.currentWord = words[Math.floor(Math.random() * words.length)];
                room.players.map(player => player.guessed = false);
                room.turnIndex = room.turnIndex + 1;
                room.timer = 10 + 60;
                const drawer = room.players[room.turnIndex - 1];
                const callback = () => {
                    io.to(roomId).except(drawer.id).emit("set timer", room.timer - 60, `${drawer?.name} is choosing word to draw`);
                    if (drawer.id === socket.id) {
                        socket.emit("set timer", room.timer - 60, `You have to draw ${room.currentWord}`);
                    } else {
                        socket.to(drawer.id).emit("set timer", room.timer - 60, `You have to draw ${room.currentWord}`);
                    }

                    io.in(room.id).emit("set clock", room.timer);
                }

                io.in(roomId).emit("update leaderboard", room.players);
                io.in(roomId).emit("updated room", room);
                io.to(roomId).except(drawer.id).emit("new word", room, false);
                if (drawer.id === socket.id) {
                    socket.emit("new word", room, true);
                } else {
                    socket.to(drawer.id).emit("new word", room, true);
                }

                updatingTimer(room, callback);
                io.in(roomId).emit("update messages", `${drawer.name} is drawing`, "event");
            }
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

    socket.on('new message', (message, roomId) => {
        const room = rooms[roomId];
        const player = room.players.find(player => player.id === socket.id);
        const drawer = room.players[room.turnIndex - 1];

        if (room.currentWord.toLowerCase() !== message.toLowerCase()) {
            socket.to(roomId).emit("update messages", message, "others", player.name);
            socket.emit("update messages", message, "you");
        } else {
            if (player.id === drawer.id) {
                socket.emit("update messages", "You can't write word in chat", "alert");
            }
            else if (player.guessed) {
                socket.emit("update messages", "You have already guessed", "alert");
            } else {
                const score = room.timer;
                player.score += score;
                player.guessed = true;
                drawer.score += 15;

                io.in(roomId).emit("update messages", `${player.name} have guessed word +${score}`, "points");
                io.in(roomId).emit("update messages", `${drawer.name} get +15 for ${player.name}'s guess`, "points");
                io.in(roomId).emit("update leaderboard", room.players);
                io.in(room.id).emit("new word", room, true);
            }
        }
    });

    socket.on("disconnect", () => {
        console.log("disconnected : " + socket.id);

        rooms.map(room => {
            let playerLeft = undefined;
            const newPlayers = [];
            const roomId = room.id;

            room.players.map(player => (player.id === socket.id) ? playerLeft = player : newPlayers.push(player));
            room.players = newPlayers;

            if (playerLeft) {
                if (room.players.length <= 0) {
                    rooms = rooms.filter(room => room.id !== roomId);
                }
                else if (room.players.length <= 1 && room.started) {
                    io.in(room.id).emit("game over");
                    io.in(room.id).emit("update leaderboard", room.players);
                    return;
                } else {
                    io.in(roomId).emit("update messages", `${playerLeft.name} Left the room`, "alert");
                    io.in(roomId).emit("update leaderboard", room.players);

                    if (playerLeft.id == room.host) {
                        room.host = room.players[0].id;

                        io.in(roomId).emit("update messages", `${room.players[0].name} is now host of room`, "event");
                    }

                    io.in(roomId).emit("updated room", room);
                }
            }
        });
    });
});

server.listen(4000, () => console.log(`Server running on port ${4000}`));