import React, { useEffect, useState } from 'react';
import { socket } from './App';

const Home = () => {
    const [userName, setUserName] = useState("Player");
    const [roomId, setRoomId] = useState(undefined);
    const [image, setImage] = useState();

    // const joinPublicRoom = () => {
    //     // socket.emit('join public room', userName);
    // }

    const joinRoom = (event) => {
        event.preventDefault();
        if (!userName) {
            alert("userName can't be null");
            return;
        }

        socket.emit("join room", roomId, userName, image);
    }

    const hostRoom = () => {
        if (!userName) {
            alert("userName can't be null");
            return;
        }

        socket.emit("host room", userName, image);
    }

    useEffect(() => {
        socket.on("invalid room", (msg) => {
            alert(msg);
        });

        return () => socket.off("invalid room")
    }, []);

    return (
        <div className="max-w-2xl m-auto py-12 px-2">

            <div className="flex flex-col items-center mb-12">
                <label htmlFor="image">
                    <input className='hidden' name='image' id='image' accept='image/*' type="file" onChange={(e) => setImage(URL.createObjectURL(e.target.files?.[0]))} />
                    <img
                        className='w-40 aspect-square rounded-t-full ring-4 ring-yellow-400 cursor-pointer bg-white'
                        src={image || "https://as1.ftcdn.net/v2/jpg/00/64/67/52/1000_F_64675209_7ve2XQANuzuHjMZXP3aIYIpsDKEbF5dD.jpg"}
                        alt={userName}
                    />
                </label>
                <div>
                    <input
                        required
                        type="text"
                        value={userName}
                        onChange={e => setUserName(e.target.value)}
                        placeholder='Player2019'
                        className="input rounded-2xl focus:border-yellow-400 "
                    />

                    {/* <button onClick={joinPublicRoom} className="button primary px-6 py-2 rounded-xl">Start</button> */}
                </div>
            </div>

            <div className="m-auto mt-12 container">
                <div className="heading primary">Private Room</div>
                <div>
                    <div className="flex flex-wrap gap-2 justify-center p-10">
                        <form onSubmit={event => joinRoom(event)} className='flex'>
                            <input
                                required
                                min={1000}
                                max={9999}
                                type="number"
                                value={roomId}
                                onChange={e => setRoomId(parseInt(e.target.value))}
                                placeholder='eg. 1234'
                                className="input w-64 rounded-l-xl  focus:border-b-yellow-600"
                            />
                            <button className="button primary px-6 py-2 rounded-r-xl">Join</button>
                        </form>

                        <button onClick={hostRoom} className="button secondary px-6 py-2 rounded-xl">host</button>
                    </div>
                </div>

            </div>

        </div>
    )
}

export default Home;