import React, { useEffect, useState } from 'react';
import { socket } from './App';

const LeaderBoard = () => {
    const [room, setRoom] = useState();

    useEffect(() => {
        socket.on("updated room", (room) => {
            setRoom(room);
        });

        socket.on("update leaderboard", (room) => {
            setRoom(room);
        });

        return () => {
            socket.off("update leaderboard");
            socket.off("updated room");
        }
    }, []);

    return (
        <div className='md:w-1/2 min-h-96 container'>

            <div className="heading primary">
                <span>LeaderBoard</span>
                {room && <span>{(room.players.findIndex(play => play.id === socket.id) + 1)}/{room.players.length}</span>}
            </div>

            <div className='flex flex-col overflow-y-auto px-4 py-2 gap-2'>
                {room && room.players.sort((a, b) => b.score - a.score).map((player, index) =>
                    <div key={player.id} className={`${player.id !== socket.id ? "primary" : "secondary"} text-xl font-bold  px-4 py-2 rounded-xl flex justify-between`}>
                        <span>{index + 1}. {player.name}{room.players[room.turnIndex - 1]?.id === player.id ? " (Drawing)" : ""}</span>
                        <span>{player.score}</span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default LeaderBoard;