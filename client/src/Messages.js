import React, { useEffect, useState } from 'react';
import { socket } from './App';

const messagStyle = {
    you: "rounded-br-none bg-blue-500 self-end",
    others: "rounded-bl-none bg-white self-start text-black/90",
    event: "bg-yellow-500 self-center",
    alert: "bg-red-500 self-center",
    points: "bg-green-500 self-center"
}

const Messages = ({ roomId }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        socket.on('update messages', (text, type, sender) => {
            setMessages([...messages, { text, sender, type }]);
        });

        return () => socket.off("update messages");
    }, [messages]);

    const handleSubmit = (event) => {
        event.preventDefault();

        if (message) {
            socket.emit('new message', message, roomId);
            setMessage('');
        }
    };

    return (
        <div className='md:w-1/2 container mx-auto h-96 flex flex-col justify-between'>
            <div className="heading primary">
                <span>Messages</span>
                <span>Rood Id: {roomId}</span>
            </div>

            <div className='flex flex-col overflow-y-auto p-2 gap-1 mb-auto'>
                {messages.map((message, index) => (
                    <div key={index} className={`rounded-3xl px-4 py-0.5 w-fit ${messagStyle[message.type]}`}>{message.sender && (message.sender + ": ")}{message.text}</div>
                ))}
            </div>

            <form onSubmit={event => handleSubmit(event)} className='flex'>
                <input
                    required
                    type="text"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder='Message...'
                    className="w-full px-4 py-2 rounded-b-xl text-lg font-semibold outline-none text-black/90"
                />
            </form>
        </div>
    )
}

export default Messages;