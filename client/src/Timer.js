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
            ? <div className='z-50 w-screen h-screen fixed flex justify-center bg-blue-200/20 backdrop-blur-md top-0 left-0' >
                <div className="my-auto flex items-center flex-col gap-4">
                    <h1 className='text-orange-500 text-4xl font-bold mb-4 text-center'>{timer.message}</h1>
                    <span className='bg-orange-400 border-orange-500 border-b-4 text-white font-bold w-14 text-xl text-bold aspect-square grid place-items-center rounded-full'>{timer.time}</span>
                </div>
            </div>
            : null
    )
}

export default Timer;