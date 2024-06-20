import React from 'react';
import Canvas from "./Canvas"

const Room = () => {
    return (
        <div>
            <Canvas />
            {/* <div>
                <span className="flex justify-between text-2xl font-bold bg-orange-400 text-white px-6 py-2 rounded-2xl border-orange-500 border-b-4">
                    <span>{room?.players.length < room?.maxPlayers ? "Waiting for players..." : "Room is Full"}</span>
                    <span>{room?.players.length}/{room?.maxPlayers}</span>
                </span>
            </div> */}
        </div>
    )
}

export default Room;