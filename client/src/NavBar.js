import React, { useEffect, useState } from 'react';
import { socket } from './App';
import Clock from './Clock';

const NavBar = () => {
    const [room, setRoom] = useState(null);
    const [show, setShow] = useState(false);

    useEffect(() => {
        socket.on("updated room", (room) => {
            setRoom(room);
        });

        socket.on("new word", (room, show) => {
            setRoom(room);
            setShow(show);
        });

        socket.on("leaved", (room) => {
            setRoom({ ...room, currentWord: '' });
        });

        return () => {
            socket.off("updated room");
            socket.off("new word");
            socket.off("leaved");
        }
    }, []);

    return (
        <nav className={`${room?.currentWord ? "py-2" : "py-6"} px-2 mdpx-6 text-center relative  text-3xl font-bold m-auto primary`}>
            {room?.currentWord
                ?
                <div className='max-w-4xl m-auto flex items-center justify-between'>
                    <Clock />
                    <div className='self-center'>{room?.currentWord && room.currentWord.split('').map(alphabet => show ? (alphabet.toUpperCase() + " ") : "_ ")}<sup>{room?.currentWord && room.currentWord.length}</sup></div>
                    <span>{room.round}/{room.maxRounds} </span>
                </div>
                : "Draw 'n Guess"}
        </nav>
    )
}

export default NavBar;