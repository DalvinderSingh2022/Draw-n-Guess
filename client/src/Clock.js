import React, { useEffect, useState } from 'react';
import { socket } from './App';

const Clock = () => {
    const [time, setTimer] = useState(0);

    useEffect(() => {
        socket.on("set clock", (time) => {
            setTimer(time);
        })
    }, [time]);

    return (
        time > 0 && time <= 60
            ? <span className='bg-blue-300 w-14 text-xl text-bold aspect-square grid place-items-center rounded-full '>{time}</span>
            : null
    )
}

export default Clock;