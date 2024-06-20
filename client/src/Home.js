import React, { useEffect, useState } from 'react';
import { socket } from './App';

const Home = () => {
    const [userName, setUserName] = useState("player");
    const [roomId, setRoomId] = useState(undefined);

    // const joinPublicRoom = () => {
    //     // socket.emit('join public room', userName);
    // }

    const joinRoom = (event) => {
        event.preventDefault();
        if (!userName) {
            alert("userName can't be null");
            return;
        }

        socket.emit("join room", roomId, userName);
    }

    const hostRoom = () => {
        if (!userName) {
            alert("userName can't be null");
            return;
        }

        socket.emit("host room", userName);
    }

    useEffect(() => {
        socket.on("invalid room", (msg) => {
            alert(msg);
        });

        return () => socket.off("invalid room")
    }, []);

    return (
        <div className="max-w-2xl m-auto py-12 flex flex-col justify-center gap-12">

            <div className="flex flex-col items-center">
                <img
                    className='w-36 aspect-square rounded-t-full ring-4 ring-yellow-400'
                    src="https://as1.ftcdn.net/v2/jpg/00/64/67/52/1000_F_64675209_7ve2XQANuzuHjMZXP3aIYIpsDKEbF5dD.jpg"
                    alt={userName}
                />
                <div>
                    <input
                        required
                        type="text"
                        value={userName}
                        onChange={e => setUserName(e.target.value)}
                        placeholder='player292'
                        className="appearance-none px-4 py-2 rounded-xl transition-all text-xl font-bolder outline-none text-center focus:border-b-yellow-600 border-b-4"
                    />

                    {/* <button onClick={joinPublicRoom} className="cursor-pointer transition-all text-xl font-semibold bg-yellow-500 text-white px-8 py-2 rounded-r-xl border-yellow-600 border-b-4 hover:brightness-110 hover:-translate-y-1 hover:border-b-4 active:border-b-2 active:brightness-90 active:translate-y-1">Start</button> */}
                </div>
            </div>

            <div className="flex flex-col m-auto bg-blue-100 rounded-2xl w-full border-yellow-400 border-b-4 justify-center">
                <span className=" transition-all text-2xl font-bold bg-yellow-400 text-white px-6 py-2 rounded-2xl border-yellow-500 border-b-4">Private Room</span>
                <div>
                    <div className="flex m-auto gap-2 justify-center p-6">
                        <form onSubmit={event => joinRoom(event)}>
                            <input
                                required
                                min={1000}
                                max={9999}
                                type="number"
                                value={roomId}
                                onChange={e => setRoomId(parseInt(e.target.value))}
                                placeholder='eg. 1234'
                                className="appearance-none px-4 py-2 w-64 rounded-l-xl transition-all text-xl font-bolder outline-none text-center focus:border-b-yellow-600 border-b-4"
                            />
                            <button className="cursor-pointer transition-all text-xl font-semibold bg-yellow-500 text-white px-6 py-2 rounded-r-xl border-yellow-600 border-b-4 hover:brightness-110 hover:-translate-y-1 hover:border-b-4 active:border-b-2 active:brightness-90 active:translate-y-1">Join</button>
                        </form>

                        <button onClick={hostRoom} className="cursor-pointer transition-all text-xl font-semibold bg-orange-500 text-white px-6 py-2 rounded-xl border-orange-600 border-b-4 hover:brightness-110 hover:-translate-y-1 hover:border-b-4 active:border-b-2 active:brightness-90 active:translate-y-1">host</button>
                    </div>
                </div>

            </div>

        </div>
    )
}

export default Home;