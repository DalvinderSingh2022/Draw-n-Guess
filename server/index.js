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
                guessed: false,
                score: 0
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

        io.in(roomId).emit("update messages", `Hosted the room`, userName);
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
                });

                socket.join(roomId);

                socket.emit("joined", room);

                io.in(roomId).emit("update leaderboard", room.players);
                io.in(roomId).emit("update messages", `Join the room`, userName);
            }
        }
    });

    socket.on("get room", () => {
        const room = rooms.filter(room => room.players.find(player => player.id === socket.id))?.[0];

        io.in(room.id).emit("updated room", room);
    });

    socket.on("start game", (roomId) => {
        rooms[roomId].started = true;

        io.in(roomId).emit("updated room", rooms[roomId]);
        io.in(roomId).emit("update leaderboard", rooms[roomId].players);

        nextRound(roomId);
    });

    const nextRound = (roomId) => {
        const room = rooms[roomId];

        if (room.round >= room.maxRounds) {
            io.in(roomId).emit("game over");
            io.in(room.id).emit("update leaderboard", room.players);
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
            room.players.map(player => player.guessed = false);
            room.turnIndex = room.turnIndex + 1;
            room.timer = 10 + 60;
            const drawer = room.players[room.turnIndex - 1];
            const callback = () => {
                io.to(roomId).except(drawer.id).emit("set timer", room.timer - 60, `${drawer?.name}'s turn`);
                if (drawer.id === socket.id) {
                    socket.emit("set timer", room.timer - 60, `You have to draw ${room.currentWord}`);
                } else {
                    socket.to(drawer.id).emit("set timer", room.timer - 60, `You have to draw ${room.currentWord}`);
                }

                io.in(room.id).emit("set clock", room.timer);
            }

            io.in(roomId).emit("update leaderboard", room.players);
            io.in(room.id).emit("updated room", room);
            io.to(roomId).except(drawer.id).emit("new word", room.currentWord, false);
            if (drawer.id === socket.id) {
                socket.emit("new word", room.currentWord, true);
            } else {
                socket.to(drawer.id).emit("new word", room.currentWord, true);
            }

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

    socket.on('new message', (message, roomId) => {
        const room = rooms[roomId];
        const player = room.players.find(player => player.id === socket.id);
        const drawer = room.players[room.turnIndex - 1];

        if (room.currentWord.toLowerCase() !== message.toLowerCase()) {
            io.in(roomId).emit("update messages", message, player.name);
        } else {
            if (player.id === drawer.id) {
                socket.emit("update messages", "You can't write word in chat", "Warning");
            }
            else if (player.guessed) {
                socket.emit("update messages", "You have already guessed", "Warning");
            } else {
                const score = room.timer;
                player.score += score;
                player.guessed = true;
                drawer.score += scorePerGuess;

                io.in(roomId).emit("update messages", `have guessed word +${score}`, player.name);
                io.in(roomId).emit("update messages", `for ${player.name}'s guess +${scorePerGuess}`, drawer.name);
                io.in(roomId).emit("update leaderboard", room.players);
                io.in(room.id).emit("new word", room.currentWord, true);
            }
        }
    });

    socket.on("disconnect", () => {
        console.log("disconnected : " + socket.id);

        rooms.map(room => {
            let playerLeft;
            const newPlayers = [];
            room.players.map(player => (player.id === socket.id) ? playerLeft = player : newPlayers.push(player));
            room.players = newPlayers;

            if (room.players.length <= 1 && room.started) {
                io.in(room.id).emit("game over");
                io.in(room.id).emit("update leaderboard", room.players);
                return;
            }

            if (playerLeft?.id) {
                io.in(room.id).emit("update messages", `Left the room`, playerLeft.name);
                io.in(room.id).emit("update leaderboard", room.players);

                if (playerLeft.id == room.host) {
                    room.host = room.players[0].id;

                    io.in(room.id).emit("update messages", `is now host of room`, room.players[0].name);
                }

                io.in(room?.id).emit("updated room", room);
            }
        });
    });
});

server.listen(4000, () => console.log(`Server running on port ${4000}`));