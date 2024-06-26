import React, { useEffect, useState } from 'react';
import { socket } from './App';
import LeaderBoard from './LeaderBoard';

const Gameover = () => {
    const [gameover, setGameover] = useState(false);

    useEffect(() => {
        socket.on("game over", (time) => {
            setGameover(true);
        });

        return () => socket.off("game over");
    }, [gameover]);

    return (
        gameover &&
        <div className='fixed_container justify-center backdrop-blur-lg bg-orange-100/20'>
            <div className="flex w-full items-center flex-col gap-4">
                <LeaderBoard />
                <button onClick={() => window.location.reload()} className="button primary px-6 py-2 rounded-xl">Exit Game</button>
            </div>
        </div>
    )
}

export default Gameover
