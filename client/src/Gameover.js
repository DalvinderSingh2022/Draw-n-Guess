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
                <div className="flex flex-col gap-3 px-6 py-4">
                    {room.players.sort((a, b) => b.score - a.score).map((player, index) =>
                        <div key={player.id} className={`${index ? "primary p-2 ps-4 text-2xl" : "secondary p-4 ps-6 text-3xl"} font-bold rounded-xl flex justify-between items-center`}>
                            <img className='w-12 aspect-square rounded-2xl' src={player.image || "https://as1.ftcdn.net/v2/jpg/00/64/67/52/1000_F_64675209_7ve2XQANuzuHjMZXP3aIYIpsDKEbF5dD.jpg"} alt={player.name} onError={(e) => e.target.src = "https://as1.ftcdn.net/v2/jpg/00/64/67/52/1000_F_64675209_7ve2XQANuzuHjMZXP3aIYIpsDKEbF5dD.jpg"} />
                            <span className={`${index ? "text-xl" : "text-2xl"}`}>{player.name}</span>
                            <span className='my-auto px-4'>{player.score}</span>
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
