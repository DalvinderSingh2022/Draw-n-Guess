import React, { useEffect, useState } from 'react';
import { socket } from './App';

const Modal = () => {
    const [alert, setAlert] = useState('');

    useEffect(() => {
        socket.on("set alert", (alertMsg) => {
            socket.emit("add loading", false);
            setAlert(alertMsg);
        });

        return () => socket.off("set alert");
    }, []);

    return (
        alert ?
            <div className='fixed_container justify-center bg-blue-200/50 items-center'>
                <div className='mx-4 bg-white min-w-96 border-b-4 border-orange-400 rounded-2xl flex items-center flex-col animate-popin'>
                    <div className="heading secondary">Alert</div>
                    <div className="flex flex-col items-center px-12 gap-6 py-4">
                        <div className='text-2xl capitalize font-semibold text-orange-500 text-center'>{alert}</div>
                        <button onClick={() => setAlert(false)} className='button secondary rounded-xl px-3 py-1.5'>Okay</button>
                    </div>
                </div>
            </div>
            : null
    )
}

export default Modal;