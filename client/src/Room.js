import React from 'react';
import Canvas from "./Canvas";
import Messages from './Messages';
import LeaderBoard from './LeaderBoard';
import Timer from "./Timer";
import Gameover from './Gameover';
import { socket } from './App';

const Room = ({ roomId }) => {
    return (
        <>
            <div className='max-w-5xl m-auto'>
                <Canvas />
                <Timer />
                <div className='w-full flex p-2 gap-4 flex-col md:flex-row'>
                    <LeaderBoard />
                    <Messages roomId={roomId} />
                </div>
                <div className="flex items-center py-4">
                    <button onClick={() => socket.emit("leave room", roomId)} className="button secondary px-8 py-2 rounded-xl mx-auto">Leave Room</button>
                </div>
            </div>
            <Gameover />
        </>
    )
}

export default Room;