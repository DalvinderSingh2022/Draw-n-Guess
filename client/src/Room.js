import React from 'react';
import Canvas from "./Canvas";
import Messages from './Messages';
import LeaderBoard from './LeaderBoard';
import Timer from "./Timer";
import Clock from './Clock';
import Word from './Word';
import Gameover from './Gameover';

const Room = ({ roomId }) => {
    return (
        <>
            <div className='max-w-5xl m-auto flex flex-col '>
                <Clock />
                <Word />
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