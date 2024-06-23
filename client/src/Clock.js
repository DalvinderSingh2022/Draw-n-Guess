import React, { useEffect, useState } from 'react';
import { socket } from './App';

const Clock = () => {
    const [time, setTimer] = useState(null);

    useEffect(() => {
        socket.on("set clock", (time) => {
            setTimer(time);
        })
    }, [time]);

    return (
        time >= 0 && time <= 60
            ? <span span className='bg-orange-400 border-orange-500 border-b-4 text-white font-bold w-14 text-xl text-bold aspect-square grid place-items-center rounded-full ' >
                {time}
            </span >
            : null
    )
}

export default Clock;