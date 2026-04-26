const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const words = require("./config/words");
require("dotenv");

// Create express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize socket.io with CORS config
const io = new Server(server, {
  cors: {
    origin: process.env.ORIGIN,
    methods: ["GET", "POST"],
  },
});

app.use(express.json());

// In-memory storage for all active rooms
const rooms = {};

io.on("connection", (socket) => {
  console.log("user connected : " + socket.id);

  /**
   * Send list of public rooms to client
   */
  socket.on("get public rooms", () => {
    socket.emit(
      "public rooms",
      Object.values(rooms).filter((room) => room.isPublic),
    );
  });

  /**
   * Host (create) a new room
   */
  socket.on(
    "host room",
    (
      userName,
      image,
      maxPlayers,
      maxRounds,
      drawTime,
      isPublic,
      roomName = "",
    ) => {
      if (!userName) {
        socket.emit("set alert", "userName can not be Empty");
        return;
      }

      // Prevent duplicate room names
      const exisitngRoom = Object.values(rooms).find(
        (room) => room.roomName == roomName,
      );
      if (exisitngRoom) {
        socket.emit("set alert", "Room Name already in use");
        return;
      }

      // Generate unique 4-digit room ID
      let roomId = Math.floor(Math.random() * 9000 + 1000);
      while (rooms[roomId]) {
        roomId = Math.floor(Math.random() * 9000 + 1000);
      }

      // Create room object
      const room = {
        players: [
          {
            name: userName,
            id: socket.id,
            guessed: false,
            score: 0,
            image,
          },
        ],
        host: socket.id,
        round: 0,
        isFull: false,
        maxPlayers: parseInt(maxPlayers) || 5,
        turnIndex: -1,
        maxRounds: parseInt(maxRounds) || 3,
        drawTime: parseInt(drawTime) || 60,
        timer: 0,
        currentWord: "",
        started: false,
        isPublic,
        id: roomId,
        roomName: roomName || `Room${roomId}`,
      };

      rooms[roomId] = room;

      // Join creator to room
      socket.join(roomId);
      socket.roomId = roomId;

      socket.emit("joined", room);
      socket.emit("set loading", false);

      // Update public rooms list globally
      if (room.isPublic) {
        io.emit(
          "public rooms",
          Object.values(rooms).filter((room) => room.isPublic),
        );
      }
    },
  );

  /**
   * Join an existing room
   */
  socket.on("join room", (roomId, userName, image) => {
    if (!userName) {
      socket.emit("set alert", "userName can not be null");
      return;
    }

    const room = rooms[roomId];

    if (String(roomId).length != 4) {
      socket.emit("set alert", "Room Id must be of 4 digits");
    } else if (!room) {
      socket.emit("set alert", `Room With id ${roomId} not Found`);
    } else if (room.players.length >= room.maxPlayers) {
      socket.emit("set alert", `Room ${roomId} is full`);
    } else {
      socket.emit("set loading", `Joinning Room ${roomId}`);

      // Add player to room
      room.players.push({
        name: userName,
        id: socket.id,
        score: 0,
        guessed: false,
        image,
      });

      socket.join(roomId);
      socket.roomId = roomId;

      socket.emit("joined", room);
      socket.emit("set loading", false);

      // Notify all players
      io.in(roomId).emit("update leaderboard", room);
      io.in(roomId).emit(
        "update messages",
        `${userName} Join the room`,
        "event",
      );

      if (room.isPublic) {
        io.emit(
          "public rooms",
          Object.values(rooms).filter((room) => room.isPublic),
        );
      }
    }
  });

  /**
   * Get current room details for this socket
   */
  socket.on("get room", () => {
    const room = Object.values(rooms).find((room) =>
      room.players.find((player) => player.id === socket.id),
    );

    if (room) io.in(room.id).emit("updated room", room);
  });

  /**
   * Start the game
   */
  socket.on("start game", () => {
    const roomId = socket.roomId;
    const room = rooms[roomId];
    if (!room) return;

    if (room.players.length < 2) {
      socket.emit("set alert", "atlest 2 players requied to start game");
      return;
    }

    room.started = true;

    io.in(roomId).emit("updated room", room);
    socket.emit("set loading", false);
    io.in(roomId).emit("update leaderboard", room);

    nextRound(roomId);
  });

  /**
   * Start next round
   */
  const nextRound = (roomId) => {
    const room = rooms[roomId];

    if (!room) return;

    // End game if max rounds reached
    if (room.round >= room.maxRounds) {
      io.in(roomId).emit("game over", room);
      return;
    }

    room.round++;
    room.turnIndex = 0;
    room.timer = 5; // countdown before turn starts
    room.currentWord = "";

    io.to(roomId).emit("new word", room, false);

    // Timer update callback
    const callback = () =>
      io
        .in(roomId)
        .emit("set timer", room.timer, `Starting Round ${room.round}`);
    if (room.isPublic) {
      io.emit(
        "public rooms",
        Object.values(rooms).filter((room) => room.isPublic),
      );
    }
    updatingTimer(room, callback);

    io.in(roomId).emit(
      "update messages",
      `Round ${room.round} started`,
      "event",
    );
  };

  /**
   * Move to next player's turn
   */
  const nextTurn = (roomId) => {
    const room = rooms[roomId];

    // Score previous drawer
    if (room.players[room.turnIndex - 1]) {
      const players = room.players;
      const drawer = players[room.turnIndex - 1];

      const guesses = players.reduce(
        (acc, player) => (player.guessed ? acc + 1 : acc),
        -1,
      );
      // start from -1 for drawer guessed is true

      drawer.score += 15 * guesses + (guesses === players.length - 1 ? 20 : 0);

      if (guesses > 0) {
        io.in(roomId).emit(
          "update messages",
          `${drawer.name} get +${15 * guesses} points ${guesses === players.length - 1 ? ", +20 bonus" : ""}`,
          "points",
        );
      }
      io.in(roomId).emit("update leaderboard", room);
    }

    if (!room) return;

    // If no more players → next round
    if (!room.players[room.turnIndex]?.id) {
      nextRound(roomId);
      return;
    }

    // Setup next turn
    room.currentWord = words[Math.floor(Math.random() * words.length)];
    room.players.forEach((p) => (p.guessed = false));

    room.turnIndex++;
    room.timer = 5 + room.drawTime;

    const drawer = room.players[room.turnIndex - 1];
    drawer.guessed = true; // drawer can't guess

    /**
     * Timer update logic for turn
     */
    const callback = () => {
      io.to(roomId)
        .except(drawer.id)
        .emit(
          "set timer",
          room.timer - room.drawTime,
          `${drawer.name} is choosing word`,
        );
      drawer.id === socket.id
        ? socket.emit(
            "set timer",
            room.timer - room.drawTime,
            `You have to draw ${room.currentWord}`,
          )
        : socket
            .to(drawer.id)
            .emit(
              "set timer",
              room.timer - room.drawTime,
              `You have to draw ${room.currentWord}`,
            );

      io.in(roomId).emit("set clock", room.timer);
    };

    // Notify players
    io.in(roomId).emit("update leaderboard", room);
    io.in(roomId).emit("updated room", room);

    io.to(roomId).except(drawer.id).emit("new word", room, false);
    drawer.id === socket.id
      ? socket.emit("new word", room, true)
      : socket.to(drawer.id).emit("new word", room, true);

    updatingTimer(room, callback);

    io.in(roomId).emit("update messages", `${drawer.name} is drawing`, "event");
  };

  /**
   * Generic timer handler used for rounds & turns
   */
  const updatingTimer = (room, callback) => {
    callback();

    const intervalId = setInterval(() => {
      if (room.timer > 0) {
        room.timer--;
        callback();
      } else {
        clearInterval(intervalId);
        nextTurn(room.id);
      }
    }, 1000);
  };

  /**
   * Drawing events (real-time sync)
   */
  socket.on("change canvas", (canvasImage) => {
    socket.to(socket.roomId).emit("new canvas", canvasImage);
  });

  socket.on("draw-line", (data) => {
    socket.to(socket.roomId).emit("draw-line", data);
  });

  /**
   * Handle chat messages & guessing logic
   */
  socket.on("new message", (message) => {
    const roomId = socket.roomId;
    const room = rooms[roomId];
    if (!room) return;

    const player = room.players.find((player) => player.id === socket.id);
    const drawer = room.players[room.turnIndex - 1];

    // If message is NOT correct guess → normal chat
    if (
      !message
        .toLowerCase()
        .replaceAll(" ", "")
        .includes(room.currentWord.toLowerCase().replaceAll(" ", ""))
    ) {
      socket
        .to(room.id)
        .emit("update messages", message, "others", player.name);
      socket.emit("update messages", message, "you");
      return;
    }

    // Validation checks
    if (player.id === drawer.id) {
      socket.emit("update messages", "You can't write word", "alert");
      return;
    }

    if (player.guessed) {
      socket.emit("update messages", "Already guessed", "alert");
      return;
    }

    // Correct guess → award points
    const score = room.timer;
    player.score += score;
    player.guessed = true;

    io.in(room.id).emit(
      "update messages",
      `${player.name} guessed +${score}`,
      "points",
    );

    io.in(room.id).emit("update leaderboard", room);
    player.id === socket.id
      ? socket.emit("new word", room, true)
      : socket.to(player.id).emit("new word", room, true);

    // End turn early if all guessed
    if (room.players.every((player) => player.guessed == true)) {
      room.timer = 0;
    }
  });

  socket.on("add loading", (loadingMsg) => {
    socket.emit("set loading", loadingMsg);
  });

  /**
   * Leave room manually
   */
  const leaveRoom = (room, playerLeft) => {
    const roomId = room.id;
    const drawer = room.players?.[room.turnIndex - 1];
    room.players = room.players.filter((player) => player.id !== playerLeft.id);

    if (room.players.length <= 0) {
      delete rooms[roomId];
    } else if (room.started) {
      io.in(roomId).emit(
        "update messages",
        `${playerLeft.name} Left the room`,
        "alert",
      );

      if (playerLeft.id == room.host) {
        room.host = room.players[0].id;
        io.in(roomId).emit(
          "update messages",
          `${room.players[0].name} is now host of room`,
          "event",
        );
      }

      if (drawer && playerLeft.id == drawer.id) {
        room.timer = 0;
        io.in(roomId).emit(
          "update messages",
          `${playerLeft.name} turn skipped`,
          "alert",
        );
      }
    }

    if (room.isPublic) {
      io.emit(
        "public rooms",
        Object.values(rooms).filter((room) => room.isPublic),
      );
    }

    io.in(roomId).emit("update leaderboard", room);
    socket.emit("set loading", false);
    socket.emit("leaved", room);
    io.in(roomId).emit("updated room", room);

    socket.leave(roomId);
  };

  socket.on("leave room", () => {
    const roomId = socket.roomId;
    const room = rooms[roomId];
    if (!room) return;

    const playerLeft = room.players.find((player) => player.id === socket.id);
    if (playerLeft) leaveRoom(room, playerLeft);
  });

  /**
   * Cleanup on disconnect
   */
  socket.on("disconnect", () => {
    console.log("disconnected : " + socket.id);

    for (const room of Object.values(rooms)) {
      const playerLeft = room.players.find((player) => player.id === socket.id);

      if (playerLeft) {
        leaveRoom(room, playerLeft);
        break;
      }
    }
  });
});

/**
 * Start server
 */
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
