import React, { useEffect, useState } from 'react';
import { socket } from './App';
import LeaderBoard from './LeaderBoard';

const Gameover = () => {
    const [gameover, setGameover] = useState(false);

    useEffect(() => {
        socket.on("game over", (time) => {
            setGameover(true);
        });
    }, [gameover]);

    return (
        gameover &&
        <div className='z-50 w-screen h-screen fixed flex flex-col justify-center backdrop-blur-lg bg-orange-100/20 top-0 left-0'>
            <div className="flex w-full items-center flex-col gap-4">
                <LeaderBoard />
                <button onClick={() => window.location.reload()} className="cursor-pointer transition-all text-xl font-semibold bg-yellow-500 text-white px-8 py-2 rounded-xl border-yellow-600 border-b-4 hover:brightness-110 hover:-translate-y-[2px] hover:border-b-4 active:border-b-2 active:brightness-90 active:translate-y-[2px]">Home</button>
            </div>
        </div>
    )
}

export default Gameover
