import React, { useEffect, useState } from 'react';
import { socket } from './App';

const Timer = () => {
    const [timer, setTimer] = useState({});

    useEffect(() => {
        socket.on("set timer", (time, message) => {
            setTimer({ time, message });
        });

        return () => socket.off("set timer");
    }, [timer]);

    return (
        timer?.time >= 0
            ? <div className='fixed_container justify-center backdrop-blur-lg bg-blue-200/20' >
                <div className="my-auto flex items-center flex-col gap-4">
                    <h1 className='text-orange-500 text-4xl font-bold mb-4 text-center'>{timer.message}</h1>
                    <span className='border-b-4  font-bold w-14 text-xl text-bold aspect-square grid place-items-center rounded-full secondary'>{timer.time}</span>
                </div>
            </div>
            : null
    )
}

export default Timer;