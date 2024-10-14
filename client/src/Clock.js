import React, { useEffect, useState } from 'react';
import { socket } from './App';

const Clock = ({ room }) => {
    const [time, setTimer] = useState(null);

    useEffect(() => {
        socket.on("set clock", (time) => {
            setTimer(time);
        });

        return () => socket.off("set clock");
    }, [time]);

    return (
        time >= 0 && time <= room.timer
            ? <span className='secondary border-b-4  font-bold w-14 text-xl text-bold aspect-square grid place-items-center rounded-full ' >
                {time}
            </span >
            : null
    )
}

export default Clock;