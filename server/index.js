const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const words = require("./config/words");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'https://drawnguessds.netlify.app',
        methods: ["GET", "POST"]
    }
});

app.use(express.json());

const rooms = {};

io.on("connection", (socket) => {
    console.log("user connected : " + socket.id);
    socket.emit("connected");

    socket.on("get public rooms", () => {
        socket.emit("public rooms", Object.values(rooms).filter(room => room.public));
    });

    socket.on("host room", (userName, image, maxPlayers, maxRounds, drawTime, public) => {
        if (!userName) {
            socket.emit("set alert", 'userName can not be null');
            return;
        }

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
            maxPlayers: parseInt(maxPlayers) || 5,
            turnIndex: -1,
            maxRounds: parseInt(maxRounds) || 3,
            drawTime: parseInt(drawTime) || 60,
            timer: 0,
            currentWord: '',
            started: false,
            public,
            id: roomId
        }
        rooms[roomId] = room;

        socket.join(roomId);
        socket.emit("joined", room);
        socket.emit("set loading", false);
        if (room.public) {
            io.emit("public rooms", Object.values(rooms).filter(room => room.public));
        }
    });

    socket.on("join room", (roomId, userName, image) => {
        if (!userName) {
            socket.emit("set alert", 'userName can not be null');
            return;
        }
        const room = rooms[roomId];

        if (!room) {
            socket.emit("set alert", `Room With id ${roomId} not Found`);
        } else {
            if (room.players.length >= room.maxPlayers) {
                socket.emit("set alert", `Room ${roomId} is full`);
            } else {
                socket.emit("set loading", `Joinning Room ${roomId}`);
                room.players.push({
                    name: userName,
                    id: socket.id,
                    score: 0,
                    guessed: false,
                    image
                });

                socket.join(roomId);

                socket.emit("joined", room);
                socket.emit("set loading", false);

                io.in(roomId).emit("update leaderboard", room);
                io.in(roomId).emit("update messages", `${userName} Join the room`, "event");
                if (room.public) {
                    io.emit("public rooms", Object.values(rooms).filter(room => room.public));
                }
            }
        }
    });

    socket.on("get room", () => {
        const room = Object.values(rooms).filter(room => room.players.find(player => player.id === socket.id))?.[0];

        if (room) io.in(room.id).emit("updated room", room);
    });

    socket.on("start game", (roomId) => {
        if (rooms[roomId].players.length < 2) {
            socket.emit("set alert", "atlest 2 players requied to start game");
            return;
        }
        rooms[roomId].started = true;


        io.in(roomId).emit("updated room", rooms[roomId]);
        socket.emit("set loading", false);
        io.in(roomId).emit("update leaderboard", rooms[roomId]);

        nextRound(roomId);
    });

    const nextRound = (roomId) => {
        const room = rooms[roomId];

        if (room) {
            if (room.round >= room.maxRounds) {
                io.in(roomId).emit("game over", room);
            } else {
                room.round = room.round + 1;
                room.turnIndex = 0;
                room.timer = 5;
                room.currentWord = '';
                io.to(roomId).emit("new word", room, false);
                const callback = () => io.in(roomId).emit("set timer", room.timer, `Starting Round ${room.round}`);
                if (room.public) {
                    io.emit("public rooms", Object.values(rooms).filter(room => room.public));
                }

                updatingTimer(room, callback);
                io.in(roomId).emit("update messages", `Round ${room.round} started`, "event");
            }
        }
    }

    const nextTurn = (roomId) => {
        const room = rooms[roomId];

        if (room.players[room.turnIndex - 1]) {
            const players = room.players;
            const drawer = players[room.turnIndex - 1];
            const guesses = (players.reduce((acc, player) => player.guessed === true ? acc + 1 : acc, -1));
            drawer.score += ((15 * guesses) + (guesses === players.length - 1 ? 20 : 0));

            io.in(roomId).emit("update messages", `${drawer.name} get +${(15 * guesses)} points ${guesses === players.length - 1 ? ", +20 bonus" : ""}`, "points");
            io.in(roomId).emit("update leaderboard", room);
        }

        if (room) {
            if (!room.players[room.turnIndex]?.id) {
                nextRound(roomId);
            } else {
                room.currentWord = words[Math.floor(Math.random() * words.length)];
                room.players.map(player => player.guessed = false);
                room.turnIndex = room.turnIndex + 1;
                room.timer = 5 + room.drawTime;
                const drawer = room.players[room.turnIndex - 1];
                drawer.guessed = true;

                const callback = () => {
                    io.to(roomId).except(drawer.id).emit("set timer", room.timer - room.drawTime, `${drawer?.name} is choosing word to draw`);
                    (drawer.id === socket.id)
                        ? socket.emit("set timer", room.timer - room.drawTime, `You have to draw ${room.currentWord}`)
                        : socket.to(drawer.id).emit("set timer", room.timer - room.drawTime, `You have to draw ${room.currentWord}`);

                    io.in(roomId).emit("set clock", room.timer);
                }

                io.in(roomId).emit("update leaderboard", room);
                io.in(roomId).emit("updated room", room);
                io.to(roomId).except(drawer.id).emit("new word", room, false);
                (drawer.id === socket.id)
                    ? socket.emit("new word", room, true)
                    : socket.to(drawer.id).emit("new word", room, true);

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

        if (!message.toLowerCase().replaceAll(" ", "").includes(room.currentWord.toLowerCase().replaceAll(" ", ""))) {
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

                io.in(roomId).emit("update messages", `${player.name} have guessed word +${score}`, "points");
                io.in(roomId).emit("update leaderboard", room);
                (player.id === socket.id)
                    ? socket.emit("new word", room, true)
                    : socket.to(player.id).emit("new word", room, true);

                if (room.players.every(player => player.guessed == true)) {
                    room.timer = 0;
                }
            }
        }
    });

    socket.on("add loading", (loadingMsg) => {
        socket.emit("set loading", loadingMsg);
    });

    const leaveRoom = (room, playerLeft) => {
        const roomId = room.id;
        const drawer = room.players?.[room.turnIndex - 1];
        room.players = room.players.filter(player => (player.id !== playerLeft.id));

        if (room.players.length <= 0) {
            delete rooms[roomId];
        }
        else if (room.started) {
            io.in(roomId).emit("update messages", `${playerLeft.name} Left the room`, "alert");

            if (playerLeft.id == room.host) {
                room.host = room.players[0].id;
                io.in(roomId).emit("update messages", `${room.players[0].name} is now host of room`, "event");
            }

            if (playerLeft.id == drawer?.id) {
                room.timer = 0;
                io.in(roomId).emit("update messages", `${playerLeft.name} turn skipped`, "alert");
            }
        }

        if (room.public) {
            io.emit("public rooms", Object.values(rooms).filter(room => room.public));
        }
        io.in(roomId).emit("update leaderboard", room);
        socket.emit("set loading", false);
        socket.emit("leaved", room);
        io.in(roomId).emit("updated room", room);
        socket.leave(roomId);
    }

    socket.on("leave room", (roomId) => {
        socket.leave(roomId);

        const room = rooms[roomId];
        if (room) {
            const playerLeft = room.players.filter(player => player.id === socket.id)?.[0];

            if (playerLeft) {
                leaveRoom(room, playerLeft);
            }
        }
    });

    socket.on("disconnect", () => {
        console.log("disconnected : " + socket.id);

        Object.values(rooms).map(room => {
            const playerLeft = room.players.filter(player => player.id === socket.id)?.[0];

            if (playerLeft) {
                leaveRoom(room, playerLeft);
            }
        });
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));