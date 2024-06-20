const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

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
            turnIndex: 0,
            id: roomId
        }
        rooms[roomId] = room;

        socket.join(roomId);

        socket.emit("joined", room);
        console.log("hosted roomId: " + roomId)
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

        io.in(room?.id).emit("updated room", room);
    });

    socket.on("start game", (roomId) => {
        rooms[roomId].round = 1;

        io.in(roomId).emit("updated room", rooms[roomId]);
    });

    socket.on("change canvas", (canvasImage, roomId) => {
        socket.to(roomId).emit("new canvas", canvasImage);
    });

    socket.on("disconnect", () => {
        console.log("disconnected : " + socket.id);
    })
})

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));