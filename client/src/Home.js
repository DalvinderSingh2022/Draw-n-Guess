import React, { useEffect, useState } from 'react';
import { socket } from './App';

import { FaUsers } from "react-icons/fa";

const Home = () => {
    const [userName, setUserName] = useState('');
    const [roomId, setRoomId] = useState(undefined);
    const [publicRooms, setPublicRooms] = useState([]);
    const [create, setCreate] = useState(false);
    const [image, setImage] = useState();

    const joinRoom = (event) => {
        event.preventDefault();
        const Id = event.target.getAttribute("data-roomid") || (roomId);

        socket.emit("add loading", `Searching for Room id:${roomId}`);
        localStorage.setItem("userObj", JSON.stringify({ userName, image }));
        socket.emit("join room", parseInt(Id), userName, image);
    }

    const hostRoom = (event) => {
        event.preventDefault();
        const { maxPlayers, maxRounds, drawTime, roomType } = event.target;

        socket.emit("add loading", 'Hosting a new Room');
        localStorage.setItem("userObj", JSON.stringify({ userName, image }));
        socket.emit("host room", userName, image, maxPlayers.value, maxRounds.value, drawTime.value, roomType.checked,);
    }

    useEffect(() => {
        socket.emit("add loading", 'Checking for previous user');
        if (localStorage.getItem("userObj")) {
            const { userName, image } = JSON.parse(localStorage.getItem("userObj"));
            setUserName(userName);
            setImage(image);
        } else {
            setUserName("Player" + (new Date().getTime().toString()).slice(-6));
        }
        socket.emit("add loading", false);
    }, []);

    useEffect(() => {
        socket.emit("get public rooms");
        socket.on("public rooms", (rooms) => {
            setPublicRooms(rooms);
        });

        return () => socket.off("public rooms");
    }, []);

    return (
        <div className="max-w-2xl m-auto py-12 px-2">

            <div className="flex flex-col items-center mb-12">
                <label htmlFor="image">
                    <input className='hidden' name='image' id='image' accept='image/*' type="file" onChange={(e) => setImage(URL.createObjectURL(e.target?.files?.[0]))} />
                    <img
                        className='w-40 aspect-square rounded-t-full ring-4 ring-yellow-400 cursor-pointer bg-white'
                        src={image}
                        alt={userName}
                        onError={(e) => e.target.src = "https://as1.ftcdn.net/v2/jpg/00/64/67/52/1000_F_64675209_7ve2XQANuzuHjMZXP3aIYIpsDKEbF5dD.jpg"}
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
                </div>
            </div>

            <div className="m-auto mt-12 container">
                <div className="heading primary items-center">
                    <div>Join Room</div>
                    <button onClick={() => setCreate(true)} className="button secondary px-5 py-1 rounded-xl -mr-3">Create</button>
                </div>
                <form onSubmit={event => joinRoom(event)} className="flex justify-center p-8">
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
            </div>

            <div className="m-auto mt-8 container">
                <div className="heading primary text-center">Public Rooms</div>
                <div className="flex flex-col gap-3 px-6 py-4">
                    {publicRooms.length ?
                        publicRooms.map(room =>
                            <div onClick={joinRoom} data-roomid={room.id} key={room.id} className='cursor-pointer primary text-xl font-bold  px-5 py-3 rounded-xl flex flex-wrap justify-between items-center'>
                                <span>Room Id: {room.id}</span>
                                <div className="flex gap-2">
                                    <span>Round {room.round} of {room.maxRounds}</span> |
                                    <span className='flex items-center gap-2'><FaUsers /> {room.players.length}/{room.maxPlayers}</span>
                                </div>
                            </div>)
                        : <div className='text-center text-xl text-yellow-500'>No Public Room Available</div>
                    }
                </div>
            </div>

            {create &&
                <div className='fixed_container justify-center bg-blue-200/50 items-center'>
                    <form onSubmit={hostRoom} className='mx-4 bg-white w-full max-w-xl border-b-4 border-orange-400 rounded-2xl animate-popin'>
                        <div className='heading secondary items-center'>
                            <div>Create Room</div>
                            <button onClick={() => setCreate(false)} className="button primary px-5 py-1 rounded-xl -mr-3">Back</button>
                        </div>

                        <div className="flex flex-col items-center gap-2 py-4 px-8">

                            <label htmlFor="drawTime" className="w-full flex justify-between items-center">
                                <span className='text-black/90 text-2xl font-bold'>DrawTime</span>
                                <input
                                    required
                                    type="number"
                                    name="drawTime"
                                    id="drawTime"
                                    min={10}
                                    max={300}
                                    placeholder='60 sec'
                                    className='input w-32 focus:border-b-orange-400' />
                            </label>

                            <label htmlFor="maxPlayers" className="w-full flex justify-between items-center">
                                <span className='text-black/90 text-2xl font-bold'>Players</span>
                                <input
                                    required
                                    type="number"
                                    name="maxPlayers"
                                    id="maxPlayers"
                                    min={2}
                                    max={30}
                                    placeholder='5'
                                    className='input w-20 focus:border-b-orange-400' />
                            </label>

                            <label htmlFor="maxRounds" className="w-full flex justify-between items-center">
                                <span className='text-black/90 text-2xl font-bold'>Rounds</span>
                                <input
                                    required
                                    type="number"
                                    name="maxRounds"
                                    id="maxRounds"
                                    min={1}
                                    max={20}
                                    placeholder='5'
                                    className='input w-20 focus:border-b-orange-400' />
                            </label>

                            <label htmlFor="roomType" className="w-full flex justify-between items-center">
                                <span className='text-black/90 text-2xl font-bold'>Public</span>
                                <input
                                    type="checkbox"
                                    name="roomType"
                                    id="roomType"
                                    className='mt-1 appearance-none w-16 h-8 bg-gray-200 rounded-full relative cursor-pointer transition-all before:absolute before:bg-white before:h-6 before:rounded-full before:w-6 before:top-1 before:left-1 checked:bg-orange-400 checked:before:left-9' />
                            </label>

                            <button className='button secondary rounded-xl px-6 py-2'>host</button>
                        </div>

                    </form>
                </div>
            }

        </div>
    )
}

export default Home;