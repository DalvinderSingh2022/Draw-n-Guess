import React, { useEffect, useState } from 'react';
import Canvas from "./Canvas";
import { socket } from './App';
import Messages from './Messages';
import LeaderBoard from './LeaderBoard';
import Timer from "./Timer";
import Clock from './Clock';

const Room = ({ roomId }) => {
    const [room, setRoom] = useState(null);

    useEffect(() => {
        socket.on("updated room", (room) => {
            setRoom(room);
        });

        return () => socket.off("updated room");
    }, []);

    return (
        <>
            <div className='max-w-5xl m-auto flex flex-wrap'>
                <Clock />
                <Canvas />
                <div className='w-full flex p-2 gap-4 flex-col md:flex-row'>
                    <LeaderBoard players={room?.players} />
                    <Messages roomId={roomId} />
                </div>
                <Timer />
            </div>
        </>
    )
}

export default Room;