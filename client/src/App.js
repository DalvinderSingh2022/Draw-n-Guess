import React, { useEffect, useState } from 'react';
import Home from './Home';
import NavBar from './NavBar';

import { io } from 'socket.io-client';
import Waittingroom from './Waittingroom';
export const socket = io.connect('https://drawnguessbackend.onrender.com/');

const App = () => {
    const [joined, setJoined] = useState(false);

    useEffect(() => {
        socket.on("joined", (room) => {
            setJoined(true);
        });

        return () => socket.off("joined");
    }, []);

    return (
        <main className='bg-[url("https://cdn.dribbble.com/users/644659/screenshots/2172516/11111-02.png")] bg-no-repeat bg-cover bg-[top_center] min-h-screen'>
            <NavBar />
            {
                joined
                    ? <Waittingroom />
                    : <Home />
            }
        </main>
    )
}

export default App;