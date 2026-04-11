import { useState, useEffect } from "react";
import { io } from "socket.io-client";

export const socket = io.connect(process.env.REACT_APP_BACKEND_URL);

export const useGame = () => {
  const [room, setRoom] = useState(null);

  useEffect(() => {
    const handleUpdate = (updatedRoom) => setRoom(updatedRoom);

    socket.on("joined", handleUpdate);
    socket.on("leaved", () => handleUpdate(null));

    return () => {
      socket.off("joined");
      socket.off("leaved");
    };
  }, []);

  return { room, setRoom };
};
