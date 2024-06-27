import React, { useEffect, useState } from 'react';
import { socket } from './App';

const Loading = () => {
    const [loading, setLoading] = useState('Connecting To Server');

    useEffect(() => {
        socket.on("set loading", (loadingMsg) => {
            setLoading(loadingMsg);
        });

        socket.on("connected", () => {
            setLoading(false);
        });

        return () => {
            socket.off("set loading");
            socket.off("connected");
        };
    }, [loading]);

    return (
        loading
            ?
            <div className='fixed_container justify-start items-center bg-transparent'>
                <div className='mx-2 h-fit pb-6 pt-8 px-8 bg-blue-200/50 backdrop-blur rounded-b-2xl flex gap-4 items-center'>
                    <div className="rounded-full border-4 border-transparent border-b-orange-500 h-8 aspect-square animate-spin"></div>
                    <div className='text-xl capitalize font-semibold text-orange-500 text-center'>{loading}</div>
                </div>
            </div>
            : null
    )
}

export default Loading;