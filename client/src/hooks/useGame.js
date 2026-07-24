import { useState, useEffect } from "react";
import { io } from "socket.io-client";

export const socket = io.connect(process.env.REACT_APP_BACKEND_URL);

export const useGame = () => {
  const [room, setRoom] = useState(null);

  useEffect(() => {
    const handleJoined = (updatedRoom) => setRoom(updatedRoom);
    const handleLeaved = () => setRoom(null);

    socket.on("joined", handleJoined);
    socket.on("leaved", handleLeaved);

    return () => {
      socket.off("joined", handleJoined);
      socket.off("leaved", handleLeaved);
    };
  }, []);

  return { room, setRoom };
};
