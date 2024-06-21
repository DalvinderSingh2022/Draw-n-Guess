import React from 'react';
import { socket } from './App';

const LeaderBoard = ({ players }) => {

    return (
        <div className='w-full md:w-1/2 h-96 bg-blue-100 rounded-2xl flex flex-col justify-between'>
            <span className="flex justify-center text-xl font-bold bg-orange-400 text-white px-6 py-2 rounded-2xl border-orange-500 border-b-4">LeaderBoard</span>

            <div className='flex flex-col h-96 overflow-y-auto p-3 gap-2'>
                {players?.map(player =>
                    <div key={player.id} className='bg-orange-400 text-lg font-bold text-white px-4 py-2 rounded-xl flex justify-between items-center'>
                        <span>{player.name}{player.id === socket.id ? " (you)" : ""}</span>
                        <span>{player.score}</span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default LeaderBoard;