import React, { useEffect, useState } from "react";
import Clock from "./Clock";
import { FaCopy } from "react-icons/fa";
import { socket, useGame } from "./hooks/useGame";

const NavBar = () => {
  const { room, setRoom } = useGame();
  const [show, setShow] = useState(false);

  useEffect(() => {
    socket.on("updated room", (room) => {
      setRoom(room);
    });
    socket.on("new word", (room, show) => {
      setRoom(room);
      setShow(show);
    });

    return () => {
      socket.off("updated room");
      socket.off("new word");
    };
  }, [setRoom]);

  const copyRoomId = () => {
    if (!room || !room.id) return;

    navigator.clipboard
      .writeText(room.id)
      .then(() => {
        alert("Invite Room Id copied to clipboard! ✅");
      })
      .catch((err) => {
        console.error("Failed to copy Room Id: ", err);
      });
  };

  return (
    <nav
      className={`${room?.currentWord ? "py-2" : "py-6"} px-2 mdpx-6 text-center relative  text-3xl font-bold m-auto primary`}
    >
      {room?.currentWord ? (
        <div className="max-w-4xl m-auto flex items-center justify-between">
          <Clock />
          <div className="self-center">
            {room?.currentWord &&
              room.currentWord
                .split("")
                .map((alphabet) => (show ? alphabet.toUpperCase() : "_") + " ")}
            <sup>{room?.currentWord && room.currentWord.length}</sup>
          </div>
          <span>
            {room.round}/{room.maxRounds}{" "}
          </span>
        </div>
      ) : room ? (
        <span
          onClick={copyRoomId}
          className="flex m-auto justify-center cursor-pointer"
        >
          {`${room?.roomName} (${room?.id})`}
          <FaCopy className="text-base my-auto" />
        </span>
      ) : (
        "Draw 'n Guess"
      )}
    </nav>
  );
};

export default NavBar;
