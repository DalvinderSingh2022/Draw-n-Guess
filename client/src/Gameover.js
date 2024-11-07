import React, { useEffect, useState } from 'react';
import { socket } from './App';

const Gameover = () => {
    const [room, setRoom] = useState(null);

    useEffect(() => {
        socket.on("game over", (room) => {
            setRoom(room);
        });

        return () => socket.off("game over");
    }, [room]);

    return (
        room &&
        <div className='fixed_container justify-center backdrop-blur-lg bg-orange-100/20'>
            <div className="flex w-full max-w-xl m-auto flex-col">
                <div className="flex flex-col gap-3 px-2 py-4 max-h-[80vh] overflow-auto">
                    {room.players.sort((a, b) => b.score - a.score).map((player, index) =>
                        <div key={player.id} className={`${index ? "primary text-2xl" : "secondary text-3xl py-4"} p-3 font-bold rounded-xl flex items-center`}>
                            <span>{index + 1}.</span>
                            <div className='truncate max-w-[80%]'>{player.name}</div>
                            <span className='m-auto mr-0'>{player.score}</span>
                        </div>)
                    }
                </div>
                <div className="flex justify-center gap-4 mt-6">
                    <button onClick={() => socket.emit("leave room", room.id)} className="button secondary px-6 py-2 rounded-xl">Home Page</button>
                </div>
            </div>
        </div>
    )
}

export default Gameover
