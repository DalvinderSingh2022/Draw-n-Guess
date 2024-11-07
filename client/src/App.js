import React, { useEffect, useState } from 'react';
import Home from './Home';
import NavBar from './NavBar';
import Waittingroom from './Waittingroom';
import Loading from './Loading';
import Modal from './Modal';

import { io } from 'socket.io-client';
export const socket = io.connect(process.env.REACT_APP_BACKEND_URL);

const App = () => {
    const [joined, setJoined] = useState(false);

    useEffect(() => {
        socket.on("joined", (room) => {
            setJoined(true);
        });
        socket.on("leaved", (room) => {
            setJoined(false);
        });

        return () => {
            socket.off("joined");
            socket.off("leaved");
        };
    }, []);

    return (
        <main className='bg-[url("https://cdn.dribbble.com/users/644659/screenshots/2172516/11111-02.png")] bg-no-repeat bg-cover bg-[top_center] min-h-screen'>
            <NavBar />
            {
                joined
                    ? <Waittingroom />
                    : <Home />
            }
            <Loading />
            <Modal />
        </main>
    )
}

export default App;