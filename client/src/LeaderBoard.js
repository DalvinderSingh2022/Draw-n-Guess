import React, { useEffect, useState } from 'react';
import { socket } from './App';

const LeaderBoard = () => {
    const [players, setPlayers] = useState([]);

    useEffect(() => {
        socket.on("update leaderboard", (players) => {
            setPlayers(players.sort((a, b) => b.score - a.score));
        });

        return () => socket.off("update leaderboard");
    }, []);

    return (
        <div className='w-full md:w-1/2 min-h-96 bg-blue-200/60 backdrop-blur rounded-2xl border-yellow-400 border-b-4 shadow-xl'>
            <div className="w-full text-center text-2xl font-bold bg-yellow-400 text-white px-6 py-2 rounded-2xl border-yellow-500 border-b-4">LeaderBoard</div>

            <div className='flex flex-col overflow-y-auto px-4 py-2 gap-2'>
                {players?.map((player, index) =>
                    <div key={player.id} className='bg-yellow-400 text-xl font-bold text-white px-4 py-2 rounded-xl flex justify-between'>
                        <span>{index + 1}. {player.name}{player.id === socket.id ? " (you)" : ""}</span>
                        <span>{player.score}</span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default LeaderBoard;