import React, { useEffect, useState } from 'react';
import { socket } from './App';
import Cookies from 'js-cookie';

import { FaUsers } from "react-icons/fa";
import { RiDiceLine, RiImageAddLine } from "react-icons/ri";

const userImages = [
    'https://img.freepik.com/premium-vector/senior-man-avatar-smiling-elderly-man-with-beard-with-gray-hair-3d-vector-people-character-illustration-cartoon-minimal-style_365941-810.jpg',
    'https://img.freepik.com/premium-vector/young-smiling-man-adam-avatar-3d-vector-people-character-illustration-cartoon-minimal-style_365941-687.jpg',
    'https://img.freepik.com/premium-vector/happy-young-woman-watching-into-rounded-frame-isolated-white-illustration-render-style_365941-118.jpg',
    'https://img.freepik.com/premium-vector/young-smiling-woman-mia-avatar-3d-vector-people-character-illustration-cartoon-minimal-style_365941-792.jpg',
    'https://img.freepik.com/premium-vector/3d-vector-young-smiling-woman-with-light-sin-tone-brown-short-hair-user-avatar_624031-153.jpg',
    'https://img.freepik.com/premium-vector/young-smiling-woman-jane-peeking-out-looking-from-round-hole-searching-concept-3d-vector-people-character-illustrationcartoon-minimal-style_365941-739.jpg',
    'https://www.shutterstock.com/image-vector/young-smiling-indian-woman-traditional-600nw-2267275547.jpg',
    'https://www.shutterstock.com/image-vector/smiling-old-woman-senior-lady-600nw-2271040901.jpg',
    'https://www.shutterstock.com/image-vector/young-smiling-african-man-avatar-600nw-2264981753.jpg',
    'https://www.shutterstock.com/image-vector/young-smiling-man-avatar-brown-600nw-2261401207.jpg',
]

const Home = () => {
    const [roomId, setRoomId] = useState(undefined);
    const [publicRooms, setPublicRooms] = useState(null);
    const [create, setCreate] = useState(false);
    const [user, setUser] = useState({
        name: '',
        image: userImages[Math.floor(Math.random() * userImages.length)]
    });

    const joinRoom = (roomId, event) => {
        event.preventDefault();
        const { name: userName, image } = user;

        socket.emit("add loading", `Searching for Room id:${roomId}`);
        socket.emit("join room", roomId, userName, image);
    }

    const hostRoom = (event) => {
        event.preventDefault();
        const { maxPlayers, maxRounds, drawTime, roomType, roomName } = event.target;
        const { name: userName, image } = user;

        socket.emit("add loading", 'Hosting a new Room');
        socket.emit("host room", userName, image, maxPlayers.value, maxRounds.value, drawTime.value, roomType.checked, roomName.value);
    }

    const getImageUrl = async (e) => {
        if (!e.target.files.length) {
            return;
        }

        socket.emit("add loading", 'Uploading Image');
        const formData = new FormData();
        formData.append("file", e.target.files[0]);
        formData.append("upload_preset", "Draw-n-guess");
        formData.append("cloud_name", "dydaxtrzd");

        try {
            const response = await fetch(`https://api.cloudinary.com/v1_1/dydaxtrzd/image/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            return data.url;
        } catch (error) {
            console.error("Error uploading image:", error);
        } finally {
            socket.emit("add loading", false);
        }
    };

    const handleChange = async (e) => {
        const name = e.target.name;
        if (name === 'image') {
            const url = await getImageUrl(e);
            handleImage(url);
            return;
        }

        setUser(prev => ({ ...prev, [name]: e.target.value }));
        Cookies.set('drawnguess', JSON.stringify({ ...user, [name]: e.target.value }), { expires: 7 });
    }

    const handleImage = (url) => {
        if (url) {
            setUser(prev => ({ ...prev, image: url }));
            Cookies.set('drawnguess', JSON.stringify({ ...user, image: url }), { expires: 7 });
        }
    }

    useEffect(() => {
        const userCookies = Cookies.get('drawnguess');
        if (userCookies) {
            setUser(JSON.parse(userCookies));
        }
    }, []);

    useEffect(() => {
        socket.emit("get public rooms");
        socket.on("public rooms", (rooms) => {
            setPublicRooms(rooms);
        });

        return () => socket.off("public rooms");
    }, []);

    return (
        <div className="max-w-2xl m-auto py-8 px-2">
            <div className="flex flex-col items-center">
                <div className="relative">
                    <label htmlFor="image" title='upload Image' className='button primary rounded-full p-2 absolute -right-1'>
                        <RiImageAddLine />
                    </label>
                    <button title='random' className='button primary rounded-full p-2 absolute -right-5 top-10' onClick={() => handleImage(userImages[Math.floor(Math.random() * userImages.length)])}>
                        <RiDiceLine />
                    </button>
                    <input className='hidden' name='image' id='image' accept='image/*' type="file" onChange={handleChange} />
                    <img
                        className='w-40 aspect-square rounded-t-full ring-4 ring-yellow-400 bg-white'
                        src={user.image}
                        alt={user.name}
                    />
                </div>
                <input
                    type="text"
                    name='name'
                    value={user.name}
                    onChange={handleChange}
                    placeholder='username...'
                    className="input rounded-2xl focus:border-yellow-400 relative -mt-1"
                />
            </div>

            <div className="m-auto mt-10 container">
                <div className="heading primary items-center">
                    <div>Join Room</div>
                    <button onClick={() => setCreate(true)} className="button secondary px-5 py-1 rounded-xl -mr-3">Create</button>
                </div>
                <form onSubmit={(event) => joinRoom(roomId, event)} className="flex justify-center p-8">
                    <input
                        required
                        id='roomId'
                        pattern='[0-9]{4}'
                        type="number"
                        value={roomId}
                        onChange={e => setRoomId(e.target.value)}
                        placeholder='eg. 1234'
                        className="input w-64 rounded-l-xl  focus:border-b-yellow-600"
                    />
                    <button className="button primary px-6 py-2 rounded-r-xl">Join</button>
                </form>
            </div>

            <div className="m-auto mt-8 container">
                <div className="heading primary text-center">Public Rooms</div>
                <div className="flex flex-col gap-3 px-6 py-4">
                    {publicRooms ? (publicRooms.length ?
                        publicRooms.map(room =>
                            <div onClick={(event) => joinRoom(room.id, event)} key={room.id} className='cursor-pointer primary text-xl font-bold px-5 py-2 rounded-xl flex flex-wrap justify-between items-center'>
                                <div className="flex flex-col">
                                    <span className='text-2xl'>{room.roomName}</span>
                                    <span className='text-sm'>Round {room.round} of {room.maxRounds}</span>
                                </div>
                                <span className='flex items-center gap-2'>
                                    <FaUsers />
                                    {room.players.length}/{room.maxPlayers}
                                </span>
                            </div>)
                        : <div className='text-center text-xl text-yellow-500'>No Public Room Available</div>
                    ) : <div className="rounded-full border-4 border-transparent border-b-yellow-500 w-8 aspect-square animate-spin m-auto"></div>}
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

                            <label htmlFor="roomName" className="w-full flex justify-between items-center">
                                <input
                                    required
                                    type="text"
                                    name="roomName"
                                    id="roomName"
                                    placeholder='Room name'
                                    className='input m-auto focus:border-b-orange-400' />
                            </label>

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