const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const words = require("./config/words");
require("dotenv");

// Create express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize socket.io with CORS config
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

app.use(express.json());

// In-memory storage for all active rooms
const rooms = {};

// Countdown interval per room (kept off the room object so it is never serialized)
const roomTimers = {};

// Word options offered to the current drawer, kept off the room object so
// guessers never receive them
const roomOptions = {};

// Seconds the drawer gets to pick a word before it is picked for them
const CHOOSE_TIME = 5;

/**
 * Broadcast the public rooms list
 */
const updatePublicRooms = () => {
  io.emit(
    "public rooms",
    Object.values(rooms).filter((room) => room.isPublic),
  );
};

const clearRoomTimer = (roomId) => {
  if (roomTimers[roomId]) {
    clearInterval(roomTimers[roomId]);
    delete roomTimers[roomId];
  }
};

/**
 * Generic countdown on room.timer. Ticks once immediately, then every second
 * until it hits 0, at which point onEnd is called.
 */
const runTimer = (roomId, onTick, onEnd) => {
  clearRoomTimer(roomId);
  if (!rooms[roomId]) return;

  onTick();

  roomTimers[roomId] = setInterval(() => {
    const room = rooms[roomId];
    if (!room) {
      clearRoomTimer(roomId);
      return;
    }

    if (room.timer > 0) room.timer--;
    onTick();

    // ends on the tick that shows 0, so the countdown lasts exactly its length
    if (room.timer <= 0) {
      clearRoomTimer(roomId);
      onEnd();
    }
  }, 1000);
};

/**
 * Start next round
 */
const nextRound = (roomId) => {
  const room = rooms[roomId];
  if (!room) return;

  // End game if max rounds reached
  if (room.round >= room.maxRounds) {
    clearRoomTimer(roomId);
    room.started = false;
    room.choosing = false;
    room.drawerId = null;
    room.currentWord = "";
    io.in(roomId).emit("game over", room);
    return;
  }

  room.round++;
  room.turnIndex = 0;
  room.timer = 5; // countdown before first turn starts
  room.currentWord = "";
  room.choosing = false;
  room.drawerId = null;

  io.to(roomId).emit("new word", room, false);
  io.in(roomId).emit("update messages", `Round ${room.round} started`, "event");

  if (room.isPublic) updatePublicRooms();

  runTimer(
    roomId,
    () =>
      io
        .in(roomId)
        .emit("set timer", room.timer, `Starting Round ${room.round}`),
    () => nextTurn(roomId),
  );
};

/**
 * Move to next player's turn — starts the word choosing phase
 */
const nextTurn = (roomId) => {
  const room = rooms[roomId];
  if (!room) return;

  clearRoomTimer(roomId);

  // Score the drawer of the turn that just ended (skipped if they left)
  const previousDrawer = room.players.find(
    (player) => player.id === room.drawerId,
  );

  if (previousDrawer) {
    const players = room.players;

    // start from -1 because the drawer's own `guessed` is true
    const guesses = players.reduce(
      (acc, player) => (player.guessed ? acc + 1 : acc),
      -1,
    );

    if (guesses > 0) {
      const bonus = guesses === players.length - 1 ? 20 : 0;
      previousDrawer.score += 15 * guesses + bonus;

      io.in(roomId).emit(
        "update messages",
        `${previousDrawer.name} get +${15 * guesses} points ${bonus ? ", +20 bonus" : ""}`,
        "points",
      );
    }

    io.in(roomId).emit("update leaderboard", room);
  }

  room.drawerId = null;
  room.currentWord = "";

  // If no more players in this round → next round
  if (!room.players[room.turnIndex]?.id) {
    nextRound(roomId);
    return;
  }

  // Setup next turn
  room.players.forEach((player) => (player.guessed = false));
  room.turnIndex++;

  const drawer = room.players[room.turnIndex - 1];
  drawer.guessed = true; // drawer can't guess
  room.drawerId = drawer.id;

  // Word choosing phase
  room.choosing = true;
  room.timer = CHOOSE_TIME;

  const options = [...words].sort(() => 0.5 - Math.random()).slice(0, 3);
  roomOptions[roomId] = options;

  io.in(roomId).emit("update leaderboard", room);
  io.in(roomId).emit("updated room", room);
  io.in(roomId).emit("new word", room, false);

  // Drawer picks a word, everyone else waits
  io.to(drawer.id).emit("set timer", -1);
  io.to(drawer.id).emit("choose word", options, CHOOSE_TIME);

  runTimer(
    roomId,
    () => {
      io.to(roomId)
        .except(drawer.id)
        .emit("set timer", room.timer, `${drawer.name} is choosing a word`);
      io.to(drawer.id).emit("choose timer", room.timer);
    },
    // Ran out of time → first word is picked automatically
    () => chooseWord(roomId, options[0], true),
  );
};

/**
 * Lock in the drawer's word and start the drawing phase
 */
const chooseWord = (roomId, word, auto = false) => {
  const room = rooms[roomId];
  if (!room || !room.choosing) return;

  const drawer = room.players.find((player) => player.id === room.drawerId);
  if (!drawer) {
    // Drawer left while choosing → skip the turn
    room.choosing = false;
    delete roomOptions[roomId];
    nextTurn(roomId);
    return;
  }

  const options = roomOptions[roomId] || [];
  const chosen = options.includes(word) ? word : options[0];
  if (!chosen) return;

  clearRoomTimer(roomId);
  delete roomOptions[roomId];

  room.choosing = false;
  room.currentWord = chosen;
  room.timer = room.drawTime;

  // Hide the choosing overlay / modal and start from a blank board
  io.to(drawer.id).emit("close word choice");
  io.to(roomId).except(drawer.id).emit("set timer", -1);
  io.in(roomId).emit("clear canvas");

  io.in(roomId).emit("updated room", room);
  io.to(roomId).except(drawer.id).emit("new word", room, false);
  io.to(drawer.id).emit("new word", room, true);

  io.in(roomId).emit(
    "update messages",
    auto
      ? `${drawer.name} ran out of time, word picked automatically`
      : `${drawer.name} is drawing`,
    "event",
  );

  runTimer(
    roomId,
    () => io.in(roomId).emit("set clock", room.timer),
    () => nextTurn(roomId),
  );
};

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
        drawerId: null,
        choosing: false,
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
      if (room.isPublic) updatePublicRooms();
    },
  );

  /**
   * Join an existing room
   */
  socket.on("join room", (requestedId, userName, image) => {
    if (!userName) {
      socket.emit("set alert", "userName can not be null");
      return;
    }

    const room = rooms[String(requestedId).trim()];
    const roomId = room?.id;

    if (String(requestedId).trim().length != 4) {
      socket.emit("set alert", "Room Id must be of 4 digits");
    } else if (!room) {
      socket.emit("set alert", `Room With id ${requestedId} not Found`);
    } else if (room.players.length >= room.maxPlayers) {
      socket.emit("set alert", `Room ${roomId} is full`);
    } else {
      socket.emit("set loading", `Joinning Room ${roomId}`);

      // Add player to room — a player joining mid-turn can't guess this turn
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

      if (room.isPublic) updatePublicRooms();
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
   * Drawer picked one of the three offered words
   */
  socket.on("word chosen", (word) => {
    const roomId = socket.roomId;
    const room = rooms[roomId];
    if (!room || !room.choosing) return;

    // Only the current drawer may choose
    if (room.drawerId !== socket.id) return;

    chooseWord(roomId, word);
  });

  /**
   * Drawing events (real-time sync)
   */
  socket.on("change canvas", (canvasImage) => {
    const room = rooms[socket.roomId];
    if (!room || room.drawerId !== socket.id) return;
    socket.to(socket.roomId).emit("new canvas", canvasImage);
  });

  socket.on("draw-line", (data) => {
    const room = rooms[socket.roomId];
    if (!room || room.drawerId !== socket.id) return;
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
    if (!player) return;

    const normalize = (text) => text.toLowerCase().replaceAll(" ", "");

    // No word in play yet (round start / word choosing) → everything is chat
    const isGuess =
      !!room.currentWord &&
      !room.choosing &&
      normalize(message).includes(normalize(room.currentWord));

    if (!isGuess) {
      socket
        .to(room.id)
        .emit("update messages", message, "others", player.name);
      socket.emit("update messages", message, "you");
      return;
    }

    // Validation checks
    if (player.id === room.drawerId) {
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
  const leaveRoom = (roomId, playerLeft) => {
    const room = rooms[roomId];
    if (!room) return;

    const wasDrawer = playerLeft.id === room.drawerId;
    const leftIndex = room.players.findIndex(
      (player) => player.id === playerLeft.id,
    );

    room.players = room.players.filter((player) => player.id !== playerLeft.id);

    // Keep the turn pointer aligned after removing a player before/at the drawer
    if (leftIndex > -1 && leftIndex <= room.turnIndex - 1) room.turnIndex--;

    if (room.players.length <= 0) {
      clearRoomTimer(roomId);
      delete roomOptions[roomId];
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

      if (wasDrawer) {
        io.in(roomId).emit(
          "update messages",
          `${playerLeft.name} turn skipped`,
          "alert",
        );

        room.drawerId = null;
        room.choosing = false;
        room.currentWord = "";
        delete roomOptions[roomId];

        clearRoomTimer(roomId);
        io.in(roomId).emit("set timer", -1);
        nextTurn(roomId);
      }
    }

    if (room.isPublic) updatePublicRooms();

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
    if (playerLeft) leaveRoom(roomId, playerLeft);
  });

  /**
   * Cleanup on disconnect
   */
  socket.on("disconnect", () => {
    console.log("disconnected : " + socket.id);

    for (const room of Object.values(rooms)) {
      if (room.id) {
        const playerLeft = room.players.find(
          (player) => player.id === socket.id,
        );

        if (playerLeft) {
          leaveRoom(room.id, playerLeft);
          break;
        }
      }
    }
  });
});

/**
 * Start server
 */
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
