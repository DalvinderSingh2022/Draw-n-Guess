import React, { useEffect, useState } from 'react';
import { socket } from './App';

const Timer = () => {
    const [timer, setTimer] = useState({});

    useEffect(() => {
        socket.on("set timer", (time, message) => {
            setTimer({ time, message });
        })
    }, [timer]);

    return (
        timer?.time > 0
            ? <div className='z-50 w-screen h-screen fixed flex justify-center backdrop-blur-lg shadow-lg top-0 left-0' >
                <div className="my-auto flex items-center flex-col gap-4">
                    <h1 className='text-4xl font-bold mb-4 text-primary'>{timer.message}</h1>
                    <span className='bg-blue-300 w-14 text-xl text-bold aspect-square grid place-items-center rounded-full '>{timer.time}</span>
                </div>
            </div>
            : null
    )
}

export default Timer;