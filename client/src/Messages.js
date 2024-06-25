import React, { useEffect, useRef, useState } from 'react';
import { socket } from './App';

const messagStyle = {
    you: "rounded-br-none bg-blue-500 self-end",
    others: "rounded-bl-none bg-white self-start text-black",
    event: "bg-yellow-500",
    alert: "bg-red-500",
    points: "bg-green-500"
}

const Messages = ({ roomId }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const messagesRef = useRef(null);

    useEffect(() => {
        messagesRef?.current.addEventListener('DOMNodeInserted', event => {
            const { currentTarget: target } = event;
            target.scroll({ top: target.scrollHeight, behavior: 'smooth' });
        });
    }, []);

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
        <div className='w-full md:w-1/2  bg-blue-200/50 backdrop-blur rounded-2xl border-yellow-400 border-b-4 shadow-xl'>
            <div className="w-full text-center text-2xl font-bold bg-yellow-400 text-white px-6 py-2 rounded-2xl border-yellow-500 border-b-4">Messages</div>

            <div className='flex flex-col h-96 overflow-y-auto px-4 py-2 gap-2' ref={messagesRef}>
                {messages.map((message, index) => (
                    <div key={index} className={`${messagStyle[message.type]} self-center text-white rounded-full px-4 py-1 w-fit`}>{message.sender && (message.sender + ": ")}{message.text}</div>
                ))}
            </div>

            <form onSubmit={event => handleSubmit(event)} className='flex'>
                <input
                    required
                    type="text"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder='Message...'
                    className="w-full px-4 py-2 rounded-b-xl text-lg font-bolder outline-none"
                />
            </form>
        </div>
    )
}

export default Messages;