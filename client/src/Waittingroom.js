import React, { useEffect } from "react";
import Room from "./Room";
import { socket, useGame } from "./hooks/useGame";

const Waittingroom = () => {
  const { room, setRoom } = useGame();
  const waiting = !room?.started;

  const startGame = () => {
    socket.emit("add loading", `Setting Up room`);
    socket.emit("start game");
  };

  const leaveRoom = () => {
    socket.emit("add loading", "Leaving Room");
    socket.emit("leave room");
  };

  useEffect(() => {
    socket.emit("get room");
    socket.on("updated room", (room) => {
      setRoom(room);
    });

    return () => socket.off("updated room");
  }, [setRoom]);

  const inviteWhatsApp = () => {
    const baseUrl = "https://api.whatsapp.com/send?text=";
    const message = `👋 *Hey!*

  Remember how we used to play _Pictionary_? I just found this awesome online version called *Draw 'n Guess*! 🎮
  
  I've created a room for us — join me here:
  🔗 https://drawnguessds.netlify.app/
  
  ${room ? `🆔 *Room ID: ${room.id}*` : ""}
  
  Let's see who's the better artist! 🎨😉`;

    const encodedMessage = encodeURIComponent(message);
    const fullUrl = baseUrl + encodedMessage;
    window.open(fullUrl, "_blank");
  };

  return (
    <>
      {waiting ? (
        <div className="max-w-2xl m-auto py-12 px-2">
          <div className="m-auto shadow-lg container">
            <div className="heading primary items-center">
              <span>
                Players: {room?.players.length}/{room?.maxPlayers}
              </span>
              <button
                onClick={inviteWhatsApp}
                className="button secondary px-5 py-1 rounded-xl -mr-3"
              >
                Invite
              </button>
            </div>

            <div className="flex flex-col gap-3 px-6 py-4">
              {room ? (
                room.players.map((player) => (
                  <div
                    key={player.id}
                    className={`${player.id !== socket.id ? "primary" : "secondary"} text-xl font-bold  p-2 ps-4 rounded-xl flex justify-between items-center`}
                  >
                    <span>
                      {player.name}
                      {player.id === room.host ? " (host)" : ""}
                    </span>
                    <img
                      className="w-12 aspect-square rounded-2xl"
                      src={
                        player.image ||
                        "https://as1.ftcdn.net/v2/jpg/00/64/67/52/1000_F_64675209_7ve2XQANuzuHjMZXP3aIYIpsDKEbF5dD.jpg"
                      }
                      alt={player.name}
                      onError={(e) =>
                        (e.target.src =
                          "https://as1.ftcdn.net/v2/jpg/00/64/67/52/1000_F_64675209_7ve2XQANuzuHjMZXP3aIYIpsDKEbF5dD.jpg")
                      }
                    />
                  </div>
                ))
              ) : (
                <div className="rounded-full border-4 border-transparent border-b-orange-500 w-8 aspect-square animate-spin m-auto"></div>
              )}
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-6">
            {room?.host === socket.id && (
              <button
                onClick={startGame}
                className="button primary px-8 py-2 rounded-xl"
              >
                Start Game
              </button>
            )}
            <button
              onClick={leaveRoom}
              className="button secondary px-8 py-2 rounded-xl"
            >
              Leave Room
            </button>
          </div>
        </div>
      ) : (
        <Room />
      )}
    </>
  );
};

export default Waittingroom;
