import React, { useEffect, useState } from 'react';
import { socket } from './App';

const Modal = () => {
    const [alert, setAlert] = useState('');

    useEffect(() => {
        socket.on("set alert", (alertMsg) => {
            setAlert(alertMsg);
        });

        return () => socket.off("set alert");
    }, []);

    const handelClick = () => {
        socket.emit("add loading", false);
        setAlert(false);
    }

    return (
        alert ?
            <div className='fixed_container justify-center bg-blue-200/50 items-center'>
                <div className='mx-4 bg-white min-w-96 border-b-4 border-yellow-400 rounded-xl px-12 py-6 flex items-center flex-col gap-6 animate-popin'>
                    <div className='text-2xl capitalize font-semibold text-yellow-500 text-center'>{alert}</div>
                    <button onClick={handelClick} className='button primary rounded-2xl px-6 py-2'>Okay</button>
                </div>
            </div>
            : null
    )
}

export default Modal;