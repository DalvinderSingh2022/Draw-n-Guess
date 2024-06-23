import React from 'react';
import Canvas from "./Canvas";
import Messages from './Messages';
import LeaderBoard from './LeaderBoard';
import Timer from "./Timer";
import Gameover from './Gameover';

const Room = ({ roomId }) => {
    return (
        <>
            <div className='max-w-5xl m-auto'>
                <Canvas />
                <div className='w-full flex p-2 gap-4 flex-col md:flex-row'>
                    <LeaderBoard />
                    <Messages roomId={roomId} />
                </div>
                <Timer />
            </div>
            <Gameover />
        </>
    )
}

export default Room;