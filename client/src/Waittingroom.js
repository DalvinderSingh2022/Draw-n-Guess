import React, { useEffect, useState } from 'react';
import { socket } from './App';
import Room from './Room';

const Waittingroom = () => {
  const [waiting, setWaiting] = useState(true);
  const [room, setRoom] = useState(null);

  useEffect(() => {
    socket.emit("get room");
  }, []);

  useEffect(() => {
    socket.on("updated room", (room) => {
      setRoom(room);
      setWaiting(!room.started);
    });

    return () => socket.off("updated room");
  }, []);

  return (
    <>
      {
        waiting
          ?
          <div className="max-w-2xl m-auto py-12 flex flex-col items-center gap-4">

            <div className="flex flex-col m-auto bg-blue-100 rounded-2xl w-full border-orange-400 border-b-4 justify-center">
              <span className="flex justify-between text-2xl font-bold bg-orange-400 text-white px-6 py-2 rounded-2xl border-orange-500 border-b-4">
                <span>Room Id: {room?.id}</span>
                <span>{room?.players.length}/{room?.maxPlayers}</span>
              </span>

              <div className="flex flex-col gap-3 p-6">
                {room?.players?.map(player =>
                  <div key={player.id} className='bg-orange-400 text-lg font-bold text-white p-2 ps-4 rounded-xl flex justify-between items-center'>
                    <span>{player.name}{player.id === room.host ? " (host)" : ""}</span>
                    <img className='w-12 aspect-square rounded-xl' src={player.image || "https://as1.ftcdn.net/v2/jpg/00/64/67/52/1000_F_64675209_7ve2XQANuzuHjMZXP3aIYIpsDKEbF5dD.jpg"} alt={player.name} />
                  </div>
                )}
              </div>
            </div>

            <button onClick={() => window.location.reload()} className="cursor-pointer transition-all text-xl font-semibold bg-orange-500 text-white px-8 py-2 rounded-xl border-orange-600 border-b-4 hover:brightness-110 hover:-translate-y-1 hover:border-b-4 active:border-b-2 active:brightness-90 active:translate-y-1">leave Room</button>
            {(room?.host === socket.id && room?.players.length >= 2) && <button onClick={() => socket.emit("start game", room.id)} className="cursor-pointer transition-all text-xl font-semibold bg-orange-500 text-white px-8 py-2 rounded-xl border-orange-600 border-b-4 hover:brightness-110 hover:-translate-y-1 hover:border-b-4 active:border-b-2 active:brightness-90 active:translate-y-1">Start Game</button>}
          </div>

          : <Room roomId={room?.id} />
      }
    </>
  )

}

export default Waittingroom;