import React, { useEffect, useRef, useState } from 'react';
import { socket } from './App';

const Messages = ({ roomId }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const messagesRef = useRef(null);

    useEffect(() => {
        socket.on('update messages', (text, sender) => {
            setMessages([...messages, { text, sender }]);
        });
    }, [messages]);

    const handleSubmit = (event) => {
        event.preventDefault();

        if (message) {
            socket.emit('new message', message, roomId);
            setMessage('');
        }
    };

    return (
        <div className='w-full md:w-1/2 bg-blue-100 rounded-2xl flex flex-col justify-between'>
            <span className="flex justify-center text-xl font-bold bg-orange-400 text-white px-6 py-2 rounded-2xl border-orange-500 border-b-4">Messages</span>

            <div className='flex flex-col h-96 overflow-y-auto' ref={messagesRef}>
                {messages.map(message => (
                    <div className='bg-blue-200 border-blue-300 py-1 px-2 text-normal border-y-[1px] text-wrap'>{message.sender + ": "}{message.text}</div>
                ))}
            </div>

            <form onSubmit={event => handleSubmit(event)} className='flex'>
                <input
                    required
                    type="text"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder='enter'
                    className="w-full px-4 py-2 rounded-xl transition-all text-md font-bolder outline-none focus:border-b-yellow-400 border-b-4"
                />
            </form>
        </div>
    )
}

export default Messages;